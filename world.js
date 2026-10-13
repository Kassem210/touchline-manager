/* Touchline — national teams, international football, facilities, player life and legacy, real players. */
"use strict";

// ---------- national teams ----------
const EU_NT = "ENG SCO ESP GER ITA FRA NED POR TUR BEL CRO SRB DEN NOR SWE POL AUT SUI GEO HUN UKR SVK SVN CZE KOS BIH GRE ARM ISL IRL WAL NIR".split(" ");
const AF_NT = "EGY MAR TUN ALG RSA SEN CIV MLI CMR NGA GHA GUI GAB BFA COD ZAM CPV ANG GAM".split(" ");
const ntRegion = (code) => (EU_NT.includes(code) ? "EU" : AF_NT.includes(code) ? "AF" : "WO");
const INTL_WINDOWS = [[34, 40], [66, 72], [101, 107], [230, 236]];
const inIntl = (d) => INTL_WINDOWS.some(([a, b]) => d >= a && d <= b);
Object.assign(COMP_INFO, {
  WC: { name: "World Cup", short: "WC", region: "INT", prize: 0, win: 0, nt: 1 },
  EURO: { name: "European Championship", short: "EURO", region: "EU", prize: 0, win: 0, nt: 1 },
  AFCON: { name: "Africa Cup of Nations", short: "AFCON", region: "AF", prize: 0, win: 0, nt: 1 },
  CWC: { name: "Club World Cup", short: "CWC", region: "INT", prize: 30e6, win: 2e6 },
  INTL: { name: "International match", short: "Intl", region: "INT", prize: 0, win: 0, nt: 1 },
});
const TOURNEYS = ["WC", "EURO", "AFCON", "CWC"];

function buildNations() {
  G.nations = {};
  for (const code in NATIONS) {
    const k = NAT_KIT[code] || ["#7d847f", "#ffffff"];
    G.nations[code] = { id: code, nt: 1, name: NATIONS[code][0], short: code, c1: k[0], c2: k[1], rep: 50, form: "4-3-3", ment: 1, sq: [], trophies: [], pool: 0 };
  }
  rateNations();
}
function natPool() { const by = {}; for (const id in G.players) { const p = G.players[id]; if (p.ret) continue; (by[p.nat] = by[p.nat] || []).push(p); } for (const k in by) by[k].sort((a, b) => b.o - a.o); return by; }
function rateNations(by = natPool()) {
  for (const code in G.nations) {
    const n = G.nations[code], list = by[code] || [];
    n.pool = list.length;
    const gk = list.find((p) => p.pos === "GK"), out = list.filter((p) => p.pos !== "GK").slice(0, 10);
    n.rep = list.length ? Math.round((out.reduce((s, p) => s + p.o, 0) + (gk ? gk.o : 40)) / (out.length + 1) - Math.max(0, 10 - out.length) * 2) : 35;
  }
}
const ntEligible = (code) => G.nations[code] && G.nations[code].pool >= 16;

function callUps(codes, label) {
  const by = natPool();
  rateNations(by);
  for (const code of codes) {
    const n = G.nations[code], list = (by[code] || []).filter((p) => p.inj <= 10 && !p.ret);
    const gks = list.filter((p) => p.pos === "GK").slice(0, 3);
    n.sq = gks.concat(list.filter((p) => p.pos !== "GK").slice(0, 26 - gks.length)).map((p) => p.id);
    n.xi = null; n.bench = null;
  }
  if (G.mode === "career" && G.career && !G.career.retired) {
    const me = pl(G.userPlayer);
    if (me && codes.includes(me.nat)) {
      const n = G.nations[me.nat];
      G.career.called = n.sq.includes(me.id);
      if (G.career.called) inbox({ t: `Called up by ${n.name}`, b: `You've been named in the ${n.name} squad${label ? " for the " + label : " for the international break"}.`, type: "career" });
    }
  }
}

