/* Touchline — player career progression: playstyle traits, weekly training, moving potential; partner personalities. */
"use strict";

// ---------- playstyle traits ----------
const TRAITS = {
  speed: { n: "Speedster", d: "Electric pace. Wins races in behind and on the break.", attrs: [0], moments: { counter: 0.07, oneone: 0.06 }, gk: false },
  finisher: { n: "Clinical finisher", d: "Ice cold in front of goal. Better at penalties, one-on-ones and shots.", attrs: [1], moments: { pen: 0.07, oneone: 0.07, edge: 0.05, fk: 0.03 }, gk: false },
  playmaker: { n: "Playmaker", d: "Sees passes others don't. Through balls and crosses come off more often.", attrs: [2], moments: { counter: 0.06, edge: 0.06, fk: 0.05 }, choices: { through: 1, pass: 1, cross: 1 }, gk: false },
  dribbler: { n: "Flair dribbler", d: "Beats players for fun. Dribbles and rounding the keeper work more often.", attrs: [3], moments: { edge: 0.06, oneone: 0.05 }, choices: { dribble: 1, round: 1, chip: 1 }, gk: false },
  engine: { n: "Engine", d: "Never stops running. Recovers fitness faster and handles intense training.", attrs: [5], moments: { header: 0.05 }, engine: true, gk: false },
  wall: { n: "Rock at the back", d: "Reads danger early. Tackles and headers come off more often.", attrs: [4, 5], moments: { tackle: 0.08, header: 0.06 }, gk: false },
  leader: { n: "Natural leader", d: "The manager trusts you sooner and you'll be captain earlier.", attrs: [], leader: true, gk: null },
  bloomer: { n: "Late bloomer", d: "Slower start, but your potential keeps rising into your mid-twenties.", attrs: [], bloomer: true, gk: null },
  pro: { n: "Model professional", d: "Trains right and lives right. Fewer training injuries and scandals, and your potential rarely drops.", attrs: [], pro: true, gk: null },
  keeper: { n: "Shot stopper", d: "Lightning reflexes. Better at saving penalties and one-on-ones.", attrs: [6], moments: { gkpen: 0.08, gk1v1: 0.08 }, gk: true },
};
const traitOf = () => (G && G.career && G.career.trait ? TRAITS[G.career.trait] : null);
function traitsFor(pos) { return Object.entries(TRAITS).filter(([, t]) => t.gk === null || t.gk === (pos === "GK")); }
// bonus applied to the success chance of an in-match decision
function traitBonus(type, choice) {
  const t = traitOf(); if (!t) return 0;
  let b = (t.moments && t.moments[type]) || 0;
  if (t.choices && t.choices[choice]) b += 0.04;
  return b;
}

