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
  m.sideOf = {};
  m.sides.forEach((s, i) => { s.on.forEach((o) => { m.rt[o.pid] = 6.4; m.onAt[o.pid] = 0; m.sideOf[o.pid] = i; }); s.bench.forEach((id) => (m.sideOf[id] = i)); });
  m.inter = opts.inter && G.userPlayer && m.sideOf[G.userPlayer] != null ? G.userPlayer : null;
  m.moments = 0;
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

function scoreGoal(m, s, pid, ap, fromChance) {
  const opp = m.sides[1 - s], gk = gkOf(opp);
  if (!fromChance) m.shots[s]++;
  m.sot[s]++; m.g[s]++;
  m.goals[pid] = (m.goals[pid] || 0) + 1; m.rt[pid] = (m.rt[pid] || 6.4) + (m.goals[pid] > 1 ? 0.8 : 1.1);
  if (ap) { m.ast[ap] = (m.ast[ap] || 0) + 1; m.rt[ap] += 0.6; }
  if (gk) m.rt[gk.pid] -= 0.3;
  opp.on.forEach((o) => { if (["CB", "LB", "RB"].includes(o.pos)) m.rt[o.pid] -= 0.12; });
  return addEv(m, { t: "goal", s, p: pid, a: ap, sc: m.g.slice() });
}

