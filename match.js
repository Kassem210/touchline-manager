/* Touchline — match engine. One minute-by-minute model used by quick sims and the live viewer. */
"use strict";

const W_ATT = { GK: 0, CB: 0.1, LB: 0.3, RB: 0.3, DM: 0.2, CM: 0.45, AM: 0.8, LW: 0.9, RW: 0.9, ST: 1 };
const W_DEF = { GK: 1.6, CB: 1, LB: 0.8, RB: 0.8, DM: 0.7, CM: 0.4, AM: 0.15, LW: 0.1, RW: 0.1, ST: 0.05 };
const W_MID = { GK: 0, CB: 0.1, LB: 0.3, RB: 0.3, DM: 0.9, CM: 1, AM: 0.8, LW: 0.4, RW: 0.4, ST: 0.15 };
const SCORE_W = { GK: 0.01, CB: 3, LB: 2, RB: 2, DM: 3, CM: 5.5, AM: 10, LW: 11, RW: 11, ST: 18 };
const ASSIST_W = { GK: 0.3, CB: 1, LB: 4, RB: 4, DM: 4, CM: 8, AM: 12, LW: 11, RW: 11, ST: 7 };
const FOUL_W = { GK: 0.2, CB: 3, LB: 2, RB: 2, DM: 3, CM: 2, AM: 1, LW: 1, RW: 1, ST: 1.2 };
const MENT_OWN = [0.78, 1, 1.18], MENT_OPP = [0.85, 1, 1.12];
const CHANCE_K = 2.7;

function isUserSide(cid) { return G.mode === "manager" && cid === G.userClub; }

function createMatch(f, opts = {}) {
  const m = { f, min: 0, g: [0, 0], ev: [], shots: [0, 0], sot: [0, 0], possA: 0, possN: 0, rt: {}, goals: {}, ast: {}, yel: {}, onAt: {}, offAt: {}, phase: "1H",
    stop1: ri(1, 4), stop2: ri(2, 6), live: !!opts.live, done: false, et: false, pen: null, inj: [] };
  m.sides = [f.h, f.a].map((cid) => {
    const c = club(cid);
    const lu = isUserSide(cid) && !c.auto ? validateUserLineup(c) : autoLineup(c);
    const form = FORMATIONS[c.form];
    const on = [];
    lu.xi.forEach((pid, i) => { if (pid != null) on.push({ pid, pos: form[i] }); });
    return { cid, on, bench: lu.bench.slice(), subs: 0, maxSubs: 5, ment: isUserSide(cid) ? c.ment : 1, reds: 0, form: 1 + randn() * 0.08, user: isUserSide(cid) };
  });
  m.sides.forEach((s) => s.on.forEach((o) => { m.rt[o.pid] = 6.4; m.onAt[o.pid] = 0; }));
  calcStrength(m);
  return m;
}

function sideStrength(s) {
  let a = 0, aw = 0, d = 0, dw = 0, md = 0, mw = 0;
  for (const o of s.on) {
    const p = pl(o.pid);
    const e = (effAt(p, o.pos) * (0.88 + 0.12 * p.fit / 100) + (p.mor - 70) * 0.03) * (p.inj > 0 ? 0.85 : 1);
    a += e * W_ATT[o.pos]; aw += W_ATT[o.pos]; d += e * W_DEF[o.pos]; dw += W_DEF[o.pos]; md += e * W_MID[o.pos]; mw += W_MID[o.pos];
  }
  const short = Math.pow(Math.min(1, s.on.length / 11), 1.6);
  return { att: (a / (aw || 1)) * s.form * short, def: (d / (dw || 1)) * s.form * short, mid: (md / (mw || 1)) * s.form * short };
}
function calcStrength(m) {
  const [A, B] = m.sides.map(sideStrength);
  m.str = [A, B];
  const neutral = m.f.n;
  const ha = neutral ? [1, 1] : [1.12, 0.9];
  const lam = (x, y, i) => 1.25 * Math.exp(0.024 * (x.att - y.def) + 0.01 * (x.mid - y.mid)) * ha[i] * MENT_OWN[m.sides[i].ment] * MENT_OPP[m.sides[1 - i].ment];
  m.lam = [lam(A, B, 0), lam(B, A, 1)];
  m.possShare = clamp(0.5 + (A.mid - B.mid) * 0.012 + (m.sides[0].ment - m.sides[1].ment) * 0.03 + (neutral ? 0 : 0.02), 0.28, 0.72);
}

function wPickOn(list, wf) { return wpick(list.map((o) => [o, Math.max(0.0001, wf(o))])); }
function gkOf(s) { return s.on.find((o) => o.pos === "GK") || s.on[0]; }

