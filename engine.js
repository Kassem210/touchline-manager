/* Touchline — game engine: world, calendar, competitions, economy, transfers, seasons. */
"use strict";

let G = null;        // the loaded save
let DAYIDX = {};     // day -> fixture indexes (rebuilt, not saved)

// ---------- random + helpers ----------
const rnd = Math.random;
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (a) => a[Math.floor(rnd() * a.length)];
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
function randn() { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function wpick(pairs) { let t = 0; for (const p of pairs) t += p[1]; let r = rnd() * t; for (const p of pairs) { r -= p[1]; if (r <= 0) return p[0]; } return pairs[pairs.length - 1][0]; }
const r1 = (x) => Math.round(x * 10) / 10;
const parseW = (s) => s.split(" ").map((x) => { const [k, w] = x.split(":"); return [k, +w]; });
const FOR_EU = parseW(FOREIGN_EU), FOR_AF = parseW(FOREIGN_AF);
const NAMEPOOL = {};
for (const k in POOLS) NAMEPOOL[k] = { f: POOLS[k].f.split(" "), l: POOLS[k].l.split(" ").map((x) => x.replace(/_/g, " ")) };

const SEASON_END = 312;
const WINDOWS = [[0, 31], [153, 183]];
const inWindow = (d = G.day) => WINDOWS.some(([a, b]) => d >= a && d <= b);

// ---------- dates ----------
function dateOf(day, season = G.season) { return new Date(Date.UTC(season, 7, 1 + day)); }
function dow(day) { return dateOf(day).getUTCDay(); }
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function fmtDate(day, opt = {}) {
  const d = dateOf(day, opt.season != null ? opt.season : G.season);
  const s = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  return (opt.wd ? WDAYS[d.getUTCDay()] + " " : "") + s + (opt.y ? " " + d.getUTCFullYear() : "");
}
function daysWith(wd, from, to) { const r = []; for (let d = from; d <= to; d++) if (dow(d) === wd) r.push(d); return r; }
function firstWd(wd, from) { let d = from; while (dow(d) !== wd) d++; return d; }
function spread(list, n) {
  if (n >= list.length) return list.slice(0, n);
  if (n === 1) return [list[list.length - 1]];
  const out = []; for (let i = 0; i < n; i++) out.push(list[Math.round((i * (list.length - 1)) / (n - 1))]);
  return out;
}

// ---------- players ----------
const age = (p) => G.season - p.by;
function ovrAt(p, pos) { const w = POS_W[pos]; let s = 0; for (let i = 0; i < 7; i++) s += w[i] * p.a[i]; return s; }
function calcOvr(p) { p.o = Math.round(ovrAt(p, p.pos)); return p.o; }
function famPenalty(p, pos) { if (p.pos === pos) return 0; if (pos === "GK" || p.pos === "GK") return 35; return POS_NEAR[p.pos].includes(pos) ? 3 : 9; }
function effAt(p, pos) { return ovrAt(p, pos) - famPenalty(p, pos); }
const club = (id) => (typeof id === "string" ? G.nations[id] : G.clubs[id]);
const pl = (id) => G.players[id];
const leagueOf = (c) => G.leagues[c.lg];
const clubMoney = (c) => (c.nt ? 0.3 : leagueOf(c).money);
const squad = (cid) => club(cid).sq.map(pl).filter(Boolean);
const fullName = (p) => (p.fn ? p.fn + " " : "") + p.ln;
const shortName = (p) => (p.fn ? p.fn[0] + ". " : "") + p.ln;

function genFace(nat, ag) {
  const n = NATIONS[nat] || NATIONS.ENG; let sk, hc;
  if (n[2] === "asian") { sk = ri(0, 2); hc = "black"; }
  else {
    const cat = wpick([["l", n[2][0]], ["m", n[2][1]], ["d", n[2][2]]]);
    sk = cat === "l" ? ri(0, 2) : cat === "m" ? ri(2, 4) : ri(4, 6);
    hc = sk >= 4 ? "black" : sk >= 2 ? wpick([["black", 5], ["dark", 4], ["brown", 1]]) : wpick([["dark", 3], ["brown", 3], ["light", 2], ["blond", 1.5], ["red", 0.4], ["black", 1]]);
  }
  if (ag >= 32 && rnd() < 0.25) hc = "grey";
  const hs = sk >= 4 ? wpick([[0, 1], [1, 4], [4, 3], [5, 1.2], [7, 1.5], [8, 2], [2, 1]]) : wpick([[0, 0.6], [1, 2], [2, 4], [3, 3], [4, 1], [6, 1], [8, 1]]);
  const bd = wpick([[0, 4], [1, 3], [2, 2], [3, 0.8], [4, 0.3]]);
  return [sk, hs, hc, bd, ri(0, 2), ri(0, 2), ri(0, 2), ri(0, 2)];
}

function randName(nat) {
  const pool = NAMEPOOL[(NATIONS[nat] || NATIONS.ENG)[1]];
  return [pick(pool.f), pick(pool.l)];
}

function genPlayer({ pos, ovr, ag, nat, cid = -1, pot = null, names = null }) {
  const b = POS_BIAS[pos];
  const a = b.map((x) => clamp(ovr + x + randn() * 4.5, 15, 97));
  const p = { id: G.nextP++, pos, a, by: G.season - ag, nat, club: cid };
  const [fn, ln] = names || randName(nat);
  p.fn = fn; p.ln = ln;
  // correct to target overall on weighted attributes
  const diff = ovr - ovrAt(p, pos), w = POS_W[pos];
  for (let i = 0; i < 7; i++) if (w[i] > 0) p.a[i] = r1(clamp(p.a[i] + diff, 15, 99)); else p.a[i] = r1(p.a[i]);
  calcOvr(p);
  if (pot == null) {
    if (ag <= 18) pot = p.o + ri(8, 26);
    else if (ag <= 21) pot = p.o + ri(4, 18);
    else if (ag <= 24) pot = p.o + ri(1, 9);
    else if (ag <= 27) pot = p.o + ri(0, 3);
    else pot = p.o;
  }
  p.pot = clamp(Math.max(pot, p.o), 1, 96);
  p.face = genFace(nat, ag);
  p.foot = rnd() < 0.24 ? "L" : "R";
  if (pos === "LB" || pos === "LW") p.foot = rnd() < 0.7 ? "L" : "R";
  p.fit = 100; p.mor = 70; p.inj = 0; p.sus = 0; p.yc = 0;
  p.st = newStats(); p.hist = []; p.form = [];
  G.players[p.id] = p;
  return p;
}
function newStats() { return { ap: 0, g: 0, as: 0, rs: 0, cs: 0, y: 0, r: 0, mom: 0, lg: 0 }; }

function pickNat(lg) {
  if (rnd() < lg.dom) return lg.nat;
  return wpick(lg.region === "AF" ? FOR_AF : FOR_EU);
}

function playerValue(p) {
  const ag = age(p);
  let eff = p.o;
  if (ag < 24) eff = p.o + (p.pot - p.o) * 0.45 * Math.min(1, (24 - ag) / 6);
  let v = 1e6 * Math.exp((eff - 60) * 0.175);
  v *= ag <= 23 ? 1.15 : ag <= 27 ? 1 : ag <= 29 ? 0.85 : ag <= 31 ? 0.6 : ag <= 33 ? 0.35 : 0.15;
  if (p.club >= 0) {
    const m = clubMoney(club(p.club)); v *= 0.55 + 0.45 * Math.min(1, m * 3);
    if (p.ce != null && p.ce <= G.season) v *= 0.65;
  } else v *= 0.5;
  return v < 1e6 ? Math.max(10000, Math.round(v / 25000) * 25000) : Math.round(v / 1e5) * 1e5;
}
function wageFor(p, c) {
  const m = c ? clubMoney(c) : 0.2;
  const w = 1000 * Math.exp((p.o - 50) * 0.13) * Math.pow(m, 0.4) * (age(p) < 21 ? 0.6 : 1);
  return Math.max(300, Math.round(w / 100) * 100);
}

// ---------- squads ----------
const TEMPLATE_START = ["GK", "RB", "CB", "CB", "LB", "DM", "CM", "CM", "RW", "ST", "LW"];
const TEMPLATE_BENCH = ["GK", "GK", "CB", "CB", "LB", "RB", "DM", "CM", "AM", "LW", "RW", "ST", "ST"];
const AI_FORMS = [["4-3-3", 5], ["4-2-3-1", 5], ["4-4-2", 3], ["4-1-4-1", 2], ["3-5-2", 1.5], ["3-4-3", 1], ["5-3-2", 1], ["4-4-2 Diamond", 0.7]];

function genSquad(c, names) {
  const lg = leagueOf(c); c.sq = [];
  const roles = TEMPLATE_START.map((p) => [p, 0]).concat(TEMPLATE_BENCH.map((p) => [p, 1]));
  roles.forEach(([pos, bench], i) => {
    let ovr, ag, pot = null;
    if (!bench) { ovr = Math.round(c.rep - 1.5 + randn() * 2.5); ag = clamp(Math.round(26 + randn() * 3.4), 19, 35); }
    else if (i >= roles.length - 3 && i % 2 === 0) { ag = ri(17, 19); ovr = Math.round(c.rep - 13 + randn() * 3); pot = Math.round(c.rep + 2 + randn() * 6); }
    else { ovr = Math.round(c.rep - 6 - rnd() * 7); ag = clamp(Math.round(25 + randn() * 4.5), 18, 36); }
    if (pos === "GK" && bench) ovr -= 2;
    const nat = names && names[i] && names[i][2] ? names[i][2] : pickNat(lg);
    const p = genPlayer({ pos, ovr: clamp(ovr, 35, 93), ag, nat, cid: c.id, pot, names: names && names[i] ? [names[i][0], names[i][1]] : null });
    setContract(p, c, ri(1, 4));
    c.sq.push(p.id);
  });
}
function setContract(p, c, years) { p.club = c.id; p.wage = wageFor(p, c); p.ce = G.season + years; p.val = playerValue(p); }

function genClubFinances(c) {
  const vals = squad(c.id).map((p) => p.val).sort((a, b) => b - a);
  const top = vals.slice(0, 15).reduce((s, v) => s + v, 0);
  const m = clubMoney(c);
  c.budget = Math.round((top * 0.15 * Math.min(1, Math.pow(m, 0.3) * 1.1)) / 1e5) * 1e5;
  const wages = squad(c.id).reduce((s, p) => s + p.wage, 0);
  c.wcap = Math.round(wages * 1.12 / 100) * 100;
  c.income = Math.round(wages * 1.1);
  c.bal = Math.round(c.budget * 1.4 + wages * 8);
}

// ---------- new game ----------
function newWorld(opts) {
  G = { v: 2, real: !!opts.real, id: "s" + Date.now().toString(36), name: opts.saveName || "New save", mode: opts.mode, season: 2026, day: 0, created: Date.now(), nextP: 1,
    clubs: [], players: {}, leagues: {}, comps: {}, fx: [], inbox: [], news: [], hist: { lg: {}, cup: {}, euro: {}, awards: [] },
    userClub: null, userPlayer: null, mgr: { name: opts.managerName || "You", conf: 65, hist: [], trophies: [] }, career: null, msgSeq: 1, lastStop: null };
  LEAGUE_DATA.forEach((L) => {
    const lg = { id: L.id, name: L.name, country: L.country, nat: L.nat, tier: L.tier, money: L.money, dom: L.dom, down: L.down || 0, up: L.up || 0, region: L.region, clubs: [], table: {}, order: null };
    L.clubs.trim().split("\n").forEach((row) => {
      const [name, short, rep, c1, c2] = row.split("|");
      const c = { id: G.clubs.length, name, short, rep: +rep, c1, c2, lg: L.id, country: L.country, nat: L.nat, form: wpick(AI_FORMS), ment: 1, sq: [], xi: null, bench: null, trophies: [] };
      G.clubs.push(c); lg.clubs.push(c.id);
    });
    G.leagues[L.id] = lg;
  });
  let customId = null;
  if (opts.custom) {
    const cu = opts.custom, lg = G.leagues[cu.lg];
    const target = lg.clubs.map(club).sort((a, b) => a.rep - b.rep)[0];
    Object.assign(target, { name: cu.name, short: cu.short.toUpperCase().slice(0, 4), c1: cu.c1, c2: cu.c2, rep: cu.rep, custom: true });
    customId = target.id;
  }
  G.clubs.forEach((c) => genSquad(c, c.id === customId ? opts.custom.names : null));
  if (opts.real) applyRealPlayers();
  G.clubs.forEach(initFacilities);
  // free agents
  for (let i = 0; i < 160; i++) {
    const pos = pick(POSITIONS.concat(["CB", "CM", "ST", "GK"]));
    const p = genPlayer({ pos, ovr: ri(45, 72), ag: ri(19, 34), nat: wpick(FOR_EU.concat([["ENG", 6], ["ESP", 4], ["EGY", 2], ["MAR", 2]])) });
    p.club = -1; p.wage = wageFor(p, null); p.ce = null; p.val = playerValue(p);
  }
  G.clubs.forEach(genClubFinances);
  buildNations();
  if (opts.mode === "manager") {
    G.userClub = customId != null ? customId : opts.clubId;
    const uc = club(G.userClub); uc.form = "4-3-3"; uc.auto = true; autoLineup(uc, true);
  } else {
    G.career = { tf: 2, trophies: [], awards: [], started: G.season, caps: 0, req: null, offers: [], life: newLife(), called: false };
    const cp = opts.player, c = club(opts.clubId);
    const p = genPlayer({ pos: cp.pos, ovr: cp.ovr, ag: cp.age, nat: cp.nat, cid: c.id, pot: cp.pot, names: [cp.fn, cp.ln] });
    if (cp.face) p.face = cp.face; if (cp.ph) p.ph = cp.ph; p.foot = cp.foot || p.foot;
    p.user = 1; setContract(p, c, 3); p.wage = Math.max(p.wage, 800);
    // move weakest same-position player out to keep squad size sane
    const same = squad(c.id).filter((q) => q.pos === cp.pos && q.id !== p.id).sort((a, b) => a.o - b.o)[0];
    if (same) releaseToFA(same);
    c.sq.push(p.id);
    G.userPlayer = p.id; G.userClub = c.id;
  }
  initSeason(true);
  inbox(opts.mode === "manager"
    ? { t: `Welcome to ${club(G.userClub).name}`, b: `The board expects ${expectText(club(G.userClub))}. Your transfer budget is ${money(club(G.userClub).budget)}. The summer window is open until ${fmtDate(WINDOWS[0][1])}.`, type: "board" }
    : { t: `You've signed for ${club(G.userClub).name}`, b: `Welcome to professional football, ${fullName(pl(G.userPlayer))}. Train hard, take your chances, and the bigger clubs will notice.`, type: "career" });
  return G;
}

function releaseToFA(p) {
  if (p.club >= 0) { const c = club(p.club); c.sq = c.sq.filter((x) => x !== p.id); if (c.xi) c.xi = c.xi.map((x) => (x === p.id ? null : x)); if (c.bench) c.bench = c.bench.filter((x) => x !== p.id); }
  p.club = -1; p.ce = null; p.listed = 0; p.val = playerValue(p); p.wage = wageFor(p, null);
}

// ---------- expectations / board ----------
function leagueRank(c) { const lg = leagueOf(c); return lg.clubs.map(club).sort((a, b) => b.rep - a.rep).findIndex((x) => x.id === c.id) + 1; }
function expectPos(c) { return leagueRank(c); }
function expectText(c) {
  const lg = leagueOf(c), r = expectPos(c), n = lg.clubs.length;
  if (r === 1) return `you to win the ${lg.name}`;
  if (r <= 4 && lg.tier === 1) return `a top-four finish`;
  if (r <= Math.max(2, lg.up) && lg.tier > 1) return `promotion`;
  if (r <= n / 2) return `a top-half finish`;
  if (r > n - (lg.down || 3) - 2) return `you to avoid relegation`;
  return `a mid-table finish`;
}

// ---------- calendar & competitions ----------
function addFx(o) { o.i = G.fx.length; o.hg = null; o.ag = null; o.p = 0; G.fx.push(o); (DAYIDX[o.d] = DAYIDX[o.d] || []).push(o.i); return o.i; }
function rebuildIdx() { DAYIDX = {}; G.fx.forEach((f) => (DAYIDX[f.d] = DAYIDX[f.d] || []).push(f.i)); }

function roundRobin(ids) {
  const t = ids.slice(); if (t.length % 2) t.push(-1);
  const n = t.length, rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const m = [];
    for (let i = 0; i < n / 2; i++) {
      const a = t[i], b = t[n - 1 - i];
      if (a < 0 || b < 0) continue;
      m.push(i === 0 ? (r % 2 ? [b, a] : [a, b]) : i % 2 ? [b, a] : [a, b]);
    }
    rounds.push(m); t.splice(1, 0, t.pop());
  }
  return rounds;
}