// ---------- weekly training ----------
const INTENSITY = [
  { n: "Light", xp: 0.5, fit: 4, inj: 0, d: "Rest more. Slow progress." },
  { n: "Normal", xp: 0.85, fit: 0, inj: 0.005, d: "Steady progress." },
  { n: "Intense", xp: 1.15, fit: -8, inj: 0.03, d: "Faster progress, but tiring, a real injury risk, and burnout if you never rest." },
];
const SESSIONS = [
  { id: "gym", n: "Gym & strength", a: 5 },
  { id: "speed", n: "Speed work", a: 0 },
  { id: "finish", n: "Finishing drills", a: 1 },
  { id: "pass", n: "Passing drills", a: 2 },
  { id: "ball", n: "Ball mastery", a: 3 },
  { id: "def", n: "Defensive drills", a: 4 },
  { id: "keep", n: "Goalkeeper drills", a: 6 },
  { id: "video", n: "Video analysis", a: null },
  { id: "recovery", n: "Recovery & yoga", a: null },
];
function trainPlan() {
  const C = G.career;
  if (!C.train) C.train = { int: 1, extra: [] };
  return C.train;
}
function setIntensity(i) { trainPlan().int = clamp(i, 0, 2); return `Training set to ${INTENSITY[trainPlan().int].n.toLowerCase()}.`; }
function toggleSession(id) {
  const t = trainPlan();
  if (t.extra.includes(id)) { t.extra = t.extra.filter((x) => x !== id); return "Session dropped. You'll have more free time."; }
  if (t.extra.length >= 3) return "You can do at most three extra sessions a week.";
  t.extra.push(id);
  return "Extra session added. It uses one free-time slot each week.";
}
// The weekly growth for the user's player. Replaces the generic development curve.
function developUser(p) {
  const C = G.career, ag = age(p), t = traitOf() || {}, plan = trainPlan();
  const L = C.life;
  const weeks = Math.max(1, G.day / 7), pr = clamp(p.st.ap / (weeks * 0.9), 0, 1);
  const extras = plan.extra.filter((x) => SESSIONS.find((s) => s.id === x && s.a != null)).length;
  let xp = INTENSITY[plan.int].xp + extras * 0.08 + (C.bonusXP || 0);
  if (L && L.happy < 35) xp *= 0.8;
  // burnout: hard training with no rest wears you down
  const load = plan.int + plan.extra.filter((x) => x !== "recovery").length * 0.5;
  if (L && load >= 2.5) L.happy = clamp(L.happy - (load - 2) * 1.2, 0, 100);
  if (p.fit < 70) xp *= 0.8;
  C.bonusXP = 0;
  C.lastXP = r1(xp);
  const gap = Math.max(0, p.pot - p.o);
  let base = ag <= 21 ? 0.0047 : ag <= 24 ? 0.0036 : ag <= 28 ? 0.0021 : 0;
  if (t.bloomer) base *= ag <= 21 ? 0.8 : 1.25;
  let delta = gap * base * (0.35 + 0.65 * pr) * xp;
  if (ag >= 30) delta -= (ag - 29) * 0.028 * (plan.int === 0 ? 1.25 : plan.int === 2 ? 0.8 : 1);
  delta += randn() * 0.03;
  const w = POS_W[p.pos], focus = new Set([...(t.attrs || []), ...plan.extra.map((x) => (SESSIONS.find((s) => s.id === x) || {}).a).filter((a) => a != null)]);
  for (let i = 0; i < 7; i++) {
    let d = delta * (w[i] > 0 ? 1 : 0.3);
    if (delta > 0 && focus.has(i)) d *= 1.6;
    if (delta > 0 && i === C.tf) d *= 1.4;
    if (delta < 0 && (i === 0 || i === 5)) d *= 1.5;
    p.a[i] = r1(clamp(p.a[i] + d, 10, 99));
  }
  calcOvr(p);
  if (p.o > p.pot) p.pot = p.o;
  // training load
  p.fit = clamp(p.fit + INTENSITY[plan.int].fit * (t.engine ? 0.5 : 1) + (plan.extra.includes("recovery") ? 5 : 0), 30, 100);
  let inj = INTENSITY[plan.int].inj * (t.pro ? 0.4 : 1) * (plan.extra.includes("recovery") ? 0.6 : 1) * (t.engine ? 0.7 : 1);
  if (p.inj <= 0 && rnd() < inj) { p.inj = ri(7, 24); inbox({ t: "Injured in training", b: `You picked up a knock in an intense session and will miss about ${Math.ceil(p.inj / 7)} week${p.inj > 13 ? "s" : ""}.`, type: "career" }); }
  if (plan.extra.includes("video")) C.trust = clamp((C.trust == null ? 50 : C.trust) + 0.4, 0, 100);
  // potential review every four weeks
  const T = (C.ptrack = C.ptrack || { w: 0, xp: 0, ap0: p.st.ap, nights: 0 });
  T.w++; T.xp += xp;
  if (T.w >= 4) { reviewPotential(p, T); C.ptrack = { w: 0, xp: 0, ap0: p.st.ap, nights: 0 }; }
}
function reviewPotential(p, T) {
  const C = G.career, ag = age(p), t = traitOf() || {}, L = C.life;
  if (ag > 29) return;
  const xpAvg = T.xp / T.w, apps = Math.max(0, p.st.ap - T.ap0);
  const f = p.form.length ? avg(p.form.slice(-4)) : 6.5;
  const reasons = [];
  let s = (xpAvg - 1) * 1.6;
  if (xpAvg >= 1.3) reasons.push("hard training"); else if (xpAvg < 0.8) reasons.push("light training");
  if (apps >= 3) { s += 0.6; reasons.push("regular football"); } else if (apps === 0 && G.day > 30 && G.day < 300) { s -= 0.7; reasons.push("no match minutes"); }
  if (f >= 7.1) { s += 0.6; reasons.push("great form"); } else if (f < 6.3 && apps) { s -= 0.4; reasons.push("poor form"); }
  if (L && L.happy < 35) { s -= 0.4; reasons.push("an unhappy life off the pitch"); }
  if (T.nights >= 2) { s -= 0.6; reasons.push("too many nights out"); }
  if (p.inj > 30) { s -= 0.6; reasons.push("a long injury"); }
  if (t.bloomer && ag >= 21 && ag <= 27) s += 0.6;
  if (t.pro && s < 0) s *= 0.5;
  if (ag >= 26) s -= 0.4;
  let d = 0;
  if (C.pot0 == null) C.pot0 = p.pot;
  if (s > 1 && rnd() < 0.45 && p.pot < C.pot0 + 7) d = s > 2.6 && rnd() < 0.3 ? 2 : 1;
  else if (s < -0.8 && rnd() < 0.6) d = s < -2 ? -2 : -1;
  if (d) {
    p.pot = clamp(Math.max(p.o, p.pot + d), 30, 96);
    C.potLog = { d, s: G.season, day: G.day, why: reasons.slice(0, 3).join(", ") || (d > 0 ? "steady work" : "a quiet month") };
    if (Math.abs(d) >= 1) inbox({ t: d > 0 ? "Your potential is rising" : "Your potential is slipping", b: `The coaches have ${d > 0 ? "raised" : "lowered"} their view of your ceiling to ${p.pot}. Reason: ${C.potLog.why}.`, type: "career" });
  }
}
function potTrend() {
  const C = G.career; if (!C || !C.potLog) return { arrow: "→", text: "Steady" };
  const recent = (G.season * 400 + G.day) - (C.potLog.s * 400 + C.potLog.day) < 120;
  if (!recent) return { arrow: "→", text: "Steady" };
  return C.potLog.d > 0 ? { arrow: "↑", text: `Rising: ${C.potLog.why}` } : { arrow: "↓", text: `Falling: ${C.potLog.why}` };
}