function addEv(m, e) { e.m = m.min; m.ev.push(e); return e; }

// Advance one minute. Returns events created this minute.
function stepMatch(m) {
  if (m.done || m.phase === "HT" || m.phase === "ETB") return [];
  const n0 = m.ev.length;
  m.min++;
  const etPhase = m.phase === "ET";
  const rate = etPhase ? 0.85 : 1;
  m.possA += m.possShare; m.possN++;
  for (let s = 0; s < 2; s++) {
    const side = m.sides[s], opp = m.sides[1 - s];
    if (!side.on.length) continue;
    // chance
    if (rnd() < (m.lam[s] / 90) * CHANCE_K * rate) {
      m.shots[s]++;
      const sh = wPickOn(side.on, (o) => SCORE_W[o.pos] * Math.pow(pl(o.pid).a[1] / 70, 2));
      const sp = pl(sh.pid), gk = gkOf(opp), gp = gk ? pl(gk.pid) : null;
      const conv = (1 / CHANCE_K) * clamp(1 + (sp.a[1] - 70) * 0.012 - ((gp && gk.pos === "GK" ? gp.a[6] : 40) - 70) * 0.01, 0.5, 1.7);
      const r = rnd();
      if (r < conv) {
        m.sot[s]++; m.g[s]++;
        let ap = null;
        if (rnd() < 0.75 && side.on.length > 1) ap = wPickOn(side.on.filter((o) => o.pid !== sh.pid), (o) => ASSIST_W[o.pos] * (pl(o.pid).a[2] / 70)).pid;
        m.goals[sh.pid] = (m.goals[sh.pid] || 0) + 1; m.rt[sh.pid] += m.goals[sh.pid] > 1 ? 0.8 : 1.1;
        if (ap) { m.ast[ap] = (m.ast[ap] || 0) + 1; m.rt[ap] += 0.6; }
        if (gk) m.rt[gk.pid] -= 0.3;
        opp.on.forEach((o) => { if (["CB", "LB", "RB"].includes(o.pos)) m.rt[o.pid] -= 0.12; });
        addEv(m, { t: "goal", s, p: sh.pid, a: ap, sc: m.g.slice() });
      } else if (r < conv + 0.33) {
        m.sot[s]++;
        if (gk) m.rt[gk.pid] += 0.18;
        addEv(m, { t: "save", s, p: sh.pid, k: gk && gk.pid });
      } else {
        m.rt[sh.pid] -= 0.05;
        if (m.live) addEv(m, { t: rnd() < 0.3 ? "block" : "miss", s, p: sh.pid });
      }
    }
    // discipline
    if (rnd() < 0.016) {
      const o = wPickOn(side.on, (o) => FOUL_W[o.pos] * (1 + (pl(o.pid).a[4] < 50 ? 0.3 : 0)));
      if (m.yel[o.pid]) { sendOff(m, s, o, true); }
      else { m.yel[o.pid] = 1; m.rt[o.pid] -= 0.2; addEv(m, { t: "yc", s, p: o.pid }); }
    } else if (rnd() < 0.0003) {
      const o = wPickOn(side.on, (o) => FOUL_W[o.pos]); sendOff(m, s, o, false);
    }
    // injury
    if (rnd() < 0.0009) {
      const o = pick(side.on); const p = pl(o.pid);
      if (!m.inj.includes(o.pid)) {
        m.inj.push(o.pid);
        p.inj = Math.max(p.inj, Math.round(wpick([[ri(3, 9), 5], [ri(10, 25), 3], [ri(26, 70), 1.2], [ri(90, 200), 0.25]])));
        addEv(m, { t: "inj", s, p: o.pid, days: p.inj });
        if (!side.user || !m.live) autoSubFor(m, s, o, "inj");
      }
    }
  }
  // colour commentary for the live viewer
  if (m.live && rnd() < 0.16) {
    const s = rnd() < m.possShare ? 0 : 1, side = m.sides[s];
    if (side.on.length) {
      const o = pick(side.on);
      addEv(m, { t: "note", s, p: o.pid, k: ri(0, 9) });
    }
  }
  // AI substitutions
  for (let s = 0; s < 2; s++) {
    const side = m.sides[s];
    if (side.user && m.live) continue;
    if ((m.min === 60 || m.min === 70 || m.min === 80 || (m.phase === "ET" && m.min === 100)) && side.subs < side.maxSubs) {
      const cnt = m.min === 60 ? ri(1, 2) : 1;
      for (let k = 0; k < cnt; k++) {
        const cand = side.on.filter((o) => o.pos !== "GK").sort((a, b) => (m.rt[a.pid] + pl(a.pid).fit / 60) - (m.rt[b.pid] + pl(b.pid).fit / 60))[0];
        if (cand) autoSubFor(m, s, cand, "tac");
      }
    }
  }
  // phase transitions
  if (m.phase === "1H" && m.min >= 45 + m.stop1) { m.phase = "HT"; m.min = 45; addEv(m, { t: "ht" }); if (!m.live) resumeMatch(m); }
  else if (m.phase === "2H" && m.min >= 90 + m.stop2) { m.min = 90; endOfRegulation(m); }
  else if (m.phase === "ET" && m.min >= 120) { finishGame(m, true); }
  return m.ev.slice(n0);
}