function initSeason(first) {
  G.fx = []; DAYIDX = {}; G.comps = {};
  const sats = daysWith(6, 8, 292).filter((d) => !inIntl(d)), tues = daysWith(2, 30, 280).filter((d) => !inIntl(d)), weds = daysWith(3, 38, 282).filter((d) => !inIntl(d));
  for (const id in G.leagues) {
    const lg = G.leagues[id]; lg.table = {};
    lg.clubs.forEach((c) => (lg.table[c] = [0, 0, 0, 0, 0, 0, 0]));
    const rr = roundRobin(shuffle(lg.clubs.slice()));
    const all = rr.concat(rr.map((r) => r.map(([a, b]) => [b, a])));
    let days = spread(sats, all.length);
    if (all.length > sats.length) days = sats.concat(spread(tues.filter((d) => d > 40), all.length - sats.length)).sort((a, b) => a - b);
    all.forEach((round, ri_) => round.forEach(([h, a]) => addFx({ c: id, d: days[ri_], h, a, s: "Matchday " + (ri_ + 1) })));
    G.comps[id] = { id, type: "league", name: lg.name };
  }
  // domestic cups
  const byCountry = {};
  for (const id in G.leagues) { const lg = G.leagues[id]; (byCountry[lg.country] = byCountry[lg.country] || []).push(...lg.clubs); }
  for (const country in byCountry) {
    const ids = byCountry[country], N = ids.length;
    let T = 1; while (T * 2 <= N) T *= 2;
    const rounds = (T === N ? 0 : 1) + Math.log2(T);
    const final = firstWd(6, 295);
    const cupDays = spread(weds.filter((d) => d >= 40 && d <= 270), rounds - 1).concat([final]);
    const names = [];
    for (let r = 0; r < rounds; r++) { const left = rounds - r; names.push(left === 1 ? "Final" : left === 2 ? "Semi-final" : left === 3 ? "Quarter-final" : "Round " + (r + 1)); }
    const id = "CUP_" + country.replace(/\W/g, "");
    G.comps[id] = { id, type: "cup", name: CUP_NAMES[country], country, alive: ids.slice(), stages: cupDays.map((d, i) => ({ name: names[i], days: [d], legs: 1 })), si: -1, ties: [] };
    nextStage(G.comps[id]);
  }
  // continental
  const ord = (lgid) => { const lg = G.leagues[lgid]; return lg.order && lg.order.every((x) => lg.clubs.includes(x)) && lg.order.length === lg.clubs.length ? lg.order.slice() : lg.clubs.slice().sort((a, b) => club(b).rep - club(a).rep); };
  const used = new Set();
  for (const cid of ["UCL", "UEL", "CAFCL", "CAFCC"]) {
    const slots = EURO_SLOTS[cid], teams = [];
    for (const lgid in slots) { const o = ord(lgid).filter((x) => !used.has(x)); for (let i = 0; i < slots[lgid] && i < o.length; i++) { teams.push(o[i]); used.add(o[i]); } }
    const info = COMP_INFO[cid];
    if (info.region === "EU") setupEuro(cid, teams); else setupGroups(cid, teams);
  }
  if (G.nations) { scheduleInternational(); scheduleSummer(); }
  G.day = 0;
  G.clubs.forEach((c) => (c.seasonRes = { w: 0, d: 0, l: 0 }));
}