// ---------- partner personalities ----------
const PERSONALITIES = {
  ambitious: { n: "Ambitious", d: "Loves success and the spotlight. Proud when you win, restless when you're on the bench.", m: { fame: -0.6, spend: 0.7, night: 0.8, trip: 1.2 } },
  homebody: { n: "Homebody", d: "Happiest at home with family. Hates nights out and fame.", m: { family: 1.6, night: 1.8, fame: 1.5, trip: 0.8, home: 1.5, school: 1.3 } },
  materialistic: { n: "Loves luxury", d: "Lives for nice things. Big purchases and gifts make her happy, cheap dates don't, and money worries hit hard.", m: { spend: -0.6, gift: 1.7, money: 1.6, date: 0.8, home: 1.4 } },
  jealous: { n: "Jealous", d: "Needs to feel she comes first. Nights out and fans crowding you make her furious.", m: { night: 2, fame: 2, date: 1.2, talk: 1.4, family: 1.2 } },
  easygoing: { n: "Easy-going", d: "Relaxed about almost everything. Her mood swings less either way.", m: { all: 0.6 } },
  adventurous: { n: "Adventurous", d: "Wants to see the world. Trips and weekends away mean everything to her.", m: { trip: 1.8, date: 1.3, family: 0.8, night: 0.5 } },
  thrifty: { n: "Careful with money", d: "Hates waste. Flashy purchases upset her, simple gestures win her over.", m: { spend: 1.8, gift: 0.6, money: 1.3, talk: 1.3, date: 1.2 } },
};
function guessMoodCat(why) {
  const w = String(why || "").toLowerCase();
  if (/broke|bills|money is getting tight/.test(w)) return "money";
  if (/loves the new|new (city apartment|family house|villa|mansion)/.test(w)) return "home";
  if (/spent|waste of money|lost .*business|lent /.test(w)) return "spend";
  if (/maldives|weekend|sahel/.test(w)) return "trip";
  if (/time together/.test(w)) return "date";
  if (/night|4am/.test(w)) return "night";
  if (/photo|papers|fans/.test(w)) return "fame";
  if (/gift|flowers|jewellery/.test(w)) return "gift";
  if (/talk/.test(w)) return "talk";
  if (/school|tutor|teacher/.test(w)) return "school";
  if (/family|son|football first/.test(w)) return "family";
  return null;
}
function personalityOf(L) { return L && L.ptype ? PERSONALITIES[L.ptype] : null; }
// adjust a mood change by the partner's personality; returns [delta, why]
function personalize(L, d, why, cat) {
  const P = personalityOf(L); if (!P) return [d, why];
  cat = cat || guessMoodCat(why);
  let m = P.m.all != null ? P.m.all : cat && P.m[cat] != null ? P.m[cat] : 1;
  if (m < 0) { // flips: e.g. luxury lovers enjoy big purchases
    if (d < 0) return [Math.abs(d) * Math.abs(m), cat === "spend" ? "She loves your new purchase." : "She loved being seen with you."];
    return [d * Math.abs(m), why];
  }
  return [d * m, why];
}
function personalityWeekly(L) {
  const P = L && L.ptype, p = pl(G.userPlayer);
  if (!P || !p || !L.partner) return 0;
  if (P === "ambitious") { const f = p.form.length ? avg(p.form.slice(-3)) : 6.5; return f >= 7 ? 1.5 : p.st.ap === 0 && G.day > 40 ? -1.5 : 0; }
  if (P === "materialistic") { const lux = L.items.filter((x) => SHOP_BY[x] && SHOP_BY[x].price >= 200000).length; return lux >= 2 ? 1 : lux === 0 ? -1 : 0; }
  if (P === "homebody") return (L.items.some((x) => SHOP_BY[x] && SHOP_BY[x].cat === "Homes") ? 0.5 : -0.5) + (L.kids.length ? 0.5 : 0);
  if (P === "adventurous") return -0.4;
  return 0;
}