function scheduleInternational() {
  G.comps.INTL = { id: "INTL", type: "intl", name: "Internationals" };
  G.ntCalls = {};
  const codes = Object.keys(G.nations).filter(ntEligible);
  INTL_WINDOWS.forEach(([a, b]) => {
    const days = [firstWd(4, a), firstWd(1, a)].filter((d) => d <= b).sort((x, y) => x - y);
    G.ntCalls[a - 1] = { codes, label: "" };
    days.forEach((d) => {
      const pools = { EU: [], AF: [], WO: [] };
      shuffle(codes.slice()).forEach((c) => pools[ntRegion(c)].push(c));
      let rest = [];
      for (const r in pools) { const l = pools[r]; while (l.length >= 2) { const h = l.pop(), x = l.pop(); addFx({ c: "INTL", d, h, a: x, nt: 1, s: r === "WO" ? "Friendly" : "Qualifier" }); } rest = rest.concat(l); }
      while (rest.length >= 2) addFx({ c: "INTL", d, h: rest.pop(), a: rest.pop(), nt: 1, s: "Friendly" });
    });
  });
}

function pickByRep(list, n, noise = 2) { return list.map((c) => [c, club(c).rep + randn() * noise]).sort((a, b) => b[1] - a[1]).slice(0, n).map((x) => x[0]); }
function scheduleSummer() {
  G.seasonEnd = SEASON_END;
  const Y = G.season + 1, start = 316;
  const codes = Object.keys(G.nations).filter(ntEligible);
  let id = null, teams = [];
  if (Y % 4 === 0) { id = "EURO"; teams = pickByRep(codes.filter((c) => ntRegion(c) === "EU"), 16); }
  else if (Y % 4 === 2) {
    id = "WC";
    const eu = pickByRep(codes.filter((c) => ntRegion(c) === "EU"), 14), af = pickByRep(codes.filter((c) => ntRegion(c) === "AF"), 6);
    teams = eu.concat(af, pickByRep(codes.filter((c) => !eu.includes(c) && !af.includes(c)), 32 - eu.length - af.length));
  } else if (Y % 4 === 3) { id = "AFCON"; teams = pickByRep(codes.filter((c) => ntRegion(c) === "AF"), 16); }
  else {
    id = "CWC";
    const eu = G.clubs.filter((c) => leagueOf(c).region === "EU" && leagueOf(c).tier === 1).map((c) => c.id);
    const af = G.clubs.filter((c) => leagueOf(c).region === "AF").map((c) => c.id);
    teams = pickByRep(eu, 12, 1.5).concat(pickByRep(af, 4, 1.5));
  }
  const n = teams.length - (teams.length % 4);
  teams = teams.slice(0, n >= 16 ? (n >= 32 ? 32 : 16) : n);
  if (teams.length < 8) return;
  const last = setupTourney(id, teams, start, COMP_INFO[id].nt);
  G.seasonEnd = last + 2;
  if (COMP_INFO[id].nt) G.ntCalls[start - 2] = { codes: teams, label: COMP_INFO[id].name };
}

function setupTourney(id, teams, start, nt) {
  const info = COMP_INFO[id], ng = teams.length / 4;
  const sorted = teams.slice().sort((a, b) => club(b).rep - club(a).rep);
  const pots = [0, 1, 2, 3].map((k) => shuffle(sorted.slice(k * ng, (k + 1) * ng)));
  const groups = [];
  for (let g = 0; g < ng; g++) groups.push(pots.map((p) => p[g]));
  const gDays = [start, start + 4, start + 8];
  const names = ng >= 8 ? ["Round of 16", "Quarter-final", "Semi-final", "Final"] : ng >= 4 ? ["Quarter-final", "Semi-final", "Final"] : ["Semi-final", "Final"];
  const comp = { id, type: "groups", tour: 1, nt: nt ? 1 : 0, name: `${info.name} ${G.season + 1}`, teams: teams.slice(), groups, table: {}, si: -1, ties: [], alive: [], gDays,
    stages: names.map((nm, i) => ({ name: nm, days: [start + 13 + 4 * i], legs: 1, neutral: 1 })) };
  teams.forEach((t) => (comp.table[t] = [0, 0, 0, 0, 0, 0, 0]));
  groups.forEach((g, gi) => roundRobin(g).forEach((round, i) => round.forEach(([h, a]) => addFx({ c: id, d: gDays[i], h, a, n: 1, nt: nt ? 1 : 0, s: "Group " + "ABCDEFGH"[gi] }))));
  G.comps[id] = comp;
  return start + 13 + 4 * (names.length - 1);
}