function setupEuro(cid, teams) {
  const info = COMP_INFO[cid];
  const wd = cid === "UCL" ? 2 : 4;
  const tg = [46, 60, 81, 95, 116, 130, 172, 179];
  const lpDays = tg.map((t) => firstWd(wd, t));
  const comp = { id: cid, type: "euro", name: info.name, teams: teams.slice(), table: {}, alive: [], si: -1, ties: [], lpDays,
    stages: [
      { name: "Knockout play-off", days: [firstWd(wd, 200), firstWd(wd, 207)], legs: 2 },
      { name: "Round of 16", days: [firstWd(wd, 221), firstWd(wd, 228)], legs: 2 },
      { name: "Quarter-final", days: [firstWd(wd, 249), firstWd(wd, 256)], legs: 2 },
      { name: "Semi-final", days: [firstWd(wd, 270), firstWd(wd, 277)], legs: 2 },
      { name: "Final", days: [cid === "UCL" ? firstWd(6, 302) : firstWd(3, 290)], legs: 1, neutral: 1 },
    ] };
  teams.forEach((t) => (comp.table[t] = [0, 0, 0, 0, 0, 0, 0]));
  const rr = roundRobin(shuffle(teams.slice())).slice(0, 8);
  rr.forEach((round, i) => round.forEach(([h, a]) => addFx({ c: cid, d: lpDays[i], h, a, s: "League phase MD" + (i + 1) })));
  G.comps[cid] = comp;
}

function setupGroups(cid, teams) {
  const info = COMP_INFO[cid];
  const wd = cid === "CAFCL" ? 5 : 0;
  const gDays = [100, 114, 128, 170, 184, 198].map((t) => firstWd(wd, t));
  const sorted = teams.slice().sort((a, b) => club(b).rep - club(a).rep);
  const pots = [0, 1, 2, 3].map((k) => shuffle(sorted.slice(k * 4, k * 4 + 4)));
  const groups = [0, 1, 2, 3].map((g) => pots.map((p) => p[g]).filter((x) => x != null));
  const comp = { id: cid, type: "groups", name: info.name, teams: teams.slice(), groups, table: {}, si: -1, ties: [], alive: [], gDays,
    stages: [
      { name: "Quarter-final", days: [firstWd(wd, 226), firstWd(wd, 233)], legs: 2 },
      { name: "Semi-final", days: [firstWd(wd, 254), firstWd(wd, 261)], legs: 2 },
      { name: "Final", days: [firstWd(wd, 289)], legs: 1, neutral: 1 },
    ] };
  teams.forEach((t) => (comp.table[t] = [0, 0, 0, 0, 0, 0, 0]));
  groups.forEach((g, gi) => {
    const rr = roundRobin(g); const all = rr.concat(rr.map((r) => r.map(([a, b]) => [b, a])));
    all.forEach((round, i) => round.forEach(([h, a]) => addFx({ c: cid, d: gDays[i], h, a, s: "Group " + "ABCD"[gi] })));
  });
  G.comps[cid] = comp;
}

function rateClub(id) { return club(id).rep; }
function nextStage(comp) {
  comp.si++;
  const st = comp.stages[comp.si]; if (!st) return;
  let alive = comp.alive.slice(), pairs = [];
  if (comp.type === "cup") {
    const N = alive.length; let T = 1; while (T * 2 <= N) T *= 2;
    if (T !== N && comp.si === 0) {
      alive.sort((a, b) => rateClub(a) - rateClub(b));
      const m = N - T, play = shuffle(alive.slice(0, 2 * m)), bye = alive.slice(2 * m);
      for (let i = 0; i < play.length; i += 2) pairs.push([play[i], play[i + 1]]);
      comp.byes = bye;
    } else { shuffle(alive); for (let i = 0; i + 1 < alive.length; i += 2) pairs.push([alive[i], alive[i + 1]]); comp.byes = []; }
  } else if (comp.type === "euro") {
    if (comp.si === 0) {
      const order = sortTable(comp.table, comp.teams);
      comp.lpOrder = order.slice();
      comp.direct = order.slice(0, 8);
      const seeded = shuffle(order.slice(8, 16)), uns = shuffle(order.slice(16, 24));
      seeded.forEach((s, i) => pairs.push([uns[i], s]));
      comp.alive = order.slice(0, 24);
    } else if (comp.si === 1) {
      const winners = shuffle(alive.filter((x) => !comp.direct.includes(x))); const top = shuffle(comp.direct.slice());
      top.forEach((t, i) => winners[i] != null && pairs.push([winners[i], t]));
    } else { shuffle(alive); for (let i = 0; i + 1 < alive.length; i += 2) pairs.push([alive[i], alive[i + 1]]); }
  } else if (comp.type === "groups") {
    if (comp.si === 0) {
      const w = comp.groups.map((g) => sortTable(comp.table, g));
      comp.gOrder = w;
      for (let g = 0; g + 1 < w.length; g += 2) pairs.push([w[g + 1][1], w[g][0]], [w[g][1], w[g + 1][0]]);
    } else { shuffle(alive); for (let i = 0; i + 1 < alive.length; i += 2) pairs.push([alive[i], alive[i + 1]]); }
  }
  comp.ties = pairs.map(([a, b]) => {
    const t = { a, b, f: [], w: null };
    if (st.legs === 1) t.f.push(addFx({ c: comp.id, d: st.days[0], h: a, a: b, k: 1, n: st.neutral ? 1 : 0, nt: comp.nt ? 1 : 0, s: st.name }));
    else { const l1 = addFx({ c: comp.id, d: st.days[0], h: a, a: b, s: st.name + " · 1st leg" }); t.f.push(l1, addFx({ c: comp.id, d: st.days[1], h: b, a: a, k: 1, l1, s: st.name + " · 2nd leg" })); }
    return t;
  });
  if (comp.type === "cup" && comp.byes) comp.carry = comp.byes.slice(); else comp.carry = [];
}