function resumeMatch(m) {
  if (m.phase === "HT") { m.phase = "2H"; m.min = 45; }
  else if (m.phase === "ETB") { m.phase = "ET"; m.min = 90; }
}

function needDecider(m) {
  const f = m.f;
  if (!f.k) return false;
  if (f.l1 != null) { const l1 = G.fx[f.l1]; return m.g[0] + l1.ag === m.g[1] + l1.hg; }
  return m.g[0] === m.g[1];
}
function endOfRegulation(m) {
  if (needDecider(m)) { m.phase = "ETB"; m.et = true; addEv(m, { t: "et" }); if (!m.live) resumeMatch(m); }
  else finishGame(m, false);
}
function finishGame(m, afterEt) {
  if (afterEt && needDecider(m)) {
    // penalties
    const kick = (s) => { const t = m.sides[s].on.filter((o) => o.pos !== "GK").sort((a, b) => pl(b.pid).a[1] - pl(a.pid).a[1]); return t; };
    const k = [kick(0), kick(1)], sc = [0, 0];
    const take = (s, i) => { const o = k[s][i % Math.max(1, k[s].length)]; const p = o ? pl(o.pid) : null; return rnd() < 0.74 + ((p ? p.a[1] : 60) - 70) * 0.004; };
    let i = 0;
    for (; i < 5; i++) { if (take(0, i)) sc[0]++; if (take(1, i)) sc[1]++; if (sc[0] > sc[1] + (4 - i) || sc[1] > sc[0] + (4 - i)) { i++; break; } }
    while (sc[0] === sc[1]) { const a = take(0, i), b = take(1, i); if (a) sc[0]++; if (b) sc[1]++; i++; }
    m.pen = sc;
    addEv(m, { t: "pens", sc });
  }
  m.phase = "FT"; m.done = true; addEv(m, { t: "ft" });
}

function sendOff(m, s, o, second) {
  const side = m.sides[s];
  side.on = side.on.filter((x) => x !== o); side.reds++;
  m.rt[o.pid] -= 1.3; m.offAt[o.pid] = m.min;
  addEv(m, { t: "rc", s, p: o.pid, second });
  const p = pl(o.pid); p.sus = Math.max(p.sus, second ? 1 : ri(1, 3));
  if (o.pos === "GK" && side.subs < side.maxSubs) {
    const gk = side.bench.map(pl).find((q) => q.pos === "GK");
    const out = side.on.filter((x) => x.pos !== "GK").sort((a, b) => W_ATT[b.pos] - W_ATT[a.pos])[0];
    if (gk && out) doSub(m, s, out.pid, gk.id, "GK");
  }
  calcStrength(m);
}

function autoSubFor(m, s, o, why) {
  const side = m.sides[s];
  if (side.subs >= side.maxSubs) return;
  const grp = POS_GROUP[o.pos];
  const cands = side.bench.map(pl).filter((p) => p && available(p) && (p.pos === "GK") === (o.pos === "GK"));
  if (!cands.length) return;
  cands.sort((a, b) => (effAt(b, o.pos) + (POS_GROUP[b.pos] === grp ? 3 : 0)) - (effAt(a, o.pos) + (POS_GROUP[a.pos] === grp ? 3 : 0)));
  doSub(m, s, o.pid, cands[0].id, o.pos);
}

function doSub(m, s, outPid, inPid, pos) {
  const side = m.sides[s];
  const idx = side.on.findIndex((x) => x.pid === outPid);
  if (idx < 0 || side.subs >= side.maxSubs) return false;
  const slot = side.on[idx];
  side.on[idx] = { pid: inPid, pos: pos || slot.pos };
  side.bench = side.bench.filter((x) => x !== inPid);
  side.subs++;
  m.offAt[outPid] = m.min; m.onAt[inPid] = m.min; m.rt[inPid] = 6.4;
  addEv(m, { t: "sub", s, p: inPid, o: outPid });
  calcStrength(m);
  return true;
}

