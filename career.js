/* Touchline — career depth: discipline and release, reputation and press, season goals, veteran years, life after football. */
"use strict";

// ---------- helpers ----------
function crep(d) { const C = G.career; C.rep = clamp((C.rep == null ? 50 : C.rep) + d, 0, 100); }
function headline(t) { const C = G.career; C.press = C.press || []; C.press.unshift({ s: G.season, d: G.day, t }); if (C.press.length > 12) C.press.length = 12; }
function cdisc(d, why) {
  const C = G.career, p = pl(G.userPlayer);
  if (!C || C.retired || !p) return;
  if (d > 0 && legendHere()) d *= 0.6; // the fans and club forgive their legends more
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
  if (d >= (legendHere() ? 90 : 80)) {
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

// ---------- club legend ----------
// Five straight seasons at one club makes you a legend there. The fans never forget.
function legendHere() { const C = G.career, p = pl(G.userPlayer); return !!(C && p && p.club >= 0 && (C.legends || []).includes(club(p.club).name)); }
function seasonsAtClub(p, name) { let n = 0; for (let i = p.hist.length - 1; i >= 0 && p.hist[i].cn === name; i--) n++; return n; }
function goalsAtClub(p, name) { return p.hist.reduce((s, h) => s + (h.cn === name ? h.g : 0), 0) + (p.loan ? 0 : p.st.g); }
// Legend status comes from five straight seasons or 100 goals for the club.
function checkLegend(p) {
  const C = G.career; if (!C || C.retired || p.club < 0) return;
  const c = club(p.club);
  C.legends = C.legends || [];
  if (C.legends.includes(c.name)) return;
  const seasons = seasonsAtClub(p, c.name) >= 5, goals = goalsAtClub(p, c.name) >= 100;
  if (!seasons && !goals) return;
  const why = goals ? `100 goals for ${c.name}` : `Five seasons at ${c.name}`;
  C.legends.push(c.name);
  const L = C.life;
  crep(8); L.fame = clamp(L.fame + 8, 0, 100); L.happy = clamp(L.happy + 10, 0, 100);
  p.mor = clamp(p.mor + 15, 5, 100); C.trust = clamp((C.trust == null ? 50 : C.trust) + 15, 0, 100);
  p.wage = Math.round(p.wage * 1.15 / 100) * 100;
  partnerMood(5, "She's so proud of what you mean to that club.", "fame");
  const an = /^[AEIOU]/i.test(c.name) ? "an" : "a";
  headline(`${fullName(p)} is now ${an} ${c.name} legend`);
  inbox({ t: `You're ${an} ${c.name} legend`, b: `${why}. The fans sing your name, there's a mural of you outside the stadium, and the club has rewarded your loyalty with a 15% raise. From now on the club and the fans will forgive you more, and the manager trusts you more.`, type: "career" });
}
const LEGEND_CHANTS = ["The whole stadium sang {n}'s name for ten minutes", "Fans unveil a giant banner of {n}", "{n} gets a standing ovation from the home end", "\"There's only one {n}\": the chant rings round the ground"];

// ---------- asking to go home ----------
function askHomecoming() {
  const C = G.career, p = pl(G.userPlayer), b = boyhoodClub();
  if (!b) return "We couldn't work out your boyhood club.";
  if (p.club === b.id) return `You're already at ${b.name}.`;
  if (p.loan) return "Finish your loan first.";
  if (C.homeAsk === G.season) return `You've already asked ${b.name} this season.`;
  C.homeAsk = G.season;
  if (p.club >= 0) { const c = club(p.club); if (!legendHere()) C.trust = clamp((C.trust == null ? 50 : C.trust) - 6, 0, 100); news(`${fullName(p)} wants to go home`, `${c.name} are disappointed to hear it.`); }
  if (p.o < b.rep - 8) return `${b.name} love you, but they feel you're not ready for their level yet. Try again next season.`;
  if (inWindow() || p.club < 0) { homecomingOffer(); return `${b.name} jumped at the chance. Check your inbox for their offer.`; }
  C.homePending = true;
  return `${b.name} are keen. They'll make an offer as soon as the transfer window opens.`;
}
function homecomingOffer() {
  const C = G.career, p = pl(G.userPlayer), b = boyhoodClub();
  C.homePending = false;
  if (!b || p.club === b.id) return;
  // The selling club gives a discount when a player wants to go home; the boyhood club pays what it can.
  const fee = p.club < 0 ? 0 : Math.round(Math.min(p.val * 0.7, Math.max(b.budget, p.val * 0.3)) / 1e5) * 1e5;
  const wage = Math.max(500, Math.round(wageFor(p, b) / 100) * 100);
  inbox({ t: `Homecoming: ${b.name}`, b: `${b.name}, the club where it all started, want you back${fee ? ` and have agreed a ${money(fee)} fee` : ""}. They offer ${money(wage)}/wk. Your family and the old fans would love it.`, type: "career", act: { kind: "coffer", cid: b.id, fee, wage, home: true } });
}
function homecomingDone(p, b) {
  const C = G.career, L = C.life;
  crep(4); L.happy = clamp(L.happy + 8, 0, 100); p.mor = clamp(p.mor + 10, 5, 100);
  partnerMood(3, "She's happy to be closer to your family.", "home");
  headline(`${fullName(p)} comes home to ${b.name}`);
}

// ---------- after each match ----------
function careerAfterMatch(f, m) {
  const C = G.career, p = pl(G.userPlayer); if (!C || !p) return;
  const L = C.last, s = m.sideOf[p.id], won = s != null && m.g[s] > m.g[1 - s], lost = s != null && m.g[s] < m.g[1 - s];
  if (L.g >= 3) headline(`Hat-trick hero! ${fullName(p)} scores ${L.g} against ${club(s === 0 ? f.a : f.h).name}`);
  else if (L.r >= 8.8) headline(`${fullName(p)} runs the show in a ${L.r.toFixed(1)}-rated masterclass`);
  if (m.ev.some((e) => e.t === "rc" && e.p === p.id)) { headline(`${fullName(p)} sees red`); cdisc(5, "sent off"); }
  crep(L.r >= 7.5 ? 0.6 : L.r < 5.8 ? -0.4 : 0);
  if (L.g && !p.loan) checkLegend(p);
  if (legendHere()) {
    p.mor = clamp(p.mor + 1, 5, 100);
    if (s != null && f.h === p.club && (L.g || L.r >= 7.8) && rnd() < 0.25) headline(pick(LEGEND_CHANTS).replace("{n}", fullName(p)));
  }
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
  if (C.homePending && inWindow() && p.club >= 0) homecomingOffer();
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

// ---------- one last comeback ----------
// Three seasons after retiring, your boyhood club can call you back for two final seasons.
function retiredSeason() { const C = G.career; return C.retiredS != null ? C.retiredS : parseInt(C.retired, 10) || G.season; }
function boyhoodClub() {
  const C = G.career, p = pl(G.userPlayer);
  if (C.boyhood != null && club(C.boyhood)) return club(C.boyhood);
  const first = p && p.hist.find((h) => !/\(loan\)$/.test(h.cn) && h.cn !== "Free agent");
  const byName = first && G.clubs.find((c) => c.name === first.cn);
  return byName || (C.lastClub != null ? club(C.lastClub) : null);
}
function comebackStatus() {
  const C = G.career, p = pl(G.userPlayer);
  if (!C || !C.retired || !p || C.comebackDone || G.mode !== "career") return null;
  const c = boyhoodClub(); if (!c) return null;
  if (age(p) > 43) return null;
  const wait = retiredSeason() + 3 - G.season;
  return { c, wait: Math.max(0, wait) };
}
function comebackCall() {
  const st = comebackStatus();
  if (!st || st.wait > 0 || G.career.comebackCalled) return;
  G.career.comebackCalled = true;
  inbox({ t: `${st.c.name} need you`, b: `Your boyhood club ${st.c.name} are struggling and want you back for two final seasons to help them. Open your Career page to answer.`, type: "career" });
}
function startComeback() {
  const st = comebackStatus();
  if (!st) return "There's no comeback on the table.";
  if (st.wait > 0) return `Wait ${st.wait} more season${st.wait > 1 ? "s" : ""}.`;
  const C = G.career, p = pl(G.userPlayer), c = st.c;
  const peak = Math.max(p.o, ...p.hist.map((h) => h.o));
  const away = G.season - retiredSeason();
  // A pre-season of hard work gets some of the old sharpness back.
  const target = clamp(Math.round(peak - 8 - away * 1.5), 45, 85);
  for (let k = 0; k < 60 && p.o < target; k++) { const w = POS_W[p.pos]; for (let i = 0; i < 7; i++) if (w[i] > 0) p.a[i] = r1(clamp(p.a[i] + 0.6, 10, 99)); calcOvr(p); }
  p.ret = 0; p.inj = 0; p.form = []; p.listed = 0;
  const wage = Math.max(500, Math.round(wageFor(p, c) / 100) * 100);
  const second = G.day > (G.seasonEnd || SEASON_END) / 2;
  doTransfer(p, c, 0, second ? 2 : 1, wage);
  p.ce = G.season + (second ? 2 : 1); p.wage = wage;
  C.comeback = { cid: c.id, until: p.ce, start: G.season };
  if (C.pundit) { C.punditPaused = C.pundit; C.pundit = null; }
  C.retired = null; C.fa = false; C.lastClub = c.id; C.captain = null; C.goals = null;
  G.userClub = c.id;
  careerSeasonStart();
  crep(6);
  headline(`${fullName(p)} comes out of retirement to save boyhood club ${c.name}`);
  inbox({ t: `Back home at ${c.name}`, b: `You've come out of retirement for two final seasons at ${c.name} on ${money(wage)}/wk. The fans are going wild. After this, you hang up your boots for good.`, type: "career" });
  return `You're back! Two final seasons at ${c.name}.`;
}
function endComeback(p) {
  const C = G.career, c = club(C.comeback.cid);
  C.comebackDone = true;
  const apps = p.hist.filter((h) => h.s >= C.comeback.start && h.cn === c.name).reduce((s, h) => s + h.ap, 0);
  if (p.club >= 0) releaseToFA(p);
  p.ret = 1;
  C.retired = `${G.season}/${(G.season + 1) % 100}`; C.retiredS = G.season; C.called = false;
  if (C.punditPaused) { C.pundit = C.punditPaused; C.punditPaused = null; }
  crep(4); C.life.happy = clamp(C.life.happy + 10, 0, 100);
  headline(`${fullName(p)} retires for good after his return to ${c.name}`);
  inbox({ t: "Boots hung up for good", b: `Your comeback is over after ${apps} more games for ${c.name}. The club gave you a guard of honour on your last day. This time the retirement is final.`, type: "career" });
}

// ---------- retirement & life after football ----------
function testimonial(p) {
  const by = {}; p.hist.forEach((h) => { by[h.cn] = (by[h.cn] || 0) + h.ap; });
  const best = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
  if (!best || (best[1] < 200 && !(G.career.legends || []).includes(best[0]))) return null;
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