function sortTable(table, ids) {
  return ids.slice().sort((x, y) => { const a = table[x], b = table[y]; return b[6] - a[6] || (b[4] - b[5]) - (a[4] - a[5]) || b[4] - a[4] || club(y).rep - club(x).rep; });
}

function checkComps() {
  for (const id in G.comps) {
    const comp = G.comps[id];
    if (comp.type === "league" || comp.type === "intl" || comp.done) continue;
    if (comp.si === -1) {
      if (G.day < Math.max(...(comp.lpDays || comp.gDays))) continue;
      const left = G.fx.some((f) => f.c === id && !f.p && !f.k && !f.l1 && f.s && (f.s.startsWith("League phase") || f.s.startsWith("Group")));
      if (!left) nextStage(comp);
      continue;
    }
    if (comp.ties.length && comp.ties.every((t) => t.w != null)) {
      const winners = comp.ties.map((t) => t.w).concat(comp.carry || []);
      if (comp.si === comp.stages.length - 1) { comp.done = true; comp.winner = winners[0]; onCompWon(comp); }
      else { comp.alive = winners; nextStage(comp); }
    }
  }
}

function onCompWon(comp) {
  const c = club(comp.winner);
  c.trophies.push({ s: G.season, n: comp.name });
  const key = comp.type === "cup" ? "cup" : "euro";
  (G.hist[key][comp.id] = G.hist[key][comp.id] || []).push({ s: G.season, w: comp.winner, n: c.name });
  news(`${c.name} win the ${comp.name}`, `${c.name} lift the ${comp.name} trophy for the ${G.season}/${(G.season + 1) % 100} season.`);
  if (comp.type !== "cup" && c.bal != null) { const info = COMP_INFO[comp.id]; c.bal += info.prize * 0.5; }
  awardUserTrophy(comp.winner, comp.name);
}
function awardUserTrophy(cid, name) {
  if (G.mode === "manager" && cid === G.userClub) { G.mgr.trophies.push({ s: G.season, n: name, c: club(cid).name }); inbox({ t: `Trophy: ${name}!`, b: `Your ${club(cid).name} side have won the ${name}. The board are delighted.`, type: "board" }); G.mgr.conf = clamp(G.mgr.conf + 15, 0, 100); }
  if (G.mode === "career") { const p = pl(G.userPlayer); if (p && (p.club === cid || (typeof cid === "string" && p.nat === cid && club(cid).sq.includes(p.id)))) { G.career.trophies.push({ s: G.season, n: name, c: club(cid).name }); inbox({ t: `You won the ${name}!`, b: `A medal for your collection with ${club(cid).name}.`, type: "career" }); } }
}

// ---------- tables ----------
function applyResult(f) {
  const comp = G.comps[f.c];
  let table = null;
  if (comp.type === "league") table = G.leagues[f.c].table;
  else if ((comp.type === "euro" || comp.type === "groups") && comp.si === -1 && !f.k && !f.l1) table = comp.table;
  if (table) {
    const h = table[f.h], a = table[f.a];
    if (h && a) {
      h[0]++; a[0]++; h[4] += f.hg; h[5] += f.ag; a[4] += f.ag; a[5] += f.hg;
      if (f.hg > f.ag) { h[1]++; a[3]++; h[6] += 3; } else if (f.hg < f.ag) { a[1]++; h[3]++; a[6] += 3; } else { h[2]++; a[2]++; h[6]++; a[6]++; }
    }
    if (comp.type !== "league") { const info = COMP_INFO[f.c], wc = club(f.hg > f.ag ? f.h : f.a); if (info && f.hg !== f.ag && wc.bal != null) wc.bal += info.win; }
  }
  const hc = club(f.h), ac = club(f.a);
  if (hc.seasonRes) { if (f.hg > f.ag) { hc.seasonRes.w++; ac.seasonRes.l++; } else if (f.hg < f.ag) { ac.seasonRes.w++; hc.seasonRes.l++; } else { hc.seasonRes.d++; ac.seasonRes.d++; } }
  if (!f.nt && (!f.n || comp.type === "league")) hc.bal += gateMoney(hc);
  // knockout resolution
  if (f.k) {
    const tie = comp.ties.find((t) => t.f.includes(f.i));
    if (tie) tie.w = f.w;
  }
}
function gateMoney(c) { return Math.round(25000 * Math.exp((c.rep - 60) * 0.09) * Math.pow(clubMoney(c), 0.5) * 8 * (0.7 + facLvl(c, "stad") * 0.15)); }

// ---------- lineups ----------
function available(p) { return p && p.inj <= 0 && p.sus <= 0; }
function autoLineup(c, force) {
  const form = FORMATIONS[c.form];
  const pool = squad(c.id).filter(available);
  const used = new Set(), xi = new Array(11).fill(null);
  const order = form.map((pos, i) => [pos, i]).sort((a, b) => (a[0] === "GK" ? -1 : b[0] === "GK" ? 1 : 0));
  const career = G.mode === "career" ? G.userPlayer : null;
  for (const [pos, i] of order) {
    let best = null, bs = -1e9;
    for (const p of pool) {
      if (used.has(p.id)) continue;
      const fitF = p.fit < 55 ? -14 : (p.fit - 100) * 0.12;
      let s = effAt(p, pos) + fitF + (p.id === career ? careerSelBonus() : 0) + (p.form.length ? (avg(p.form) - 6.6) * 1.2 : 0);
      if (s > bs) { bs = s; best = p; }
    }
    if (best) { xi[i] = best.id; used.add(best.id); }
  }
  const bench = pool.filter((p) => !used.has(p.id)).sort((a, b) => b.o - a.o);
  const gk = bench.find((p) => p.pos === "GK");
  const b = []; if (gk) b.push(gk.id);
  for (const p of bench) { if (b.length >= 9) break; if (!b.includes(p.id)) b.push(p.id); }
  c.xi = xi; c.bench = b;
  return { xi, bench: b };
}
const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

function validateUserLineup(c) {
  const form = FORMATIONS[c.form];
  if (!c.xi || c.xi.length !== 11) return autoLineup(c);
  const sq = new Set(c.sq);
  const xi = c.xi.map((id) => (id != null && sq.has(id) && available(pl(id)) ? id : null));
  const used = new Set(xi.filter((x) => x != null));
  const pool = squad(c.id).filter((p) => available(p) && !used.has(p.id));
  xi.forEach((id, i) => {
    if (id != null) return;
    let best = null, bs = -1e9;
    for (const p of pool) if (!used.has(p.id)) { const s = effAt(p, form[i]); if (s > bs) { bs = s; best = p; } }
    if (best) { xi[i] = best.id; used.add(best.id); }
  });
  let bench = (c.bench || []).filter((id) => sq.has(id) && available(pl(id)) && !used.has(id));
  for (const p of squad(c.id).filter((p) => available(p) && !used.has(p.id) && !bench.includes(p.id)).sort((a, b) => b.o - a.o)) { if (bench.length >= 9) break; bench.push(p.id); }
  c.xi = xi; c.bench = bench.slice(0, 9);
  return { xi, bench: c.bench };
}

// ---------- daily / weekly ----------
function isUserFx(f) { return f.h === G.userClub || f.a === G.userClub || userInNationFx(f); }
function userFxOn(day) { return (DAYIDX[day] || []).map((i) => G.fx[i]).find((f) => isUserFx(f)); }
function nextUserFx() { return G.fx.filter((f) => isUserFx(f) && !f.p).sort((a, b) => a.d - b.d)[0]; }