function prepDay(day) {
  const call = G.ntCalls && G.ntCalls[day];
  if (call) callUps(call.codes, call.label);
}
function userInNationFx(f) {
  if (G.mode !== "career" || !f.nt || !G.career || !G.career.called || G.career.retired) return false;
  const me = pl(G.userPlayer);
  return !!me && (f.h === me.nat || f.a === me.nat) && G.nations[me.nat].sq.includes(me.id);
}
function userTeamOf(f) {
  if (f.h === G.userClub || f.a === G.userClub) return G.userClub;
  if (f.nt && G.mode === "career") { const me = pl(G.userPlayer); if (me) return me.nat; }
  return G.userClub;
}

// ---------- facilities (manager) ----------
const FAC = {
  train: ["Training ground", "Your players develop faster.", "Development +8% per level"],
  youth: ["Youth academy", "Better academy graduates every summer.", "Graduate potential +2 per level"],
  med: ["Medical centre", "Injured players come back sooner.", "Injury time −7% per level"],
  stad: ["Stadium", "More fans, more matchday income.", "Gate receipts +15% per level"],
};
function initFacilities(c) { const l = c.rep >= 83 ? 5 : c.rep >= 76 ? 4 : c.rep >= 67 ? 3 : c.rep >= 58 ? 2 : 1; c.fac = { train: l, youth: l, med: l, stad: l }; }
const facLvl = (c, k) => (c && c.fac ? c.fac[k] : 2);
function facCost(c, k) { const lvl = c.fac[k]; if (lvl >= 5) return null; return Math.round((1.4e6 * Math.pow(lvl + 1, 1.7) * (0.25 + clubMoney(c) * 1.6)) / 1e5) * 1e5; }
function upgradeFacility(k) {
  const c = club(G.userClub), cost = facCost(c, k);
  if (cost == null) return { ok: false, msg: "That's already at the top level." };
  if (c.bal < cost) return { ok: false, msg: `You need ${money(cost)} in the bank. The club has ${money(c.bal)}.` };
  c.bal -= cost; c.fac[k]++;
  G.mgr.conf = clamp(G.mgr.conf + 1, 0, 100);
  return { ok: true, msg: `${FAC[k][0]} upgraded to level ${c.fac[k]}.` };
}

