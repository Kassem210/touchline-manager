/* Touchline — career depth: discipline and release, reputation and press, season goals, veteran years, life after football. */
"use strict";

// ---------- helpers ----------
function crep(d) { const C = G.career; C.rep = clamp((C.rep == null ? 50 : C.rep) + d, 0, 100); }
function headline(t) { const C = G.career; C.press = C.press || []; C.press.unshift({ s: G.season, d: G.day, t }); if (C.press.length > 12) C.press.length = 12; }
function cdisc(d, why) {
  const C = G.career, p = pl(G.userPlayer);
  if (!C || C.retired || !p) return;
  C.disc = clamp((C.disc || 0) + d, 0, 100);
  if (d > 0) crep(-d * 0.5);
  if (d >= 8 && p.club >= 0) headline(`Trouble at ${club(p.club).name}: ${fullName(p)} ${why || "in hot water again"}`);
  checkDiscipline();
}
const repWord = (v) => (v >= 80 ? "Adored" : v >= 62 ? "Well liked" : v >= 42 ? "Mixed" : v >= 25 ? "Controversial" : "Toxic");
const discWord = (v) => (v >= 60 ? "On thin ice" : v >= 40 ? "Under watch" : v >= 20 ? "A few incidents" : "Clean");

// ---------- discipline: warnings, fines, termination ----------
function checkDiscipline() {
  const C = G.career, p = pl(G.userPlayer);
  if (!p || p.club < 0 || C.retired) return;
  const c = club(p.club), d = C.disc || 0;
  if (d >= 80) {
    const name = c.name;
    releaseToFA(p);
    C.fa = true; C.disc = 45; C.trust = 40; C.captain = null; C.promise = null; p.listed = 0;
    crep(-10); partnerMood(-10, "She can't believe you got yourself sacked.", "fame");
    headline(`${name} terminate ${fullName(p)}'s contract`);
    inbox({ t: `${name} have terminated your contract`, b: `After repeated disciplinary problems, ${name} have sacked you. You're a free agent. Smaller clubs may still take a chance on you, but you'll have to rebuild your reputation.`, type: "career" });
    return;
  }
  if (d >= 60 && C.warned < 2) {
    C.warned = 2; const fine = p.wage * 2; G.career.life.cash -= fine;
    inbox({ t: "Final warning", b: `${c.name} have fined you two weeks' wages (${money(fine)}). One more serious incident and your contract will be terminated.`, type: "career" });
  } else if (d >= 40 && !C.warned) {
    C.warned = 1;
    inbox({ t: "Official warning from the club", b: `${c.name} are unhappy with your behaviour. Keep your head down, or there will be consequences.`, type: "career" });
  }
}
function faOffer() {
  const C = G.career, p = pl(G.userPlayer);
  if (!C.fa || p.club >= 0 || C.retired) return;
  if (G.inbox.some((m) => m.act && m.act.kind === "coffer" && !m.done)) return;
  if (rnd() > ((C.rep == null ? 50 : C.rep) < 25 ? 0.15 : 0.35)) return;
  const cands = G.clubs.filter((c) => c.rep >= p.o - 16 && c.rep <= p.o - 2 && c.id !== C.lastClub);
  if (!cands.length) return;
  const b = pick(cands), wage = Math.round(wageFor(p, b) * 0.8 / 100) * 100;
  inbox({ t: `Fresh start: ${b.name}`, b: `${b.name} (${leagueOf(b).name}) are willing to give you a second chance on ${money(wage)}/wk. Free agents can sign at any time.`, type: "career", act: { kind: "coffer", cid: b.id, fee: 0, wage } });
}

// ---------- after each match ----------
function careerAfterMatch(f, m) {
  const C = G.career, p = pl(G.userPlayer); if (!C || !p) return;
  const L = C.last, s = m.sideOf[p.id], won = s != null && m.g[s] > m.g[1 - s], lost = s != null && m.g[s] < m.g[1 - s];
  if (L.g >= 3) headline(`Hat-trick hero! ${fullName(p)} scores ${L.g} against ${club(s === 0 ? f.a : f.h).name}`);
  else if (L.r >= 8.8) headline(`${fullName(p)} runs the show in a ${L.r.toFixed(1)}-rated masterclass`);
  if (m.ev.some((e) => e.t === "rc" && e.p === p.id)) { headline(`${fullName(p)} sees red`); cdisc(5, "sent off"); }
  crep(L.r >= 7.5 ? 0.6 : L.r < 5.8 ? -0.4 : 0);
  const comp = G.comps[f.c], big = f.k || f.nt || (comp && comp.type !== "league") || L.g >= 2 || L.r >= 8.5 || m.ev.some((e) => e.t === "rc" && e.p === p.id);
  if (big && rnd() < 0.55 && !G.inbox.some((x) => x.act && x.act.kind === "event" && !x.done)) {
    const opp = club(s === 0 ? f.a : f.h).name;
    const ctx = { won, lost, opp, g: L.g, r: L.r };
    inbox({ t: "Press conference", b: `${won ? "After the win" : lost ? "After the defeat" : "After the draw"} against ${opp}${L.g ? `, where you scored ${L.g}` : ""}, the media want a word.`, type: "event", act: { kind: "event", ev: "presser", ctx } });
  }
}