function simDayFixtures(skipUser) {
  for (const i of DAYIDX[G.day] || []) {
    const f = G.fx[i];
    if (f.p) continue;
    if (skipUser && isUserFx(f)) continue;
    if (f.l1 != null && !G.fx[f.l1].p) continue;
    playFixture(f);
  }
}

function endDay() {
  checkComps();
  for (const id in G.players) {
    const p = G.players[id];
    if (p.fit < 100) p.fit = Math.min(100, p.fit + (p.id === G.userPlayer && hasItem("pro2") ? 8 : 6));
    if (p.inj > 0) { p.inj--; if (p.inj === 0 && p.club === G.userClub && G.mode === "manager") inbox({ t: `${shortName(p)} is fit again`, b: `${fullName(p)} has recovered from injury and is available for selection.`, type: "medical" }); }
  }
  if (inWindow()) aiTransferDay();
  if (G.day % 7 === 6) weekly();
  if (G.day === WINDOWS[0][1] || G.day === WINDOWS[1][1]) inbox({ t: "Transfer window closed", b: "The transfer window is now closed. Free agents can still be signed.", type: "transfer" });
  if (G.day === 150 && G.mode === "manager") {
    const exp = squad(G.userClub).filter((p) => p.ce != null && p.ce <= G.season);
    if (exp.length) inbox({ t: `${exp.length} contract${exp.length > 1 ? "s" : ""} expiring`, b: `${exp.map(fullName).join(", ")} ${exp.length > 1 ? "are" : "is"} out of contract this summer and will leave unless you offer a new deal from the player's profile.`, type: "board" });
  }
  prepDay(G.day + 1);
  if (G.day === WINDOWS[1][0]) inbox({ t: "January transfer window open", b: `The window is open until ${fmtDate(WINDOWS[1][1])}.`, type: "transfer" });
  G.day++;
}

function weekly() {
  for (const id in G.players) {
    const p = G.players[id];
    develop(p);
    if (p.club >= 0 && (G.day % 28 === 6)) p.val = playerValue(p);
  }
  G.clubs.forEach((c) => {
    const wages = squad(c.id).reduce((s, p) => s + (p.wage || 0), 0);
    c.bal += c.income - wages;
    c.wages = wages;
  });
  if (G.mode === "manager") boardCheck();
  if (G.mode === "career") { careerWeekly(); lifeWeekly(); }
}

function develop(p) {
  const ag = age(p);
  const played = p.st.ap, weeks = Math.max(1, G.day / 7);
  const pr = clamp(played / (weeks * 0.9), 0, 1);
  let delta;
  if (ag <= 23) delta = (p.pot - p.o) * 0.0055 * (0.55 + 0.9 * pr);
  else if (ag <= 27) delta = (p.pot - p.o) * 0.004 * (0.6 + 0.8 * pr);
  else if (ag <= 30) delta = 0.0;
  else delta = -(ag - 30) * 0.024;
  delta += randn() * 0.05;
  const isUser = p.id === G.userPlayer;
  if (isUser && ag <= 30) delta *= 1.1;
  if (delta > 0 && p.club >= 0) delta *= 1 + (facLvl(club(p.club), "train") - 2) * 0.08;
  if (delta > 0 && isUser && hasItem("pro1")) delta *= 1.15;
  if (Math.abs(delta) < 0.001) return;
  const w = POS_W[p.pos];
  for (let i = 0; i < 7; i++) {
    let d = delta * (w[i] > 0 ? 1 : 0.3);
    if (delta < 0 && (i === 0 || i === 5)) d *= 1.5;
    if (isUser && G.career && i === G.career.tf && delta > 0) d *= 2.2;
    p.a[i] = r1(clamp(p.a[i] + d, 10, 99));
  }
  calcOvr(p);
  if (p.o > p.pot) p.pot = p.o;
}

function boardCheck() {
  const c = club(G.userClub), lg = leagueOf(c);
  const table = lg.table, order = sortTable(table, lg.clubs);
  const pos = order.indexOf(c.id) + 1, exp = expectPos(c), played = table[c.id][0];
  if (played < 6) return;
  const n = lg.clubs.length;
  const diff = (pos - exp) / n;
  G.mgr.conf = clamp(G.mgr.conf - diff * 4 + (diff < 0 ? 0.6 : 0) + (c.bal < -2e6 ? -1.5 : 0), 0, 100);
  if (G.mgr.conf < 8 && !G.sacked) sackManager("results");
}
function sackManager(why) {
  G.sacked = true;
  inbox({ t: "You have been sacked", b: `The board of ${club(G.userClub).name} have terminated your contract after a poor run of ${why}. Clubs looking for a manager have been in touch.`, type: "board", act: { kind: "jobs" } });
}
function jobOffers() {
  const cur = club(G.userClub);
  const myRep = cur.rep - (G.sacked ? 4 : -2);
  return G.clubs.filter((c) => c.id !== G.userClub && Math.abs(c.rep - myRep) <= 6).sort(() => rnd() - 0.5).slice(0, 5);
}
function takeJob(cid) {
  const old = club(G.userClub);
  G.mgr.hist.push({ s: G.season, c: old.name, until: fmtDate(G.day, { y: true }) });
  G.userClub = cid; G.sacked = false; G.mgr.conf = 60;
  const c = club(cid); c.auto = true; autoLineup(c);
  inbox({ t: `Appointed at ${c.name}`, b: `You are the new manager of ${c.name}. The board expect ${expectText(c)}.`, type: "board" });
}

// ---------- transfers ----------
function squadNeeds(c) {
  const sq = squad(c.id), counts = {};
  POSITIONS.forEach((p) => (counts[p] = 0)); sq.forEach((p) => counts[p.pos]++);
  const need = [];
  const min = { GK: 2, CB: 4, LB: 1, RB: 1, DM: 1, CM: 3, AM: 1, LW: 1, RW: 1, ST: 2 };
  for (const k in min) if (counts[k] < min[k]) need.push(k);
  return need;
}
function aiTransferDay() {
  const all = Object.values(G.players);
  const sample = () => all[Math.floor(rnd() * all.length)];
  for (const c of G.clubs) {
    if (c.id === G.userClub && G.mode === "manager") continue;
    const sq = c.sq.length;
    if (sq > 28) { const worst = squad(c.id).filter((p) => p.id !== G.userPlayer).sort((a, b) => a.o - b.o + (age(b) - age(a)) * 0.2)[0]; if (worst) releaseToFA(worst); continue; }
    if (rnd() > (sq < 21 ? 0.25 : 0.045)) continue;
    let need = squadNeeds(c);
    let pos = need.length ? pick(need) : null;
    if (!pos) {
      const xiPos = FORMATIONS[c.form]; const ix = Math.floor(rnd() * 11); pos = xiPos[ix];
      const best = squad(c.id).filter((p) => p.pos === pos).sort((a, b) => b.o - a.o)[0];
      if (best && best.o >= c.rep - 1) continue;
    }
    let target = null, bs = -1e9;
    for (let k = 0; k < 420; k++) {
      const p = sample();
      if (!p || p.pos !== pos || p.club === c.id || p.id === G.userPlayer) continue;
      if (G.mode === "manager" && p.club === G.userClub) continue;
      const ag = age(p); if (ag > 32) continue;
      if (p.o < c.rep - 4 || p.o > c.rep + 5) continue;
      const fee = p.club < 0 ? 0 : p.val * 1.15;
      if (fee > c.budget) continue;
      if (p.club >= 0 && club(p.club).rep > c.rep + 3) continue;
      const s = p.o + (p.pot - p.o) * 0.3 - fee / 1e7;
      if (s > bs) { bs = s; target = p; }
    }
    if (!target) continue;
    const fee = target.club < 0 ? 0 : Math.round(target.val * (1 + rnd() * 0.35) / 1e5) * 1e5;
    doTransfer(target, c, fee, ri(2, 5));
  }
  if (G.mode === "manager") aiBidsForUser();
  if (G.mode === "career") careerOffers();
}