// ---------- player life ----------
const SHOP = [
  { id: "car1", cat: "Cars", n: "City hatchback", price: 20000, up: 60, h: 2 },
  { id: "car2", cat: "Cars", n: "German saloon", price: 75000, up: 180, h: 4 },
  { id: "car3", cat: "Cars", n: "Sports car", price: 240000, up: 700, h: 7 },
  { id: "car4", cat: "Cars", n: "Supercar", price: 520000, up: 1800, h: 10 },
  { id: "car5", cat: "Cars", n: "Hypercar", price: 3200000, up: 6000, h: 14 },
  { id: "home1", cat: "Homes", n: "City apartment", price: 450000, up: 900, h: 6 },
  { id: "home2", cat: "Homes", n: "Family house", price: 1300000, up: 2200, h: 9 },
  { id: "home3", cat: "Homes", n: "Villa with a pool", price: 4800000, up: 6000, h: 13 },
  { id: "home4", cat: "Homes", n: "Mansion", price: 15000000, up: 16000, h: 17 },
  { id: "lux1", cat: "Luxury", n: "Designer watch", price: 65000, up: 0, h: 3 },
  { id: "lux2", cat: "Luxury", n: "Art collection", price: 1500000, up: 500, h: 5, keep: 1 },
  { id: "lux3", cat: "Luxury", n: "Yacht", price: 9000000, up: 22000, h: 12 },
  { id: "lux4", cat: "Luxury", n: "Private jet", price: 30000000, up: 48000, h: 15 },
  { id: "pro1", cat: "Staff", n: "Personal trainer", price: 0, up: 4000, h: 1, fx: "You develop about 15% faster." },
  { id: "pro2", cat: "Staff", n: "Personal chef", price: 0, up: 2500, h: 2, fx: "You recover fitness faster between games." },
  { id: "pro3", cat: "Staff", n: "Private physio", price: 0, up: 3000, h: 1, fx: "Your injuries heal about a third faster." },
  { id: "pro4", cat: "Staff", n: "Top agent", price: 150000, up: 0, h: 1, fx: "Clubs offer you about 15% higher wages." },
];
const SHOP_BY = Object.fromEntries(SHOP.map((x) => [x.id, x]));
const PARTNER_NAMES = "Sara Lina Maya Nour Hana Emma Sofia Laila Yasmin Amira Chloe Julia Leila Mariam Zoe Ines Clara Aya Salma Farida Mia Olivia Camille Elena Noor Dina Rania Malak Lucia Ana Hannah Grace".split(" ");
const DATES = [["coffee", "Coffee date", 60, 6], ["dinner", "Dinner somewhere nice", 450, 11], ["trip", "Weekend away", 7000, 18]];
const absDay = () => G.season * 400 + G.day;
const hasItem = (id) => G.mode === "career" && G.career && G.career.life && G.career.life.items.includes(id);
function newLife(cash = 25000) { return { cash, happy: 60, items: [], ap: 3, status: "single", partner: null, rel: 0, kids: [], fame: 5, due: null }; }
function lifeHappyTarget(L) {
  const items = Math.min(30, L.items.reduce((s, id) => s + (SHOP_BY[id] ? SHOP_BY[id].h : 0), 0));
  return clamp(48 + items + { single: 0, dating: 5, engaged: 8, married: 11 }[L.status] + Math.min(9, L.kids.length * 3), 0, 100);
}
function lifeWeekly() {
  const L = G.career && G.career.life, p = pl(G.userPlayer);
  if (!L || !p) return;
  L.ap = 3;
  const net = G.career.retired ? 0 : Math.round(p.wage * 0.55);
  const upkeep = L.items.reduce((s, id) => s + (SHOP_BY[id] ? SHOP_BY[id].up : 0), 0);
  L.cash += net - upkeep;
  if (L.cash < 0) {
    const staff = L.items.filter((id) => SHOP_BY[id].cat === "Staff");
    if (staff.length) { L.items = L.items.filter((id) => SHOP_BY[id].cat !== "Staff"); inbox({ t: "Money's tight", b: "Your account went into the red, so your personal staff have been let go. Sell something if you need cash.", type: "life" }); }
    L.happy = clamp(L.happy - 3, 0, 100);
  }
  L.happy = Math.round(clamp(L.happy + (lifeHappyTarget(L) - L.happy) * 0.12, 0, 100));
  if (!G.career.retired) p.mor = clamp(p.mor + (L.happy - 60) * 0.04, 5, 100);
  const f = p.form.length ? avg(p.form) : 6.5;
  L.fame = r1(clamp(L.fame + (f - 6.8) * 0.15 + (p.o - 65) * 0.004, 0, 100));
  if (L.status === "dating" || L.status === "engaged") L.rel = clamp(L.rel - 0.7, 0, 100);
  if (L.due != null && absDay() >= L.due) {
    L.due = null;
    const boy = rnd() < 0.5;
    const nm = boy ? pick(NAMEPOOL[(NATIONS[p.nat] || NATIONS.ENG)[1]].f) : pick(PARTNER_NAMES);
    const peak = Math.max(p.o, ...p.hist.map((h) => h.o));
    L.kids.push({ name: nm, by: G.season, g: boy ? "boy" : "girl", pot: clamp(Math.round(peak * 0.75 + 20 + randn() * 6), 55, 95) });
    L.happy = clamp(L.happy + 12, 0, 100);
    inbox({ t: `It's a ${boy ? "boy" : "girl"}!`, b: `${nm} ${p.ln} was born today. Congratulations!`, type: "life" });
  }
}
function lifeAction(kind, arg) {
  const L = G.career.life, p = pl(G.userPlayer);
  const spend = (v) => { if (L.cash < v) return false; L.cash -= v; return true; };
  const useAp = () => { if (L.ap <= 0) return false; L.ap--; return true; };
  if (kind === "buy") {
    const it = SHOP_BY[arg]; if (!it) return "That isn't for sale.";
    if (L.items.includes(arg)) return "You already own that.";
    if (!spend(it.price)) return `You need ${money(it.price)}. You have ${money(L.cash)}.`;
    L.items.push(arg); L.happy = clamp(L.happy + Math.ceil(it.h / 2), 0, 100);
    return it.price ? `You bought the ${it.n.toLowerCase()}.` : `You hired a ${it.n.toLowerCase()}.`;
  }
  if (kind === "sell") {
    const it = SHOP_BY[arg]; if (!L.items.includes(arg)) return "You don't own that.";
    L.items = L.items.filter((x) => x !== arg);
    const back = Math.round(it.price * (it.keep ? 1 : 0.6));
    L.cash += back;
    return it.price ? `Sold for ${money(back)}.` : `You let your ${it.n.toLowerCase()} go.`;
  }
  if (kind === "breakup") { if (L.status === "single" || L.status === "married") return "There's nobody to break up with."; L.status = "single"; L.partner = null; L.rel = 0; L.happy = clamp(L.happy - 8, 0, 100); return "You've split up."; }
  if (!useAp()) return "You've used up your free time this week. Continue to next week.";
  if (kind === "date") {
    const d = DATES.find((x) => x[0] === arg) || DATES[0];
    if (!spend(d[2])) { L.ap++; return `That costs ${money(d[2])}.`; }
    if (L.status === "single") {
      if (rnd() < 0.28 + L.fame * 0.006 + (arg === "trip" ? 0.15 : arg === "dinner" ? 0.07 : 0)) {
        L.partner = pick(PARTNER_NAMES); L.status = "dating"; L.rel = 25; L.happy = clamp(L.happy + 6, 0, 100);
        return `You hit it off with ${L.partner}. You're seeing each other now.`;
      }
      L.happy = clamp(L.happy + 1, 0, 100);
      return "Nice evening, but no spark this time.";
    }
    L.rel = clamp(L.rel + d[3] + ri(-2, 4), 0, 100); L.happy = clamp(L.happy + 3, 0, 100);
    return `${L.partner} loved it. Your relationship is getting stronger.`;
  }
  if (kind === "propose") {
    if (L.status !== "dating") { L.ap++; return "You need to be in a relationship first."; }
    if (!spend(30000)) { L.ap++; return "A ring costs €30K."; }
    if (rnd() < L.rel / 100 + 0.1) { L.status = "engaged"; L.happy = clamp(L.happy + 10, 0, 100); return `${L.partner} said yes! You're engaged.`; }
    L.rel = clamp(L.rel - 20, 0, 100);
    if (L.rel < 15) { const n = L.partner; L.status = "single"; L.partner = null; return `${n} said no, and ended things.`; }
    return `${L.partner} said it's too soon. Give it time.`;
  }
  if (kind === "wedding") {
    if (L.status !== "engaged") { L.ap++; return "You need to be engaged first."; }
    const big = arg === "big", cost = big ? 900000 : 90000;
    if (!spend(cost)) { L.ap++; return `That wedding costs ${money(cost)}.`; }
    L.status = "married"; L.happy = clamp(L.happy + (big ? 20 : 15), 0, 100); L.fame = clamp(L.fame + (big ? 4 : 1), 0, 100);
    return `You married ${L.partner}. Congratulations!`;
  }
  if (kind === "baby") {
    if (L.status !== "married") { L.ap++; return "Settle down first."; }
    if (L.due != null) { L.ap++; return "A baby is already on the way."; }
    if (rnd() < 0.4) { L.due = absDay() + 266; return `Big news: ${L.partner} is expecting. The baby is due in about nine months.`; }
    return "Not this time. Keep trying.";
  }
  if (kind === "night") {
    if (!spend(3000)) { L.ap++; return "A night out costs €3K."; }
    L.happy = clamp(L.happy + 5, 0, 100); p.fit = clamp(p.fit - 12, 30, 100);
    if (rnd() < 0.1) { L.happy = clamp(L.happy - 7, 0, 100); p.mor = clamp(p.mor - 6, 5, 100); L.fame = clamp(L.fame + 1, 0, 100); return "The papers got photos of your night out. The manager isn't happy."; }
    return "Great night with the lads. A bit tired, though.";
  }
  if (kind === "family") { L.happy = clamp(L.happy + 5, 0, 100); L.rel = clamp(L.rel + 5, 0, 100); p.mor = clamp(p.mor + 2, 5, 100); return "A quiet day with the family. Just what you needed."; }
  if (kind === "charity") { if (!spend(100000)) { L.ap++; return "The donation is €100K."; } L.happy = clamp(L.happy + 4, 0, 100); L.fame = clamp(L.fame + 3, 0, 100); return "Your donation made the news for all the right reasons."; }
  L.ap++;
  return "";
}