// ---------- weekly ----------
function careerWeekly2() {
  const C = G.career, p = pl(G.userPlayer);
  if (!C || !p || C.retired) return;
  if (C.rep == null) C.rep = 50;
  C.disc = Math.max(0, (C.disc || 0) - 0.8);
  if (C.disc < 25) C.warned = 0;
  if (C.train && C.train.int === 0) C.disc = Math.min(100, C.disc + 0.4);
  const L = C.life;
  if (L.spons && C.rep < 25 && rnd() < 0.3) { inbox({ t: `${BRAND_BY[L.spons.brand].n} drop you`, b: "Your public image has become too toxic. Your boot deal has been terminated.", type: "life" }); L.spons = null; }
  faOffer();
  if (age(p) >= 31 && !C.slowWarn) { C.slowWarn = true; inbox({ t: "Your body is slowing down", b: "You're not recovering like you used to. Your physical attributes will start to fade. Intense training slows the decline, and lighter leagues could extend your career.", type: "career" }); }
  if (p.club >= 0 && age(p) >= 31 && inWindow() && rnd() < 0.05 && !G.inbox.some((m) => m.act && m.act.kind === "coffer" && !m.done)) {
    const cands = G.clubs.filter((c) => c.rep >= p.o - 22 && c.rep <= p.o - 6 && c.id !== p.club);
    if (cands.length) { const b = pick(cands), wage = Math.round(wageFor(p, club(p.club)) * 2.2 / 100) * 100; inbox({ t: `A big final payday: ${b.name}`, b: `${b.name} (${leagueOf(b).name}) offer you ${money(wage)}/wk to see out your career with them. Easier football, huge money.`, type: "career", act: { kind: "coffer", cid: b.id, fee: Math.round(p.val * 0.5 / 1e5) * 1e5, wage } }); }
  }
}

// ---------- season goals ----------
function careerSeasonStart() {
  const C = G.career, p = pl(G.userPlayer);
  if (!C || !p || C.retired) return;
  const g = POS_GROUP[p.pos], goals = [];
  if (g === "ATT" || g === "MID") goals.push({ k: "g", n: `Score ${Math.max(3, Math.round((p.o - 52) * (g === "ATT" ? 0.75 : 0.35)))} goals`, t: Math.max(3, Math.round((p.o - 52) * (g === "ATT" ? 0.75 : 0.35))) });
  else goals.push({ k: "r", n: "Average a 6.9 rating or better", t: 6.9 });
  goals.push({ k: "ap", n: `Play ${p.o >= 70 ? 30 : 20} matches`, t: p.o >= 70 ? 30 : 20 });
  const n = G.nations[p.nat];
  if (p.o >= 68 && n && ntEligible(p.nat) && (p.caps || 0) < 5) goals.push({ k: "caps", n: `Earn ${(p.caps || 0) + 2} international caps`, t: (p.caps || 0) + 2 });
  else if (p.club >= 0 && club(p.club).rep >= 72) goals.push({ k: "tr", n: "Win a trophy", t: 1 });
  else goals.push({ k: "o", n: `Reach ${p.o + 3} overall`, t: p.o + 3 });
  C.goals = { s: G.season, list: goals.slice(0, 3), caps0: p.caps || 0, tr0: C.trophies.length };
}
function goalProgress(gl) {
  const C = G.career, p = pl(G.userPlayer), G0 = C.goals;
  if (gl.k === "g") return [p.st.g, gl.t];
  if (gl.k === "ap") return [p.st.ap, gl.t];
  if (gl.k === "r") return [p.st.ap ? r1(p.st.rs / p.st.ap) : 0, gl.t];
  if (gl.k === "caps") return [p.caps || 0, gl.t];
  if (gl.k === "tr") return [C.trophies.length - G0.tr0, 1];
  if (gl.k === "o") return [p.o, gl.t];
  return [0, 1];
}
function careerSeasonReview() {
  const C = G.career, p = pl(G.userPlayer);
  if (!C || !C.goals || C.goals.s !== G.season || !p) return;
  const L = C.life, done = [], missed = [];
  for (const gl of C.goals.list) { const [v, t] = goalProgress(gl); (v >= t ? done : missed).push(gl.n); }
  const bonus = Math.round(Math.max(20000, p.wage * 4) * done.length);
  L.cash += bonus; crep(done.length * 2 - missed.length);
  L.happy = clamp(L.happy + done.length * 4 - missed.length * 3, 0, 100);
  if (missed.length) partnerMood(L.ptype === "ambitious" ? -6 : -2, "She hoped for a better season.", "fame");
  inbox({ t: `Season goals: ${done.length} of ${C.goals.list.length} achieved`, b: `${done.length ? `Achieved: ${done.join(", ")}. Bonus: ${money(bonus)}. ` : ""}${missed.length ? `Missed: ${missed.join(", ")}. Your family and the fans expected more.` : "A brilliant season."}`, type: "career" });
}