// ---------- player decisions (career mode) ----------
const MOMENTS = {
  pen: { q: () => "Penalty! You grab the ball and step up.", o: [["left", "Bottom left"], ["middle", "Down the middle"], ["right", "Top right"]] },
  fk: { q: (d) => `Free kick to your side, ${d.dist} metres out. You're standing over it.`, o: [["shoot", "Go for goal"], ["cross", "Whip it into the box"], ["short", "Play it short"]] },
  oneone: { q: () => "You're clean through, one-on-one with the keeper!", o: [["low", "Slot it low"], ["chip", "Chip him"], ["round", "Take it round him"]] },
  edge: { q: () => "The ball drops to you on the edge of the box.", o: [["shoot", "Shoot first time"], ["through", "Slide a teammate in"], ["dribble", "Take on your man"]] },
  counter: { q: () => "Two-on-one on the break! A teammate is free to your right.", o: [["pass", "Square it"], ["shoot", "Shoot yourself"], ["hold", "Slow it down"]] },
  tackle: { q: () => "Their striker is through and you're the last defender.", o: [["slide", "Slide tackle"], ["jockey", "Jockey and delay"], ["foul", "Take one for the team"]] },
  header: { q: () => "Corner kick. You're arriving at the far post.", o: [["power", "Power header at goal"], ["down", "Head it down into the box"], ["back", "Nod it back across"]] },
  gkpen: { q: () => "Penalty to them. Their taker places the ball. Which way do you go?", o: [["left", "Dive left"], ["middle", "Stay big in the middle"], ["right", "Dive right"]] },
  gk1v1: { q: () => "Their striker is clean through on you!", o: [["rush", "Rush out"], ["stay", "Stay on your line"], ["spread", "Make yourself big"]] },
};
function makeMoment(m, s, o) {
  const g = POS_GROUP[o.pos];
  const type = g === "GK" ? wpick([["gkpen", 0.25], ["gk1v1", 0.75]]) : g === "DEF" ? wpick([["tackle", 0.55], ["header", 0.45]]) : g === "MID" ? wpick([["pen", 0.06], ["fk", 0.3], ["edge", 0.32], ["counter", 0.2], ["oneone", 0.12]]) : wpick([["pen", 0.08], ["fk", 0.18], ["oneone", 0.32], ["edge", 0.22], ["counter", 0.2]]);
  return { type, s, pid: o.pid, dist: ri(17, 34), min: m.min };
}
function mateOf(m, s, pid, w = SCORE_W) { const l = m.sides[s].on.filter((o) => o.pid !== pid && o.pos !== "GK"); return l.length ? wPickOn(l, (o) => w[o.pos]).pid : null; }
function resolveMoment(m, choice) {
  const mo = m.pending; if (!mo) return null;
  m.pending = null; m.moments++;
  const s = mo.s, me = pl(mo.pid), a = me.a, opp = m.sides[1 - s];
  const gk = gkOf(opp), gkv = gk ? pl(gk.pid).a[6] : 50;
  const say = (txt, good) => { addEv(m, { t: "mom", s, p: mo.pid, txt, good }); return { txt, good }; };
  const rate = (d) => { m.rt[mo.pid] = (m.rt[mo.pid] || 6.4) + d; };
  const keeperSide = () => wpick([["left", 0.42], ["middle", 0.16], ["right", 0.42]]);
  const P = (x) => rnd() < clamp(x, 0.02, 0.97);
  switch (mo.type) {
    case "pen": {
      const k = keeperSide();
      const miss = choice === "middle" ? 0.03 : clamp(0.12 - (a[1] - 70) * 0.004, 0.03, 0.2);
      if (rnd() < miss) { rate(-0.6); m.shots[s]++; return say(choice === "middle" ? "You blaze it over the bar!" : "You drag it wide of the post!", false); }
      if (k === choice && P(choice === "middle" ? 0.85 : 0.68)) { rate(-0.5); m.shots[s]++; m.sot[s]++; return say(`The keeper guessed ${choice === "middle" ? "right and stood tall" : "the right way"}. Saved!`, false); }
      scoreGoal(m, s, mo.pid, null); return say(`GOAL! You send the keeper the wrong way.`, true);
    }
    case "fk": {
      if (choice === "shoot") {
        if (P(0.05 + (a[1] - 60) * 0.004 + (a[2] - 60) * 0.002 - (mo.dist - 17) * 0.006 - (gkv - 70) * 0.003)) { scoreGoal(m, s, mo.pid, null); return say(`GOAL! A stunning free kick from ${mo.dist} metres!`, true); }
        m.shots[s]++; if (P(0.5)) { m.sot[s]++; rate(0.05); return say("Good effort, but the keeper tips it over.", false); }
        rate(-0.15); return say("Your free kick clips the wall and goes out.", false);
      }
      if (choice === "cross") {
        if (P(0.1 + (a[2] - 60) * 0.004)) { const t = mateOf(m, s, mo.pid); if (t) { scoreGoal(m, s, t, mo.pid); return say("Perfect delivery and it's headed in! Assist for you.", true); } }
        rate(-0.05); return say("The cross is cleared by the first defender.", false);
      }
      rate(0.05); return say("You play it short and your side keep the ball.", true);
    }
    case "oneone": {
      const out = rnd() < 0.5;
      const pct = choice === "low" ? 0.42 + (a[1] - 70) * 0.008 - (gkv - 70) * 0.006 : choice === "chip" ? (out ? 0.55 : 0.18) + (a[3] - 70) * 0.006 : 0.36 + (a[3] - 70) * 0.009 + (a[0] - 70) * 0.004;
      if (P(pct)) { scoreGoal(m, s, mo.pid, null); return say(choice === "chip" ? "GOAL! A delicate chip over the keeper!" : choice === "round" ? "GOAL! You round the keeper and walk it in!" : "GOAL! You slot it into the bottom corner!", true); }
      m.shots[s]++; rate(-0.35);
      return say(choice === "chip" && !out ? "The keeper stayed home and caught your chip." : choice === "round" ? "The keeper smothers it at your feet." : "Saved! The keeper gets a strong hand to it.", false);
    }
    case "edge": {
      if (choice === "shoot") { if (P(0.12 + (a[1] - 70) * 0.007 - (gkv - 70) * 0.004)) { scoreGoal(m, s, mo.pid, null); return say("GOAL! A thunderbolt from the edge of the box!", true); } m.shots[s]++; rate(-0.1); return say("Your shot flies just over.", false); }
      if (choice === "through") { if (P(0.2 + (a[2] - 70) * 0.007)) { const t = mateOf(m, s, mo.pid); if (t) { scoreGoal(m, s, t, mo.pid); return say("What a pass! Your teammate finishes. Assist for you.", true); } } rate(-0.05); return say("The pass is just behind your teammate.", false); }
      if (P(0.4 + (a[3] - 70) * 0.01)) { if (P(0.35 + (a[1] - 70) * 0.006)) { scoreGoal(m, s, mo.pid, null); return say("GOAL! You skip past your man and finish!", true); } rate(0.15); return say("You beat your man but the shot is saved.", false); }
      rate(-0.15); return say("You're crowded out and lose the ball.", false);
    }
    case "counter": {
      if (choice === "pass") { if (P(0.45 + (a[2] - 70) * 0.008)) { const t = mateOf(m, s, mo.pid); if (t) { scoreGoal(m, s, t, mo.pid); return say("You square it and it's an easy finish. Assist!", true); } } rate(-0.1); return say("The pass is intercepted at the last moment.", false); }
      if (choice === "shoot") { if (P(0.32 + (a[1] - 70) * 0.008)) { scoreGoal(m, s, mo.pid, null); return say("GOAL! You go alone and bury it!", true); } m.shots[s]++; rate(-0.3); return say("You go alone and the keeper saves. Your teammate is not impressed.", false); }
      rate(0); return say("You slow it down and your team keep the ball.", true);
    }
    case "tackle": {
      const striker = opp.on.find((o) => o.pos === "ST") || opp.on[0];
      if (choice === "slide") {
        if (P(0.55 + (a[4] - 70) * 0.012)) { rate(0.4); return say("Perfectly timed slide tackle! Danger over.", true); }
        if (P(0.45)) { m.yel[mo.pid] ? sendOff(m, s, m.sides[s].on.find((o) => o.pid === mo.pid), true) : (m.yel[mo.pid] = 1); }
        if (striker && P(0.45)) { scoreGoal(m, 1 - s, striker.pid, null); rate(-0.6); return say("You mistime it and they score.", false); }
        rate(-0.2); return say("You miss the tackle, but the shot goes wide. Lucky.", false);
      }
      if (choice === "jockey") {
        if (P(0.62 + (a[4] - 70) * 0.008 + (a[0] - 70) * 0.004)) { rate(0.3); return say("You show him wide and win it back.", true); }
        if (striker && P(0.4)) { scoreGoal(m, 1 - s, striker.pid, null); rate(-0.4); return say("He cuts inside you and scores.", false); }
        return say("He gets a shot off, but it's saved.", false);
      }
      if (m.yel[mo.pid]) { sendOff(m, s, m.sides[s].on.find((o) => o.pid === mo.pid), true); return say("Second yellow. You're off!", false); }
      m.yel[mo.pid] = 1; rate(-0.2); addEv(m, { t: "yc", s, p: mo.pid });
      return say("You pull him down. Yellow card, but the danger is gone.", true);
    }
    case "header": {
      if (choice === "power") { if (P(0.15 + (a[5] - 70) * 0.006 + (a[1] - 70) * 0.003)) { scoreGoal(m, s, mo.pid, null); return say("GOAL! A bullet header at the far post!", true); } m.shots[s]++; rate(-0.05); return say("Your header goes just over.", false); }
      if (P(choice === "down" ? 0.13 : 0.1)) { const t = mateOf(m, s, mo.pid); if (t) { scoreGoal(m, s, t, mo.pid); return say("You knock it down and a teammate pokes it in! Assist.", true); } }
      return say("The ball is scrambled clear.", false);
    }
    case "gkpen": {
      const shot = wpick([["left", 0.44], ["middle", 0.12], ["right", 0.44]]);
      const taker = opp.on.find((o) => o.pos === "ST") || opp.on[0];
      if (shot === choice && P(choice === "middle" ? 0.9 : 0.6 + (a[6] - 70) * 0.01)) { rate(0.9); m.shots[1 - s]++; m.sot[1 - s]++; return say("SAVED! You guessed right and kept it out!", true); }
      if (taker) scoreGoal(m, 1 - s, taker.pid, null);
      rate(-0.2); return say(shot === choice ? "You went the right way but couldn't reach it." : `They roll it ${shot === "middle" ? "down the middle" : "the other way"}. Goal.`, false);
    }
    case "gk1v1": {
      const st = opp.on.find((o) => o.pos === "ST") || opp.on[0];
      const pct = choice === "rush" ? 0.48 + (a[6] - 70) * 0.012 + (a[0] - 60) * 0.003 : choice === "stay" ? 0.33 + (a[6] - 70) * 0.012 : 0.42 + (a[6] - 70) * 0.012;
      if (P(pct)) { rate(0.6); m.shots[1 - s]++; m.sot[1 - s]++; return say(choice === "rush" ? "You rush out and smother it!" : "Brilliant save! You keep it out!", true); }
      if (st) scoreGoal(m, 1 - s, st.pid, null);
      rate(-0.2); return say("He beats you. Goal.", false);
    }
  }
  return null;
}