function retireUser() {
  const p = pl(G.userPlayer);
  G.career.retired = `${G.season}/${(G.season + 1) % 100}`;
  G.career.called = false;
  if (p && p.club >= 0) { G.career.lastClub = p.club; releaseToFA(p); }
  if (p) p.ret = 1;
}
function seasonsUntil16(kid) { return Math.max(0, 16 - (G.season - kid.by)); }
// Fast-forward one season without playing matches (used for legacy time skips)
function fastSeason() {
  for (let w = 0; w < 44; w++) for (const id in G.players) develop(G.players[id]);
  for (const id in G.leagues) { const lg = G.leagues[id]; lg.clubs.forEach((c) => { const t = lg.table[c]; t[0] = (lg.clubs.length - 1) * 2; t[6] = Math.round(club(c).rep * 0.9 + randn() * 7); }); }
  if (G.career && G.career.life) { const L = G.career.life; for (let w = 0; w < 44; w++) lifeWeekly(); L.ap = 3; }
  G.day = (G.seasonEnd || SEASON_END) + 1;
  endSeason();
}
function startLegacy(ki) {
  const old = G.career, dad = pl(G.userPlayer), kid = old.life.kids[ki];
  const lastClub = old.lastClub != null ? club(old.lastClub) : null;
  const ages = 16;
  const c = lastClub && lastClub.rep <= 74 ? lastClub : pick(G.clubs.filter((x) => x.rep >= 55 && x.rep <= 66 && (!lastClub || x.country === lastClub.country))) || pick(G.clubs);
  const p = genPlayer({ pos: dad ? dad.pos : "ST", ovr: ri(46, 52), ag: ages, nat: dad ? dad.nat : "ENG", cid: c.id, pot: kid.pot, names: [kid.name, dad ? dad.ln : "Junior"] });
  if (dad) { p.face = genFace(dad.nat, 16); p.face[0] = dad.face[0]; }
  setContract(p, c, 3); c.sq.push(p.id); p.user = 1;
  const apps = dad ? dad.hist.reduce((s, h) => s + h.ap, 0) : 0, goals = dad ? dad.hist.reduce((s, h) => s + h.g, 0) : 0;
  const legacy = (old.legacy || []).concat([{ n: dad ? fullName(dad) : "Your father", s0: old.started, s1: old.retired, apps, goals, caps: dad ? dad.caps || 0 : 0, peak: dad ? Math.max(dad.o, ...dad.hist.map((h) => h.o)) : 0, trophies: old.trophies.length, awards: old.awards.length }]);
  if (dad) delete G.players[dad.id];
  G.userPlayer = p.id; G.userClub = c.id;
  G.career = { tf: 2, trophies: [], awards: [], started: G.season, legacy, life: newLife(Math.round(old.life.cash * 0.5) + 25000), called: false };
  inbox({ t: `${fullName(p)} signs for ${c.name}`, b: `The next generation begins. ${kid.name} inherits ${money(Math.round(old.life.cash * 0.5))} from the family and his father's name on his back.`, type: "career" });
}