function doTransfer(p, to, fee, years, wage) {
  const from = p.club >= 0 ? club(p.club) : null;
  if (from) {
    from.sq = from.sq.filter((x) => x !== p.id); from.bal += fee; from.budget += Math.round(fee * 0.7);
    if (from.xi) from.xi = from.xi.map((x) => (x === p.id ? null : x)); if (from.bench) from.bench = from.bench.filter((x) => x !== p.id);
  }
  to.sq.push(p.id); to.bal -= fee; to.budget = Math.max(0, to.budget - fee);
  p.club = to.id; p.ce = G.season + years; p.wage = wage || wageFor(p, to); p.listed = 0; p.mor = clamp(p.mor + 10, 0, 100);
  p.val = playerValue(p);
  const big = fee >= 20e6 || to.id === G.userClub || (from && from.id === G.userClub) || p.id === G.userPlayer;
  p.tx = p.tx || []; p.tx.push({ s: G.season, d: G.day, from: from ? from.id : -1, to: to.id, fee });
  G.txlog = G.txlog || []; G.txlog.unshift({ s: G.season, d: G.day, p: p.id, from: from ? from.id : -1, to: to.id, fee });
  if (G.txlog.length > 300) G.txlog.length = 300;
  if (big) news(`${fullName(p)} joins ${to.name}`, `${to.name} have signed ${fullName(p)}${from ? " from " + from.name : " on a free transfer"}${fee ? " for " + money(fee) : ""}.`);
}

function askingPrice(p) {
  if (p.club < 0) return 0;
  const c = club(p.club);
  const rank = squad(c.id).filter((q) => q.pos === p.pos).sort((a, b) => b.o - a.o).findIndex((q) => q.id === p.id);
  let mult = 1.15 + (rank === 0 ? 0.35 : rank === 1 ? 0.15 : 0) + (p.listed ? -0.25 : 0);
  if (p.ce != null && p.ce <= G.season) mult -= 0.2;
  return Math.round((p.val * mult) / 1e5) * 1e5;
}
function wageDemand(p, c) {
  let w = wageFor(p, c);
  if (p.club >= 0) w = Math.max(w, p.wage * 1.15);
  if (p.club >= 0 && club(p.club).rep > c.rep) w *= 1 + (club(p.club).rep - c.rep) * 0.04;
  return Math.round(w / 100) * 100;
}
// returns {ok, msg}
function userBid(pid, fee, wage, years) {
  const p = pl(pid), c = club(G.userClub);
  if (p.club === c.id) return { ok: false, msg: "He already plays for you." };
  if (p.club >= 0 && !inWindow()) return { ok: false, msg: "The transfer window is closed. You can only sign free agents right now." };
  if (fee > c.budget) return { ok: false, msg: `That's more than your transfer budget of ${money(c.budget)}.` };
  const wages = squad(c.id).reduce((s, q) => s + q.wage, 0);
  if (wages + wage > c.wcap) return { ok: false, msg: `That wage would push you over your wage budget (${money(c.wcap)}/wk). Current bill: ${money(wages)}/wk.` };
  if (c.sq.length >= 32) return { ok: false, msg: "Your squad is full (32 players). Sell or release someone first." };
  const ask = askingPrice(p);
  if (fee < ask) {
    if (fee < ask * 0.75) return { ok: false, msg: `${p.club >= 0 ? club(p.club).name : "They"} rejected the bid outright. They value him at around ${money(ask)}.`, counter: ask };
    return { ok: false, msg: `${club(p.club).name} want ${money(ask)} to do the deal.`, counter: ask };
  }
  const dem = wageDemand(p, c);
  if (p.club >= 0 && club(p.club).rep > c.rep + 8 && wage < dem * 1.6) return { ok: false, msg: `${fullName(p)} isn't interested in joining a smaller club, even for ${money(wage)}/wk.` };
  if (wage < dem) return { ok: false, msg: `Fee agreed, but ${shortName(p)} wants at least ${money(dem)}/wk.`, wageCounter: dem };
  doTransfer(p, c, fee, years, wage);
  inbox({ t: `${fullName(p)} signs`, b: `${fullName(p)} has joined ${c.name}${fee ? " for " + money(fee) : ""} on a ${years}-year deal worth ${money(wage)} a week.`, type: "transfer" });
  return { ok: true, msg: `${fullName(p)} has signed!` };
}

function aiBidsForUser() {
  const c = club(G.userClub);
  for (const p of squad(c.id)) {
    const chance = p.listed ? 0.06 : 0.0025 * Math.max(0, p.o - c.rep + 4);
    if (rnd() > chance) continue;
    const buyers = G.clubs.filter((b) => b.id !== c.id && b.rep >= p.o - 6 && b.rep <= p.o + 10 && b.budget > p.val * 0.8);
    if (!buyers.length) continue;
    const b = pick(buyers);
    const fee = Math.round(p.val * (0.8 + rnd() * 0.45) / 1e5) * 1e5;
    if (G.inbox.some((m) => m.act && m.act.kind === "bid" && m.act.pid === p.id && !m.done)) continue;
    inbox({ t: `${b.name} bid for ${shortName(p)}`, b: `${b.name} have offered ${money(fee)} for ${fullName(p)} (valued at ${money(p.val)}).`, type: "transfer", act: { kind: "bid", pid: p.id, cid: b.id, fee } });
  }
}
function respondBid(msg, accept, counter) {
  const a = msg.act, p = pl(a.pid), b = club(a.cid);
  msg.done = true;
  if (!p || p.club !== G.userClub) return "That player is no longer at your club.";
  if (!inWindow()) return "The transfer window has closed.";
  if (counter) {
    if (counter <= a.fee * (1.1 + rnd() * 0.25) && b.budget >= counter) { doTransfer(p, b, counter, ri(2, 5)); return `${b.name} accepted ${money(counter)}. ${fullName(p)} has left.`; }
    return `${b.name} walked away from the deal.`;
  }
  if (accept) { doTransfer(p, b, a.fee, ri(2, 5)); return `${fullName(p)} has joined ${b.name} for ${money(a.fee)}.`; }
  return "Bid rejected.";
}

function renewContract(pid, wage, years) {
  const p = pl(pid), c = club(p.club);
  const dem = Math.round(Math.max(wageFor(p, c), p.wage * 1.1) / 100) * 100;
  if (wage < dem) return { ok: false, msg: `${shortName(p)} wants ${money(dem)}/wk.`, counter: dem };
  const wages = squad(c.id).reduce((s, q) => s + q.wage, 0) - p.wage;
  if (wages + wage > c.wcap) return { ok: false, msg: "That would put you over the wage budget." };
  p.wage = wage; p.ce = G.season + years; p.mor = clamp(p.mor + 8, 0, 100); p.val = playerValue(p);
  return { ok: true, msg: `${fullName(p)} signed a new deal until ${p.ce + 1}.` };
}
function releasePlayer(pid) {
  const p = pl(pid), c = club(p.club);
  const left = Math.max(0, (p.ce || G.season) - G.season + 1);
  const pay = Math.round(p.wage * 52 * left * 0.5);
  c.bal -= pay; releaseToFA(p);
  return `${fullName(p)} released. Severance paid: ${money(pay)}.`;
}