// Advance one minute. Returns events created this minute.
function stepMatch(m) {
  if (m.done || m.phase === "HT" || m.phase === "ETB" || m.pending) return [];
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
        let ap = null;
        if (rnd() < 0.75 && side.on.length > 1) ap = wPickOn(side.on.filter((o) => o.pid !== sh.pid), (o) => ASSIST_W[o.pos] * (pl(o.pid).a[2] / 70)).pid;
        scoreGoal(m, s, sh.pid, ap, true);
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
        const medF = (side.cid != null && typeof side.cid !== "string" ? 1.15 - facLvl(club(side.cid), "med") * 0.07 : 1) * (o.pid === G.userPlayer && hasItem("pro3") ? 0.68 : 1);
        p.inj = Math.max(p.inj, Math.max(1, Math.round(wpick([[ri(3, 9), 5], [ri(10, 25), 3], [ri(26, 70), 1.2], [ri(90, 200), 0.25]]) * medF)));
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
  // a decision for the user's player
  if (m.inter && !m.pending && m.moments < 4 && (m.phase === "1H" || m.phase === "2H" || m.phase === "ET")) {
    const s = m.sideOf[m.inter], o = s != null ? m.sides[s].on.find((x) => x.pid === m.inter) : null;
    if (o) { const g = POS_GROUP[o.pos]; const per90 = g === "ATT" ? 1.7 : g === "MID" ? 1.4 : 1.15; if (rnd() < per90 / 90) m.pending = makeMoment(m, s, o); }
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
  m.offAt[outPid] = m.min; m.onAt[inPid] = m.min; m.rt[inPid] = 6.4; m.sideOf[inPid] = s;
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
    const s = m.sideOf[pid] != null ? m.sideOf[pid] : p.club === m.sides[0].cid ? 0 : 1;
    let r = m.rt[pid] + res[s] * 0.3 + randn() * 0.35;
    const conceded = m.g[1 - s];
    if (conceded === 0 && (p.pos === "GK" || ["CB", "LB", "RB"].includes(p.pos))) r += p.pos === "GK" ? 0.6 : 0.3;
    const mins = (m.offAt[pid] != null ? m.offAt[pid] : 90) - (m.onAt[pid] || 0);
    if (mins < 25) r = 6.2 + (r - 6.4) * 0.6;
    r = r1(clamp(r, 3.5, 10));
    m.rt[pid] = r;
    if (r > best) { best = r; mom = pid; }
    if (f.nt) { p.caps = (p.caps || 0) + 1; p.ig = (p.ig || 0) + (m.goals[pid] || 0); }
    else {
      p.st.ap++; p.st.rs += r;
      p.st.g += m.goals[pid] || 0; p.st.as += m.ast[pid] || 0;
      if (comp.type === "league") p.st.lg += m.goals[pid] || 0;
      if (conceded === 0 && p.pos === "GK") p.st.cs++;
    }
    p.form.push(r); if (p.form.length > 6) p.form.shift();
    p.fit = clamp(p.fit - Math.round(mins / 90 * 19 + rnd() * 5), 30, 100);
    p.mor = clamp(p.mor + res[s] * 3 + (r >= 7.5 ? 2 : r < 5.8 ? -2 : 0), 5, 100);
    if (m.yel[pid] && !m.ev.some((e) => e.t === "rc" && e.p === pid)) { p.st.y++; p.yc++; if (p.yc >= 5) { p.yc = 0; p.sus = Math.max(p.sus, 1); } }
    if (m.ev.some((e) => e.t === "rc" && e.p === pid)) p.st.r++;
  }
  if (mom) { if (!f.nt) pl(mom).st.mom++; f.mom = mom; }
  // serve suspensions for players who sat out
  if (!f.nt) [f.h, f.a].forEach((cid) => squad(cid).forEach((p) => { if (p.sus > 0 && m.rt[p.id] == null && !m.ev.some((e) => e.t === "rc" && e.p === p.id)) p.sus--; }));
  if (isUserFx(f)) {
    f.rep = { sh: m.shots, sot: m.sot, pos: Math.round((m.possA / Math.max(1, m.possN)) * 100), rt: m.rt, sides: m.sides.map((s) => s.cid), ev: m.ev.filter((e) => ["goal", "rc", "yc", "inj", "sub", "pens", "mom"].includes(e.t)) };
    f.rep.lu = [0, 1].map((s) => Object.keys(m.rt).map(Number).filter((pid) => pl(pid) && m.sideOf[pid] === s));
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