// ---------- real players ----------
const TRAIT_IDX = { P: 0, S: 1, K: 2, D: 3, T: 4, H: 5 };
function applyRealPlayers() {
  for (const cname in REAL_PLAYERS) {
    const c = G.clubs.find((x) => x.name === cname);
    if (!c) continue;
    for (const row of REAL_PLAYERS[cname].trim().split("\n")) {
      const [name, pos, by, ovr, nat, pot, tr] = row.split("|");
      const parts = name.trim().split(" ");
      const fn = parts.length > 1 ? parts[0] : "", ln = parts.length > 1 ? parts.slice(1).join(" ") : parts[0];
      const target = +ovr;
      let pool = squad(c.id).filter((q) => !q.real && q.pos === pos);
      if (!pool.length) pool = squad(c.id).filter((q) => !q.real && POS_GROUP[q.pos] === POS_GROUP[pos]);
      if (!pool.length) pool = squad(c.id).filter((q) => !q.real);
      const victim = pool.sort((a, b) => Math.abs(a.o - target) - Math.abs(b.o - target))[0];
      if (victim) { c.sq = c.sq.filter((x) => x !== victim.id); delete G.players[victim.id]; }
      const p = genPlayer({ pos, ovr: target, ag: G.season - +by, nat, cid: c.id, pot: pot ? +pot : null, names: [fn, ln] });
      p.real = 1;
      if (tr) {
        for (const ch of tr) if (TRAIT_IDX[ch] != null) p.a[TRAIT_IDX[ch]] = clamp(p.a[TRAIT_IDX[ch]] + 6, 10, 99);
        const diff = target - ovrAt(p, pos), w = POS_W[pos];
        for (let i = 0; i < 7; i++) if (w[i] > 0) p.a[i] = r1(clamp(p.a[i] + diff, 10, 99));
        calcOvr(p); if (p.pot < p.o) p.pot = p.o;
      }
      p.face = genFace(nat, G.season - +by);
      setContract(p, c, ri(1, 5));
      c.sq.push(p.id);
    }
  }
}

// ---------- old-save upgrade ----------
function migrateSave() {
  if (!G.nations) buildNations();
  G.clubs.forEach((c) => { if (!c.fac) initFacilities(c); });
  if (G.mode === "career" && G.career && !G.career.life) G.career.life = newLife();
  if (G.seasonEnd == null) G.seasonEnd = SEASON_END;
  if (!G.ntCalls) G.ntCalls = {};
  if (!G.comps.INTL) G.comps.INTL = { id: "INTL", type: "intl", name: "Internationals" };
  G.v = 2;
}