// ---------- career mode ----------
function careerWeekly() {
  const p = pl(G.userPlayer); if (!p) return;
  const recent = p.form.slice(-5);
  if (recent.length && avg(recent) > 7.2) p.mor = clamp(p.mor + 2, 0, 100);
  const c = club(p.club);
  const sameRank = squad(c.id).filter((q) => q.pos === p.pos).sort((a, b) => b.o - a.o).findIndex((q) => q.id === p.id);
  if (sameRank > 1) p.mor = clamp(p.mor - 1, 0, 100);
}
function careerOffers() {
  const p = pl(G.userPlayer); if (!p || p.loan || (G.career && G.career.retired)) return;
  const C = G.career, ag = agentOf();
  const recent = p.form.slice(-8), f = recent.length ? avg(recent) : 6.4;
  const wants = p.listed || C.agentSearch;
  if (C.lastOffer == null) C.lastOffer = absDay() - 200;
  // without a transfer request, offers come roughly every two seasons (sooner with a better agent)
  if (!wants && absDay() - C.lastOffer < 800 / (1 + ag.offers)) return;
  const chance = wants ? 0.06 : 0.015 + Math.max(0, f - 6.9) * 0.02;
  if (rnd() > chance) return;
  if (G.inbox.some((m) => m.act && m.act.kind === "coffer" && !m.done)) return;
  const cur = club(p.club);
  const lvl = p.o + Math.max(0, f - 6.8) * 4;
  const cands = G.clubs.filter((c) => c.id !== cur.id && c.rep >= lvl - 3 && c.rep <= lvl + 6 && c.rep > cur.rep - 2 && (c.budget >= p.val * 0.6 || c.rep >= 82));
  if (!cands.length) return;
  const b = pick(cands);
  const fee = Math.round(p.val * (0.9 + rnd() * 0.4) / 1e5) * 1e5;
  const wage = Math.round(wageFor(p, b) * (1.1 + rnd() * 0.3) * (1 + ag.wage) / 100) * 100;
  C.lastOffer = absDay();
  inbox({ t: `Transfer offer: ${b.name}`, b: `${b.name} (${leagueOf(b).name}) have agreed a ${money(fee)} fee with ${cur.name} and offer you ${money(wage)}/wk on a ${ri(3, 5)}-year contract.`, type: "career", act: { kind: "coffer", cid: b.id, fee, wage } });
}
function careerRespond(msg, accept) {
  msg.done = true;
  const p = pl(G.userPlayer), a = msg.act, b = club(a.cid);
  if (!accept) return "You turned the offer down.";
  if (!inWindow()) return "The window has closed. The move can't go through.";
  doTransfer(p, b, a.fee, 4, a.wage);
  G.userClub = b.id;
  inbox({ t: `Welcome to ${b.name}`, b: `You've completed your move to ${b.name}. New contract: ${money(a.wage)}/wk until ${p.ce + 1}.`, type: "career" });
  return `You've joined ${b.name}!`;
}
function careerRequest(kind) {
  const p = pl(G.userPlayer), c = club(p.club);
  if (kind === "list") { p.listed = p.listed ? 0 : 1; if (p.listed) G.career.trust = clamp((G.career.trust || 50) - 10, 0, 100); return p.listed ? "You've handed in a transfer request. The manager isn't pleased, but clubs will be told you're available." : "You've told the club you're happy to stay."; }
  if (kind === "loan") {
    if (p.loan) return "You're already out on loan.";
    if (!inWindow()) return "Loans can only be arranged while a transfer window is open.";
    const cands = G.clubs.filter((x) => x.id !== c.id && x.rep >= p.o - 3 && x.rep <= p.o + 4 && squad(x.id).filter((q) => q.pos === p.pos).every((q) => q.o <= p.o + 2));
    if (!cands.length) return "No club wants to take you on loan right now. Try again later in the window.";
    const to = pick(cands);
    const parent = c.id;
    doTransfer(p, to, 0, Math.max(1, p.ce - G.season), p.wage);
    p.loan = { from: parent, s: G.season };
    G.userClub = to.id;
    inbox({ t: `On loan at ${to.name}`, b: `You've joined ${to.name} on loan until the end of the season. ${club(parent).name} will be watching.`, type: "career" });
    return `Loan agreed: you're joining ${to.name} for the rest of the season.`;
  }
  if (kind === "contract") {
    const ag = agentOf(), dem = Math.round(wageFor(p, c) * (1 + ag.wage) / 100) * 100;
    if (p.wage >= dem * 0.95) return ag.id > 1 ? `${ag.n}: "Your deal is already as good as we'll get right now."` : "The club feel your current deal is fair.";
    if (avg(p.form.slice(-6)) < 6.6 - ag.id * 0.1) return "The club want to see better form before talking about a new deal.";
    p.wage = dem; p.ce = Math.max(p.ce, G.season + 3);
    return `New contract signed: ${money(dem)}/wk until ${p.ce + 1}.`;
  }
}