function runToEnd(m) {
  let guard = 0;
  while (!m.done && guard++ < 400) { if (m.phase === "HT" || m.phase === "ETB") resumeMatch(m); stepMatch(m); }
}

function finishMatch(m) {
  const f = m.f;
  f.hg = m.g[0]; f.ag = m.g[1]; f.p = 1;
  if (m.et) f.et = 1;
  if (m.pen) f.pen = m.pen;
  if (f.k) {
    let hT = m.g[0], aT = m.g[1];
    if (f.l1 != null) { const l1 = G.fx[f.l1]; hT += l1.ag; aT += l1.hg; }
    f.w = hT > aT ? f.h : hT < aT ? f.a : m.pen[0] > m.pen[1] ? f.h : f.a;
  }
  f.gl = m.ev.filter((e) => e.t === "goal").map((e) => [e.m, e.s, e.p, e.a || 0]);
  const cards = m.ev.filter((e) => e.t === "rc").map((e) => [e.m, e.s, e.p, "r"]);
  if (cards.length) f.rc = cards;
  // ratings + stats
  const res = [Math.sign(m.g[0] - m.g[1]), Math.sign(m.g[1] - m.g[0])];
  const comp = G.comps[f.c];
  let mom = null, best = -1;
  const played = Object.keys(m.rt).map(Number);
  for (const pid of played) {
    const p = pl(pid); if (!p) continue;
    const s = p.club === m.sides[0].cid ? 0 : 1;
    let r = m.rt[pid] + res[s] * 0.3 + randn() * 0.35;
    const conceded = m.g[1 - s];
    if (conceded === 0 && (p.pos === "GK" || ["CB", "LB", "RB"].includes(p.pos))) r += p.pos === "GK" ? 0.6 : 0.3;
    const mins = (m.offAt[pid] != null ? m.offAt[pid] : 90) - (m.onAt[pid] || 0);
    if (mins < 25) r = 6.2 + (r - 6.4) * 0.6;
    r = r1(clamp(r, 3.5, 10));
    m.rt[pid] = r;
    if (r > best) { best = r; mom = pid; }
    p.st.ap++; p.st.rs += r;
    p.st.g += m.goals[pid] || 0; p.st.as += m.ast[pid] || 0;
    if (comp.type === "league") p.st.lg += m.goals[pid] || 0;
    if (conceded === 0 && p.pos === "GK") p.st.cs++;
    p.form.push(r); if (p.form.length > 6) p.form.shift();
    p.fit = clamp(p.fit - Math.round(mins / 90 * 19 + rnd() * 5), 30, 100);
    p.mor = clamp(p.mor + res[s] * 3 + (r >= 7.5 ? 2 : r < 5.8 ? -2 : 0), 5, 100);
    if (m.yel[pid] && !m.ev.some((e) => e.t === "rc" && e.p === pid)) { p.st.y++; p.yc++; if (p.yc >= 5) { p.yc = 0; p.sus = Math.max(p.sus, 1); } }
    if (m.ev.some((e) => e.t === "rc" && e.p === pid)) p.st.r++;
  }
  if (mom) { pl(mom).st.mom++; f.mom = mom; }
  // serve suspensions for players who sat out
  [f.h, f.a].forEach((cid) => squad(cid).forEach((p) => { if (p.sus > 0 && m.rt[p.id] == null && !m.ev.some((e) => e.t === "rc" && e.p === p.id)) p.sus--; }));
  if (isUserFx(f)) {
    f.rep = { sh: m.shots, sot: m.sot, pos: Math.round((m.possA / Math.max(1, m.possN)) * 100), rt: m.rt, sides: m.sides.map((s) => s.cid), ev: m.ev.filter((e) => ["goal", "rc", "yc", "inj", "sub", "pens"].includes(e.t)) };
    f.rep.lu = [0, 1].map((s) => Object.keys(m.rt).map(Number).filter((pid) => pl(pid) && pl(pid).club === m.sides[s].cid));
  }
  applyResult(f);
  // user career feedback
  if (G.mode === "career" && m.rt[G.userPlayer] != null) {
    const p = pl(G.userPlayer); const g = m.goals[p.id] || 0, a = m.ast[p.id] || 0;
    G.career.last = { f: f.i, r: m.rt[p.id], g, a };
  }
  return m;
}
function playFixture(f) {
  const m = createMatch(f);
  runToEnd(m);
  return finishMatch(m);
}