// ---------- retirement & life after football ----------
function testimonial(p) {
  const by = {}; p.hist.forEach((h) => { by[h.cn] = (by[h.cn] || 0) + h.ap; });
  const best = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] < 200) return null;
  const L = G.career.life, amt = Math.round((1.2e6 * (0.5 + L.fame / 50)) / 1e5) * 1e5;
  L.cash += amt; crep(5);
  headline(`An emotional farewell: ${fullName(p)}'s testimonial at ${best[0]}`);
  inbox({ t: "Your testimonial match", b: `${best[0]} held a testimonial in your honour after ${best[1]} appearances. A full stadium said goodbye, and the match raised ${money(amt)} for you.`, type: "career" });
  return best[0];
}
function managerJobsForLegend() {
  const C = G.career, L = C.life, p = pl(G.userPlayer);
  const peak = p ? Math.max(p.o, ...p.hist.map((h) => h.o)) : 70;
  const maxRep = clamp(54 + L.fame * 0.35 + (peak - 70) * 0.5 + ((C.rep == null ? 50 : C.rep) - 50) * 0.1, 55, 82);
  return shuffle(G.clubs.filter((c) => c.rep <= maxRep && c.rep >= maxRep - 12)).slice(0, 4).map((c) => c.id);
}
function clubPrice(c) { return Math.round((squad(c.id).reduce((s, q) => s + q.val, 0) * 0.45 + 4e6 * Math.exp((c.rep - 60) * 0.09)) / 1e6) * 1e6; }
function switchToManager(cid, owner, price) {
  const C = G.career, p = pl(G.userPlayer), L = C.life;
  G.careerArchive = { name: p ? fullName(p) : "", hist: p ? p.hist : [], trophies: C.trophies, awards: C.awards, legacy: C.legacy || [], caps: p ? p.caps || 0 : 0 };
  const wealth = owner ? L.cash - price : L.cash;
  G.mode = "manager";
  G.mgr = { name: p ? fullName(p) : "Manager", conf: owner ? 100 : 65, hist: [], trophies: [], owner: !!owner, wealth };
  G.userClub = cid; G.userPlayer = null;
  const c = club(cid); c.auto = true; c.form = c.form || "4-3-3"; autoLineup(c);
  if (owner) G.sacked = false;
  inbox(owner ? { t: `You own ${c.name}`, b: `You've bought ${c.name} for ${money(price)}. You're the owner and the manager: nobody can sack you. Invest more of your fortune from the Club page.`, type: "board" }
    : { t: `Appointed manager of ${c.name}`, b: `Your playing days are over, but a new chapter starts. The board expect ${expectText(c)}.`, type: "board" });
}
function becomePundit() {
  const C = G.career, L = C.life;
  C.pundit = { wk: Math.round((1500 + L.fame * 450) / 100) * 100, since: G.season };
  inbox({ t: "You're a TV pundit", b: `A broadcaster has hired you as a studio pundit on ${money(C.pundit.wk)} a week. Your life goes on: keep pressing Continue to watch your kids grow up.`, type: "career" });
}
function ownerInvest(amt) {
  const c = club(G.userClub);
  if (!G.mgr.owner) return "Only owners can invest.";
  if (G.mgr.wealth < amt) return `You only have ${money(G.mgr.wealth)} left.`;
  G.mgr.wealth -= amt; c.bal += amt; c.budget += amt;
  return `You've invested ${money(amt)} into ${c.name}. The transfer budget is now ${money(c.budget)}.`;
}