// ---------- season end ----------
function endSeason() {
  const summary = [];
  // league outcomes
  for (const id in G.leagues) {
    const lg = G.leagues[id];
    const order = sortTable(lg.table, lg.clubs); lg.order = order;
    const champ = club(order[0]);
    champ.trophies.push({ s: G.season, n: lg.name });
    (G.hist.lg[id] = G.hist.lg[id] || []).push({ s: G.season, w: order[0], n: champ.name, ru: club(order[1]).name });
    awardUserTrophy(order[0], lg.name);
    // prize & TV money
    order.forEach((cid, i) => { const c = club(cid); c.bal += Math.round(lg.money * 60e6 * (1 + (order.length - i) / order.length)); });
    if (G.userClub != null && lg.clubs.includes(G.userClub)) {
      const pos = order.indexOf(G.userClub) + 1;
      summary.push(`${club(G.userClub).name} finished ${ordinal(pos)} in the ${lg.name}.`);
      if (G.mode === "manager") {
        const exp = expectPos(club(G.userClub)); const d = exp - pos;
        G.mgr.conf = clamp(G.mgr.conf + d * 4, 0, 100);
        G.mgr.hist.push({ s: G.season, c: club(G.userClub).name, lg: lg.name, pos });
      }
    }
  }
  // awards: player of the season per top league + golden ball
  const all = Object.values(G.players).filter((p) => p.club >= 0 && p.st.ap >= 15);
  const score = (p) => p.st.rs / p.st.ap + p.st.g * 0.025 + p.st.as * 0.015 + p.o * 0.01;
  const gb = all.slice().sort((a, b) => score(b) - score(a))[0];
  const boot = all.slice().sort((a, b) => b.st.g - a.st.g)[0];
  const ys = all.filter((p) => age(p) <= 21).sort((a, b) => score(b) - score(a))[0];
  const aw = { s: G.season, gb: gb && { p: gb.id, n: fullName(gb), c: club(gb.club).name }, boot: boot && { p: boot.id, n: fullName(boot), c: club(boot.club).name, g: boot.st.g }, ys: ys && { p: ys.id, n: fullName(ys), c: club(ys.club).name } };
  G.hist.awards.push(aw);
  if (gb) news(`${fullName(gb)} wins the Golden Ball`, `${fullName(gb)} of ${club(gb.club).name} is named the best player in the world for ${G.season}/${(G.season + 1) % 100}.`);
  if (G.mode === "career") {
    const me = pl(G.userPlayer);
    if (gb && gb.id === me.id) G.career.awards.push({ s: G.season, n: "Golden Ball" });
    if (boot && boot.id === me.id) G.career.awards.push({ s: G.season, n: "Golden Boot" });
    if (ys && ys.id === me.id) G.career.awards.push({ s: G.season, n: "Golden Boy" });
  }
  // promotion / relegation
  const countries = {};
  for (const id in G.leagues) { const lg = G.leagues[id]; (countries[lg.country] = countries[lg.country] || []).push(lg); }
  for (const k in countries) {
    const tiers = countries[k].sort((a, b) => a.tier - b.tier);
    for (let t = 0; t < tiers.length - 1; t++) {
      const upper = tiers[t], lower = tiers[t + 1], n = Math.min(upper.down, lower.up);
      const down = upper.order.slice(-n), up = lower.order.slice(0, n);
      upper.clubs = upper.clubs.filter((x) => !down.includes(x)).concat(up);
      lower.clubs = lower.clubs.filter((x) => !up.includes(x)).concat(down);
      up.forEach((cid) => { const c = club(cid); c.lg = upper.id; c.rep = Math.max(c.rep, Math.round(avgRep(upper) - 6)); news(`${c.name} promoted`, `${c.name} are promoted to the ${upper.name}.`); });
      down.forEach((cid) => { club(cid).lg = lower.id; });
      if (G.userClub != null) {
        if (up.includes(G.userClub)) { summary.push(`Promoted to the ${upper.name}!`); if (G.mode === "manager") { G.mgr.conf = clamp(G.mgr.conf + 25, 0, 100); G.mgr.trophies.push({ s: G.season, n: "Promotion", c: club(G.userClub).name }); } }
        if (down.includes(G.userClub)) { summary.push(`Relegated to the ${lower.name}.`); if (G.mode === "manager") G.mgr.conf = clamp(G.mgr.conf - 35, 0, 100); }
      }
    }
  }
  // reputation drift toward performance
  for (const id in G.leagues) {
    const lg = G.leagues[id];
    if (!lg.order) continue;
    const reps = lg.clubs.map((c) => club(c).rep).sort((a, b) => b - a);
    lg.order.forEach((cid, i) => { const c = club(cid); if (c.lg !== lg.id) return; const target = reps[Math.min(i, reps.length - 1)]; c.rep = Math.round(clamp(c.rep + (target - c.rep) * 0.25, 40, 92)); });
  }
  const loanClub = G.mode === "career" && pl(G.userPlayer) && pl(G.userPlayer).loan ? pl(G.userPlayer).club : null;
  // loan returns
  if (G.mode === "career") {
    const me = pl(G.userPlayer);
    if (me && me.loan) { const back = club(me.loan.from); const cur = club(me.club); cur.sq = cur.sq.filter((x) => x !== me.id); back.sq.push(me.id); me.club = back.id; G.userClub = back.id; delete me.loan; summary.push(`Your loan has ended and you're back at ${back.name}.`); }
  }
  // player histories, contracts, retirements, ageing
  const leaving = [];
  for (const id in G.players) {
    const p = G.players[id];
    const hc = p.id === G.userPlayer && loanClub != null ? loanClub : p.club;
    if (p.st.ap > 0) { p.hist.push({ s: G.season, c: hc >= 0 ? club(hc).short : "—", cn: hc >= 0 ? club(hc).name + (hc === loanClub ? " (loan)" : "") : "Free agent", ap: p.st.ap, g: p.st.g, as: p.st.as, r: r1(p.st.rs / p.st.ap), o: p.o }); if (p.hist.length > 25) p.hist.shift(); }
    p.st = newStats(); p.yc = 0; p.sus = 0;
    const ag = age(p) + 1;
    if (p.id === G.userPlayer) {
      if (p.ce != null && p.ce <= G.season && p.club >= 0) { p.ce = G.season + 2; p.wage = Math.max(p.wage, wageFor(p, club(p.club))); inbox({ t: "Contract extended", b: `${club(p.club).name} have extended your contract by two years at ${money(p.wage)}/wk.`, type: "career" }); }
      continue;
    }
    let retire = ag >= 39 || (ag >= 34 && rnd() < (ag - 33) * 0.22) || (p.club < 0 && (ag >= 33 || p.o < 42));
    if (retire) { leaving.push(p); continue; }
    if (p.club >= 0 && p.ce != null && p.ce <= G.season) {
      const c = club(p.club);
      const keep = G.mode === "manager" && c.id === G.userClub ? false : (ag < 32 && p.o >= c.rep - 9 && rnd() < 0.8) || (p.o >= c.rep && rnd() < 0.9);
      if (keep) { p.ce = G.season + ri(1, 4); p.wage = wageFor(p, c); }
      else { if (c.id === G.userClub) news(`${fullName(p)} leaves ${c.name}`, "His contract has expired."); releaseToFA(p); }
    }
  }
  leaving.forEach((p) => { if (p.club >= 0) { const c = club(p.club); c.sq = c.sq.filter((x) => x !== p.id); if (c.xi) c.xi = c.xi.map((x) => (x === p.id ? null : x)); if (c.bench) c.bench = c.bench.filter((x) => x !== p.id); } delete G.players[p.id]; });
  G.season++;
  // youth intake + finances
  G.clubs.forEach((c) => {
    const lg = leagueOf(c);
    const n = ri(2, 3);
    for (let i = 0; i < n; i++) {
      const pos = pick(POSITIONS.concat(["CM", "ST", "CB", "LW", "RW"]));
      const gem = rnd() < 0.04;
      const p = genPlayer({ pos, ovr: ri(38, 50) + (c.rep > 75 ? 4 : 0), ag: ri(16, 17), nat: rnd() < Math.max(lg.dom, 0.7) ? lg.nat : pickNat(lg), cid: c.id, pot: clamp(Math.round(c.rep - 2 + randn() * 6 + (gem ? 14 : 0) + (facLvl(c, "youth") - 2) * 2), 50, 94) });
      setContract(p, c, 3); c.sq.push(p.id);
      if (c.id === G.userClub && G.mode === "manager") inbox({ t: `Youth intake: ${fullName(p)}`, b: `${fullName(p)} (${p.pos}, age ${age(p)}) has joined from the academy. The coaches rate his potential ${starsText(p.pot)}.`, type: "youth" });
    }
    while (c.sq.length < 22) { const pos = squadNeeds(c)[0] || pick(POSITIONS); const p = genPlayer({ pos, ovr: Math.round(c.rep - 6 - rnd() * 6), ag: ri(20, 30), nat: pickNat(lg), cid: c.id }); setContract(p, c, ri(1, 3)); c.sq.push(p.id); }
    const wages = squad(c.id).reduce((s, p) => s + p.wage, 0);
    const m = clubMoney(c);
    c.income = Math.round(Math.max(wages * 1.05, 22 * 1000 * Math.exp((c.rep - 50) * 0.13) * Math.pow(m, 0.4)));
    c.budget = Math.max(0, Math.round(Math.max(0, c.bal) * 0.4 / 1e5) * 1e5);
    c.wcap = Math.round(Math.max(wages * 1.08, c.income * 1.02) / 100) * 100;
    c.form = c.id === G.userClub ? c.form : (rnd() < 0.15 ? wpick(AI_FORMS) : c.form);
  });
  // trim bloated AI squads and the free-agent pool
  G.clubs.forEach((c) => {
    if (c.id === G.userClub && G.mode === "manager") return;
    const sq = squad(c.id).filter((p) => p.id !== G.userPlayer).sort((a, b) => (a.o + Math.max(0, a.pot - a.o) * 0.5 - Math.max(0, age(a) - 30)) - (b.o + Math.max(0, b.pot - b.o) * 0.5 - Math.max(0, age(b) - 30)));
    while (c.sq.length > 26 && sq.length) releaseToFA(sq.shift());
  });
  const faList = Object.values(G.players).filter((p) => p.club < 0 && p.id !== G.userPlayer);
  faList.forEach((p) => { if (p.o < 47 || (age(p) >= 31 && p.o < 64)) delete G.players[p.id]; });
  const faLeft = Object.values(G.players).filter((p) => p.club < 0 && p.id !== G.userPlayer).sort((a, b) => b.o - a.o);
  faLeft.slice(260).forEach((p) => delete G.players[p.id]);
  // replenish free agents
  const fas = Object.values(G.players).filter((p) => p.club < 0).length;
  for (let i = fas; i < 140; i++) { const p = genPlayer({ pos: pick(POSITIONS), ovr: ri(45, 70), ag: ri(20, 32), nat: wpick(FOR_EU) }); p.club = -1; p.wage = wageFor(p, null); p.ce = null; }
  for (const id in G.players) G.players[id].val = playerValue(G.players[id]);
  // manager review
  if (G.mode === "manager" && !G.sacked && G.mgr.conf < 25) sackManager("results this season");
  if (G.mode === "career") {
    const p = pl(G.userPlayer);
    if (age(p) >= 40) inbox({ t: "Time to hang up the boots?", b: "Your body is telling you it's time. You can retire from the Career page whenever you're ready.", type: "career" });
  }
  initSeason(false);
  G.clubs.forEach((c) => { if (c.id !== G.userClub || G.mode === "career") autoLineup(c); });
  if (G.mode === "manager") validateUserLineup(club(G.userClub));
  inbox({ t: `Season ${G.season}/${(G.season + 1) % 100} begins`, b: summary.join(" ") + (G.mode === "manager" ? ` New transfer budget: ${money(club(G.userClub).budget)}.` : ""), type: "board" });
  return summary;
}
const avgRep = (lg) => avg(lg.clubs.map((c) => club(c).rep));
function ordinal(n) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function starsText(pot) { return pot >= 85 ? "world class" : pot >= 78 ? "excellent" : pot >= 70 ? "good" : pot >= 62 ? "decent" : "limited"; }

// ---------- messages ----------
function inbox(m) { m.id = G.msgSeq++; m.d = G.day; m.s = G.season; m.read = false; G.inbox.unshift(m); if (G.inbox.length > 120) G.inbox.length = 120; }
function news(t, b) { G.news.unshift({ t, b, d: G.day, s: G.season }); if (G.news.length > 80) G.news.length = 80; }
function money(v) {
  const a = Math.abs(v), s = v < 0 ? "-" : "";
  if (a >= 1e6) return s + "€" + (a / 1e6).toFixed(a >= 1e8 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (a >= 1e3) return s + "€" + Math.round(a / 1e3) + "K";
  return s + "€" + Math.round(a);
}

// ---------- advance ----------
// Advance until something needs the user. Returns {stop, f?}
function advance(maxDays = 40) {
  if (G.sacked && G.mode === "manager") return { stop: "sacked" };
  for (let n = 0; n < maxDays; n++) {
    if (G.day > (G.seasonEnd || SEASON_END)) { endSeason(); return { stop: "season" }; }
    const uf = userFxOn(G.day);
    if (uf && !uf.p && !(uf.l1 != null && !G.fx[uf.l1].p)) return { stop: "match", f: uf };
    const before = G.msgSeq;
    simDayFixtures(false);
    endDay();
    const fresh = G.inbox.filter((m) => m.id >= before);
    if (fresh.some((m) => m.act && !m.done)) return { stop: "inbox" };
    if (G.sacked && G.mode === "manager") return { stop: "sacked" };
  }
  return { stop: "limit" };
}
