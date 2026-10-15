/* Touchline — drama: rivals, multi-week storylines, big matches, awards night, records,
   short careers, fast-forward and friend challenges. */
"use strict";

// ---------- helpers ----------
function leagueRankOf(cid) {
  if (typeof cid !== "number") return 99;
  const c = club(cid), lg = c && G.leagues[c.lg];
  if (!lg || !lg.table[cid]) return 99;
  const t = lg.table, gd = (x) => t[x][4] - t[x][5];
  return lg.clubs.slice().sort((a, b) => t[b][6] - t[a][6] || gd(b) - gd(a)).indexOf(cid) + 1;
}
const formAvg = (p, n = 4) => (p.form.length ? avg(p.form.slice(-n)) : 6.5);

// ---------- big matches ----------
function bigMatchInfo(f) {
  if (!f || !G) return null;
  if (f.s === "Final") return "Final";
  if (f.s === "Semi-final") return "Semi-final";
  const comp = G.comps[f.c];
  if (f.nt) return f.c === "INTL" ? null : "Tournament match";
  if (f.s === "Quarter-final") return "Quarter-final";
  if (f.k && comp && (comp.type === "euro" || comp.type === "groups")) return "Continental knockout";
  if (G.mode === "career" && G.career) {
    const r = rivalOf(), me = pl(G.userPlayer);
    if (r && me && r.club >= 0 && r.club !== me.club && (f.h === r.club || f.a === r.club)) return "Rival showdown";
  }
  if (comp && comp.type === "league" && G.day > 60 && leagueRankOf(f.h) <= 3 && leagueRankOf(f.a) <= 3) return "Top-of-the-table clash";
  return null;
}

// ---------- rivals ----------
function rivalOf() { const C = G.career; const r = C && C.rival != null ? pl(C.rival) : null; return r && !r.ret ? r : null; }
function pickRival() {
  const C = G.career, p = pl(G.userPlayer); if (!C || !p || C.retired) return;
  const g = POS_GROUP[p.pos], a = age(p), myLg = p.club >= 0 ? club(p.club).lg : null;
  const cands = Object.values(G.players).filter((q) => q.id !== p.id && !q.ret && typeof q.club === "number" && q.club >= 0 && q.club !== p.club && POS_GROUP[q.pos] === g && Math.abs(age(q) - a) <= 1 && Math.abs(q.o - p.o) <= 5);
  if (!cands.length) return;
  const r = wpick(cands.map((q) => [q, (club(q.club).lg === myLg ? 3 : 1) * (1 + Math.max(0, 6 - Math.abs(q.o - p.o)))]));
  C.rival = r.id; C.rivalH = { w: 0, d: 0, l: 0 }; C.rivalSince = G.season;
  r.pot = Math.max(r.pot, Math.min(94, p.pot + 2));
  inbox({ t: `Meet your rival: ${fullName(r)}`, b: `The media have picked your rival: ${fullName(r)} (${age(r)}, ${r.pos}) at ${club(r.club).name}. Same age, same position, same ambition. Every goal, every rating and every award will be compared.`, type: "career" });
}
function rivalSeasonStart() {
  const C = G.career, p = pl(G.userPlayer); if (!C || !p || C.retired) return;
  const r = rivalOf();
  if (!r) { if (age(p) <= 34) pickRival(); return; }
  if (p.club >= 0 && r.club !== p.club && r.club >= 0 && rnd() < 0.07 && Math.abs(r.o - p.o) <= 6) {
    const c = club(p.club);
    doTransfer(r, c, Math.round(r.val / 1e5) * 1e5, 4, wageFor(r, c));
    headline(`Shock move: ${fullName(r)} joins ${fullName(p)} at ${c.name}`);
    inbox({ t: "Your rival has joined your club", b: `${c.name} have signed ${fullName(r)}. Your biggest rival is now your teammate, and you're fighting for the same place in the team.`, type: "career" });
  }
}
function rivalAfterMatch(f, m) {
  const C = G.career, p = pl(G.userPlayer), r = rivalOf(); if (!r || !p) return;
  const ms = m.sideOf[p.id], rs = m.sideOf[r.id];
  if (ms == null || rs == null || ms === rs || m.rt[r.id] == null || m.rt[p.id] == null) return;
  const res = Math.sign(m.g[ms] - m.g[rs]);
  C.rivalH = C.rivalH || { w: 0, d: 0, l: 0 };
  C.rivalH[res > 0 ? "w" : res < 0 ? "l" : "d"]++;
  const mine = m.rt[p.id], his = m.rt[r.id];
  if (mine > his) { crep(1); p.mor = clamp(p.mor + 3, 5, 100); headline(`${fullName(p)} wins the duel with ${fullName(r)} (${mine.toFixed(1)} vs ${his.toFixed(1)})`); }
  else { p.mor = clamp(p.mor - 2, 5, 100); headline(`${fullName(r)} gets the better of ${fullName(p)} (${his.toFixed(1)} vs ${mine.toFixed(1)})`); }
}
// "Let your football do the talking": outscore your rival over the next four weeks.
function rivalDuelWeekly() {
  const C = G.career, d = C && C.duel; if (!d) return;
  const p = pl(G.userPlayer), r = rivalOf();
  if (!r || d.s !== G.season) { C.duel = null; return; }
  if (absDay() < d.until) return;
  const mine = p.st.g + p.st.as - d.me, his = r.st.g + r.st.as - d.him;
  C.duel = null;
  if (mine > his) { crep(4); cmor(6); headline(`${fullName(p)} answers ${fullName(r)} on the pitch`); inbox({ t: "You won the war of words", b: `You had ${mine} goals and assists in four weeks; ${fullName(r)} had ${his}. The papers say you shut him up.`, type: "career" }); }
  else { crep(-2); cmor(-4); inbox({ t: "Your rival had the last laugh", b: `${fullName(r)} had ${his} goals and assists in four weeks; you had ${mine}. The papers are enjoying it.`, type: "career" }); }
}

// ---------- multi-week storylines ----------
const weeks = (n) => absDay() + n * 7;
function arcGo(step, w) { const A = G.career.arc; if (A) { A.step = step; A.at = weeks(w); } }
function arcEnd() { const C = G.career; if (C.arc) { C.arcDone = (C.arcDone || []).concat(C.arc.id).slice(-4); C.arc = null; C.arcCd = weeks(4); } }
const arcD = () => (G.career.arc ? G.career.arc.d : {});
const ARCS = {
  scout: {
    n: "A big club is watching",
    ok: () => { const p = pl(G.userPlayer); return p.club >= 0 && age(p) <= 31 && G.clubs.some((c) => c.rep >= club(p.club).rep + 6); },
    init: () => { const p = pl(G.userPlayer), here = club(p.club); const cands = G.clubs.filter((c) => c.rep >= here.rep + 6 && c.rep <= p.o + 12); const c = cands.length ? pick(cands) : G.clubs.filter((c) => c.rep >= here.rep + 6).sort((a, b) => a.rep - b.rep)[0]; return { cid: c.id, rs: p.st.rs, ap: p.st.ap, s: G.season }; },
    steps: [
      { t: (d) => `Scouts from ${club(d.cid).name} are watching you`, b: (d) => `${club(d.cid).name} will watch your next four weeks. Keep your form up and they could make a move.`,
        o: [["Stay focused on football", (d) => { d.need = 6.9; arcGo(1, 4); return "Head down. Let the football talk."; }],
          ["Tell your agent to leak it", (d) => { d.need = 7.1; cfame(3); ctrust(-3); arcGo(1, 4); return "It's all over the papers. Your manager isn't thrilled."; }],
          ["Ask the manager for more minutes", (d) => { d.need = 7.0; ctrust(-1); G.career.promise = absDay() + 28; arcGo(1, 4); return "He agrees to give you a run in the team."; }]] },
      { check: (d) => {
        const p = pl(G.userPlayer), c = club(d.cid);
        const ap = d.s === G.season ? p.st.ap - d.ap : p.st.ap, rs = d.s === G.season ? p.st.rs - d.rs : p.st.rs;
        const f = ap ? rs / ap : 0;
        if (ap >= 2 && f >= d.need && p.club >= 0) {
          const wage = Math.round(wageFor(p, c) * 1.1 / 100) * 100, fee = Math.round(p.val * 1.1 / 1e5) * 1e5;
          if (inWindow()) inbox({ t: `${c.name} want to sign you`, b: `You impressed the scouts (average rating ${f.toFixed(2)}). ${c.name} have agreed a ${money(fee)} fee and offer ${money(wage)}/wk.`, type: "career", act: { kind: "coffer", cid: c.id, fee, wage } });
          else { G.career.scoutBid = { cid: c.id, fee, wage }; inbox({ t: `${c.name} were impressed`, b: `You averaged ${f.toFixed(2)} while they watched. They'll make an offer when the transfer window opens.`, type: "career" }); }
        } else { cmor(-3); inbox({ t: "The scouts have gone home", b: `${c.name} didn't see enough${ap ? ` (average rating ${f.toFixed(2)}, they wanted ${d.need.toFixed(1)}+)` : ""}. Maybe next time.`, type: "career" }); }
        arcEnd();
      } },
    ],
  },
  feud: {
    n: "Dressing-room feud",
    ok: () => pickTeammate() != null,
    init: () => ({ tm: pickTeammate() }),
    steps: [
      { t: (d) => `${tmName(d)} is talking about you behind your back`, b: () => "Teammates say he's been telling everyone you're overrated and selfish.",
        o: [["Confront him", (d) => { d.way = "confront"; cdisc(2, "in a training-ground row"); arcGo(1, 2); return "It got heated. Everyone saw it."; }],
          ["Speak to the manager", (d) => { d.way = "boss"; ctrust(1); arcGo(1, 2); return "The manager says he'll have a word."; }],
          ["Let it go", (d) => { d.way = "ignore"; arcGo(1, 2); return "You rise above it. For now."; }]] },
      { t: () => "The dressing room picks sides", b: (d) => (d.way === "confront" ? `Your row with ${tmName(d)} has split the squad.` : d.way === "boss" ? `The manager spoke to ${tmName(d)}, and now he says you went running to the boss.` : `${tmName(d)} is getting louder, and some players are starting to believe him.`),
        o: [["Make peace over dinner", (d) => { G.career.life.cash -= 2000; const ok = rnd() < (d.way === "ignore" ? 0.5 : 0.65); d.res = ok ? "peace" : "snub"; arcGo(2, 1); return ok ? "He shows up. It's awkward, then it isn't." : "He doesn't show up. Ouch."; }],
          ["Rally the squad behind you", (d) => { const t = G.career.trust == null ? 50 : G.career.trust; const ok = t >= 55 || legendHere() || rnd() < 0.3; d.res = ok ? "won" : "lost"; arcGo(2, 1); return ok ? "The senior players back you." : "Not everyone is with you."; }],
          ["Ask the club to sell him", (d) => { const t = G.career.trust == null ? 50 : G.career.trust; d.res = t >= 60 || legendHere() ? "sold" : "refused"; arcGo(2, 1); return d.res === "sold" ? "The club say they'll listen to offers." : "The club refuse. Now everyone knows you asked."; }]] },
      { check: (d) => {
        const tm = pl(d.tm), n = tmName(d);
        if (d.res === "peace") { cmor(5); chappy(3); inbox({ t: "Feud over", b: `You and ${n} have buried the hatchet. The dressing room is calm again.`, type: "career" }); }
        else if (d.res === "won") { cmor(4); ctrust(4); crep(1); inbox({ t: "The squad is behind you", b: `${n} has gone quiet. The dressing room made its choice.`, type: "career" }); }
        else if (d.res === "sold" && tm && tm.club >= 0) { const to = pick(G.clubs.filter((c) => c.id !== tm.club && c.rep >= tm.o - 8 && c.rep <= tm.o + 2)) || pick(G.clubs); doTransfer(tm, to, Math.round(tm.val * 0.8 / 1e5) * 1e5, 3, wageFor(tm, to)); ctrust(-2); cmor(3); inbox({ t: `${n} has been sold`, b: `${n} has joined ${to.name}. You won, but some teammates think you're too powerful.`, type: "career" }); }
        else { cmor(-5); ctrust(-4); inbox({ t: "The feud rumbles on", b: `Things with ${n} are still bad, and it's hurting your game.`, type: "career" }); }
        arcEnd();
      } },
    ],
  },
  boss: {
    n: "Manager on the brink",
    ok: () => { const p = pl(G.userPlayer); if (p.club < 0 || G.day < 40 || G.day > 250) return false; const c = club(p.club), lg = G.leagues[c.lg]; return lg && leagueRankOf(c.id) > lg.clubs.length / 2; },
    init: () => { const p = pl(G.userPlayer), c = club(p.club), t = G.leagues[c.lg].table[c.id]; return { cid: c.id, pts: t[6], pl: t[0], s: G.season }; },
    steps: [
      { t: () => "The manager is fighting for his job", b: () => "The board have given him four weeks. He's asked the senior players to step up.",
        o: [["Back him in public", (d) => { d.side = "back"; crep(1); arcGo(1, 4); return "\"He's the right man. We'll turn this around.\""; }],
          ["Stay out of it", (d) => { d.side = "neutral"; arcGo(1, 4); return "You keep your head down."; }],
          ["Hint it's time for a change", (d) => { d.side = "against"; cdisc(3, "after undermining the manager"); crep(-2); arcGo(1, 4); return "The quote is everywhere. The manager has seen it."; }]] },
      { check: (d) => {
        const c = club(d.cid), lg = G.leagues[c.lg], t = lg && lg.table[c.id];
        const games = t && d.s === G.season ? t[0] - d.pl : 0, pts = t && d.s === G.season ? t[6] - d.pts : 0;
        const ppg = games ? pts / games : 1;
        const survive = ppg >= 1.5 || (d.side === "back" && ppg >= 1.1 && rnd() < 0.5);
        if (survive) {
          if (d.side === "back") ctrust(15); else if (d.side === "against") ctrust(-15);
          inbox({ t: "The manager survives", b: `${pts} points from ${games} games saved his job.${d.side === "back" ? " He won't forget that you backed him." : d.side === "against" ? " He hasn't forgotten what you said." : ""}`, type: "career" });
        } else {
          G.career.trust = d.side === "back" ? 40 : d.side === "against" ? 60 : 50; G.career.promise = null;
          news(`${c.name} sack their manager`, `Only ${pts} points from ${games} games was not enough.`);
          inbox({ t: "The manager has been sacked", b: `A new manager arrives at ${c.name}. ${d.side === "against" ? "He's heard you wanted change, and he likes that." : d.side === "back" ? "He knows you were loyal to the last man. You'll have to win him over." : "Everyone starts from zero."}`, type: "career" });
        }
        arcEnd();
      } },
    ],
  },
  rumour: {
    n: "Tabloid storm",
    ok: () => true,
    init: () => ({ story: pick(["arguing with fans outside a nightclub", "demanding a move behind the club's back", "skipping a recovery session to film an advert", "a secret meeting with a rival club"]) }),
    steps: [
      { t: () => "A tabloid is digging", b: (d) => `A paper claims you were seen ${d.story}. It isn't true, but it's spreading.`,
        o: [["Deny it on social media", (d) => { d.w = "deny"; arcGo(1, 2); return "Your post gets a million likes, and a million replies."; }],
          ["Get the lawyers involved (€50K)", (d) => { d.w = "law"; G.career.life.cash -= 50000; arcGo(1, 2); return "Your lawyers send a letter."; }],
          ["Say nothing", (d) => { d.w = "quiet"; arcGo(1, 2); return "You let it play out."; }]] },
      { t: (d) => (d.w === "law" ? "The paper is wobbling" : "The story is growing"), b: (d) => (d.w === "law" ? "Faced with your lawyers, the paper is considering a correction. One more push could finish it." : "Other outlets have picked it up. Fans are asking questions."),
        o: [["Give a sit-down interview", (d) => { const ok = rnd() < (d.w === "quiet" ? 0.75 : 0.6); d.res = ok ? "cleared" : "worse"; arcGo(2, 1); return ok ? "You come across as honest and calm." : "One answer gets twisted into a new headline."; }],
          ["Post a funny reply", (d) => { const ok = rnd() < 0.55; d.res = ok ? "laugh" : "worse"; cfame(3); arcGo(2, 1); return ok ? "The internet loves it." : "Not everyone finds it funny."; }],
          ["Move on", (d) => { d.res = d.w === "law" ? "cleared" : rnd() < 0.5 ? "fades" : "worse"; arcGo(2, 1); return "You stop reading the papers."; }]] },
      { check: (d) => {
        if (d.res === "cleared") { crep(4); inbox({ t: "Story retracted", b: "The paper has printed a correction. Your name is clear, and people respect how you handled it.", type: "career" }); }
        else if (d.res === "laugh") { crep(3); cfame(2); inbox({ t: "You won the internet", b: "Your reply went viral and the story became a joke about the paper.", type: "career" }); }
        else if (d.res === "fades") { inbox({ t: "The story fades", b: "The news cycle moved on. Some people still believe it.", type: "career" }); crep(-1); }
        else { crep(-4); cdisc(3, "at the centre of a media storm"); partnerMood(-4, "She's tired of reading about you."); inbox({ t: "The story stuck", b: "It became a full-blown scandal. Your image has taken a hit.", type: "career" }); }
        arcEnd();
      } },
    ],
  },
  fan: {
    n: "A promise to a young fan",
    ok: () => pl(G.userPlayer).club >= 0,
    init: () => ({ kid: pick(["Omar", "Youssef", "Adam", "Malak", "Leo", "Sami", "Nour", "Karim", "Lucas", "Hana"]), age: ri(7, 11) }),
    steps: [
      { t: () => "A letter from a young fan", b: (d) => `${d.kid}, ${d.age}, is in hospital and says you're their hero. The family asks if you'd visit.`,
        o: [["Visit and promise a goal", (d) => { const p = pl(G.userPlayer); d.g0 = p.st.g; d.a0 = p.st.as; d.s = G.season; crep(2); chappy(2); arcGo(1, 3); return `You promise ${d.kid} you'll score for them in the next three weeks.`; }],
          ["Visit with a signed shirt", () => { crep(3); chappy(3); arcEnd(); return "You spent the afternoon there. The photos make everyone smile."; }],
          ["Send a video message", () => { crep(1); arcEnd(); return "A kind gesture. The family are grateful."; }]] },
      { check: (d) => {
        const p = pl(G.userPlayer), g = d.s === G.season ? p.st.g - d.g0 : p.st.g, a = d.s === G.season ? p.st.as - d.a0 : p.st.as;
        const isDef = ["GK", "DEF"].includes(POS_GROUP[p.pos]);
        if (g > 0 || (isDef && a > 0)) { crep(6); chappy(6); cfame(3); headline(`${fullName(p)} keeps his promise to young fan ${d.kid}`); inbox({ t: "Promise kept", b: `You ${g ? "scored" : "set one up"} and pointed to the camera for ${d.kid}. The video has gone around the world.`, type: "career" }); }
        else { crep(-1); chappy(-3); inbox({ t: "A promise you couldn't keep", b: `You didn't manage it. ${d.kid} says it doesn't matter, and still wears your shirt every day.`, type: "career" }); }
        arcEnd();
      } },
    ],
  },
};
// Register each storyline step as an event so the inbox shows its options.
for (const id in ARCS) ARCS[id].steps.forEach((st, i) => {
  if (st.check) return;
  const ev = { id: `arc_${id}_${i}`, m: "career", w: 0, ok: () => false, ctx: () => ({}), t: () => st.t(arcD()), b: () => st.b(arcD()),
    o: st.o.map(([l, fn]) => [l, () => { if (!G.career.arc || G.career.arc.id !== id) return "That moment has passed."; return fn(G.career.arc.d) || ""; }]) };
  EVENTS.push(ev); EVENT_BY[ev.id] = ev;
});
function arcWeekly() {
  const C = G.career, p = pl(G.userPlayer); if (!C || C.retired || !p) return;
  if (C.scoutBid && inWindow() && p.club >= 0) { const b = C.scoutBid; C.scoutBid = null; const c = club(b.cid); if (c.id !== p.club) inbox({ t: `${c.name} want to sign you`, b: `As promised, ${c.name} have made their move: a ${money(b.fee)} fee and ${money(b.wage)}/wk.`, type: "career", act: { kind: "coffer", cid: c.id, fee: b.fee, wage: b.wage } }); }
  if (C.arc) {
    if (C.arc.at > absDay() || G.inbox.some((m) => m.act && m.act.kind === "event" && !m.done)) return;
    const def = ARCS[C.arc.id], st = def && def.steps[C.arc.step];
    if (!st) { C.arc = null; return; }
    C.arc.at = Infinity;
    if (st.check) { try { st.check(C.arc.d); } catch (e) { console.error(e); C.arc = null; } }
    else inbox({ t: st.t(C.arc.d), b: st.b(C.arc.d), type: "event", act: { kind: "event", ev: `arc_${C.arc.id}_${C.arc.step}`, ctx: {} } });
    return;
  }
  if (p.club < 0 || (C.arcCd || 0) > absDay() || rnd() > 0.07) return;
  const ids = Object.keys(ARCS).filter((k) => !(C.arcDone || []).slice(-2).includes(k)).filter((k) => { try { return ARCS[k].ok(); } catch (e) { return false; } });
  if (!ids.length) return;
  const id = pick(ids);
  let d; try { d = ARCS[id].init(); } catch (e) { return; }
  C.arc = { id, step: 0, at: absDay(), d };
}

// rival taunts use the normal event system
EVENTS.push({ id: "rivalTaunt", m: "career", w: 1.2, ok: () => !!rivalOf() && pl(G.userPlayer).club >= 0 && !G.career.duel, ctx: () => ({ q: pick(["He's had a nice career, I suppose.", "I don't lose sleep over him.", "Ask me again when he wins something.", "He's good on social media."]) }),
  t: () => `${fullName(rivalOf())} takes a shot at you`, b: (c) => `Asked about you, your rival ${fullName(rivalOf())} said: "${c.q}" Reporters want your response.`,
  o: [["Fire back", () => { cfame(3); cdisc(2, "in a war of words"); cmor(3); return "\"He's welcome to compare trophy cabinets.\" The back pages love it."; }],
    ["Rise above it", () => { crep(2); return "\"I wish him well.\" Classy."; }],
    ["Let your football do the talking", () => { const p = pl(G.userPlayer), r = rivalOf(); G.career.duel = { s: G.season, until: absDay() + 28, me: p.st.g + p.st.as, him: r.st.g + r.st.as }; return "Challenge on: more goals and assists than him over the next four weeks."; }]] });
EVENT_BY.rivalTaunt = EVENTS[EVENTS.length - 1];

// ---------- awards night ----------
function awardsNight(all, score) {
  const C = G.career, me = pl(G.userPlayer); if (!C || !me || C.retired) return;
  const r = rivalOf(), myC = me.club >= 0 ? club(me.club) : null, lg = myC && G.leagues[myC.lg];
  const rank = (list, p) => { const i = list.findIndex((x) => x.id === p.id); return i < 0 ? null : i + 1; };
  const tag = (p) => ({ n: fullName(p), c: p.club >= 0 ? club(p.club).short || club(p.club).name : "", me: p.id === me.id, rv: r && p.id === r.id });
  const ball = all.slice().sort((a, b) => score(b) - score(a));
  const boot = all.slice().sort((a, b) => b.st.g - a.st.g);
  const N = { s: G.season, ball: ball.slice(0, 10).map(tag), myBall: rank(ball, me), rvBall: r ? rank(ball, r) : null, boot: boot.slice(0, 5).map((p) => ({ ...tag(p), g: p.st.g })), myBoot: rank(boot, me), myG: me.st.g, lg: lg ? lg.name : "", won: [] };
  if (lg) {
    const inLg = all.filter((p) => club(p.club).lg === myC.lg), av = (p) => p.st.rs / p.st.ap;
    const poty = inLg.slice().sort((a, b) => score(b) - score(a))[0], ypoty = inLg.filter((p) => age(p) <= 21).sort((a, b) => score(b) - score(a))[0];
    const pickN = (grp, n) => inLg.filter((p) => POS_GROUP[p.pos] === grp).sort((a, b) => av(b) - av(a)).slice(0, n);
    const tots = [].concat(pickN("GK", 1), pickN("DEF", 4), pickN("MID", 3), pickN("ATT", 3));
    N.poty = poty && tag(poty); N.ypoty = ypoty && tag(ypoty); N.tots = tots.map(tag);
    if (poty && poty.id === me.id) N.won.push(`${lg.name} Player of the Season`);
    if (ypoty && ypoty.id === me.id) N.won.push(`${lg.name} Young Player of the Season`);
    if (tots.some((p) => p.id === me.id)) N.won.push(`${lg.name} Team of the Season`);
  }
  N.won.forEach((n) => C.awards.push({ s: G.season, n }));
  if (N.won.length) { crep(3 * N.won.length); cfame(2 * N.won.length); }
  if (r) {
    const mine = me.st.ap ? me.st.rs / me.st.ap : 0, his = r.st.ap ? r.st.rs / r.st.ap : 0;
    N.rv = { n: fullName(r), g: r.st.g, a: r.st.as, r: r1(his), mg: me.st.g, ma: me.st.as, mr: r1(mine) };
    const beat = (me.st.g + me.st.as) * 0.1 + mine > (r.st.g + r.st.as) * 0.1 + his;
    N.rv.beat = beat;
    if (beat) { crep(3); chappy(3); } else { chappy(-3); }
  }
  C.night = N;
}

// ---------- records ----------
function clubRec(c) {
  G.clubRec = G.clubRec || {};
  return (G.clubRec[c.name] = G.clubRec[c.name] || { sg: { v: Math.round(14 + c.rep * 0.22), n: "Club history" }, at: { v: Math.round(40 + c.rep * 1.3), n: "Club history" } });
}
function lgRec(lg) {
  G.lgRec = G.lgRec || {};
  if (!G.lgRec[lg.id]) { const a = avg(lg.clubs.map((x) => club(x).rep)); G.lgRec[lg.id] = { v: Math.round(24 + a * 0.12), n: "League history" }; }
  return G.lgRec[lg.id];
}
function recordsAfterMatch(f, m) {
  const C = G.career, p = pl(G.userPlayer); if (!C || !p || p.club < 0 || p.loan) return;
  const c = club(p.club), lg = G.leagues[c.lg], R = clubRec(c), name = fullName(p);
  C.broke = C.broke || {};
  const beat = (key, rec, v, title, line) => {
    if (v <= rec.v) return;
    const first = rec.n !== name;
    rec.v = v; rec.n = name; rec.s = G.season;
    if (first && !C.broke[key + G.season]) { C.broke[key + G.season] = 1; crep(3); cfame(2); headline(line); inbox({ t: `Record broken: ${title}`, b: `${line}. Your name is in the record books.`, type: "career" }); }
  };
  beat(`sg:${c.name}`, R.sg, p.st.g, `${c.name} goals in a season`, `${name} sets a new ${c.name} record with ${p.st.g} goals in a season`);
  beat(`at:${c.name}`, R.at, goalsAtClub(p, c.name), `${c.name} all-time top scorer`, `${name} becomes ${c.name}'s all-time top scorer`);
  if (lg) beat(`lg:${lg.id}`, lgRec(lg), p.st.lg, `${lg.name} goals in a season`, `${name} breaks the ${lg.name} scoring record with ${p.st.lg} league goals`);
}
// AI players can set club records too, so they move.
function recordsSeasonEnd() {
  if (!G.clubRec) return;
  for (const id in G.players) {
    const p = G.players[id]; if (p.id === G.userPlayer || p.club < 0 || typeof p.club !== "number") continue;
    const c = club(p.club), R = G.clubRec[c.name]; if (!R) continue;
    if (p.st.g > R.sg.v) { R.sg = { v: p.st.g, n: fullName(p), s: G.season }; }
  }
}

// ---------- short career ----------
function shortCareerCheck(p) {
  const C = G.career; if (!C || !C.short || C.short.done || C.retired) return false;
  if (G.season < C.short.until) return false;
  const won = C.trophies.filter((t) => t.s >= C.short.s0);
  C.short.done = true; C.short.ok = won.length > 0;
  inbox({ t: C.short.ok ? "Mission complete" : "Mission failed", b: C.short.ok ? `Five seasons, ${won.length} troph${won.length > 1 ? "ies" : "y"}: ${won.map((t) => t.n).join(", ")}. You hang up your boots a winner.` : "Five seasons and no trophy. You retire with regrets, but what a ride.", type: "career" });
  retireUser();
  return true;
}

// ---------- fast-forward ----------
// Simulates ordinary matches and stops at the next thing that matters.
function fastForward() {
  const out = { n: 0, w: 0, d: 0, l: 0, g: 0, a: 0, rs: 0, ap: 0, stop: null, f: null };
  for (let i = 0; i < 400; i++) {
    const r = advance(400);
    if (r.stop !== "match") { out.stop = r.stop; break; }
    const f = r.f, big = bigMatchInfo(f);
    if (big) { out.stop = "big"; out.f = f; out.big = big; break; }
    const m = playFixture(f);
    simDayFixtures(false); endDay();
    const cid = G.mode === "career" ? (m.sideOf[G.userPlayer] != null ? m.sides[m.sideOf[G.userPlayer]].cid : pl(G.userPlayer).club) : G.userClub;
    const s = m.sides[0].cid === cid ? 0 : 1, res = Math.sign(m.g[s] - m.g[1 - s]);
    out.n++; out[res > 0 ? "w" : res < 0 ? "l" : "d"]++;
    if (G.mode === "career" && m.rt[G.userPlayer] != null) { out.g += m.goals[G.userPlayer] || 0; out.a += m.ast[G.userPlayer] || 0; out.rs += m.rt[G.userPlayer]; out.ap++; }
    if (G.inbox.some((x) => x.act && !x.done)) { out.stop = "inbox"; break; }
  }
  return out;
}

// ---------- friend challenges ----------
const CHALLENGES = {
  goals2: { n: "Score 2 goals in a week", career: true, need: 2 },
  assist: { n: "Get an assist this week", career: true, need: 1 },
  rate75: { n: "Get a 7.5+ rating in a match this week", career: true, need: 1 },
  cs: { n: "Keep a clean sheet this week", need: 1 },
  win2: { n: "Win your next 2 matches", need: 2 },
  goals3: { n: "Your team scores 3+ in a match this week", need: 1 },
};
function challengeList() { const p = G.mode === "career" ? pl(G.userPlayer) : null; return Object.entries(CHALLENGES).filter(([k, c]) => (G.mode === "career" ? k !== "goals3" : !c.career) && !(k === "cs" && p && !["GK", "DEF"].includes(POS_GROUP[p.pos]))); }
function acceptChallenge(code, msg) {
  G.online.ch = G.online.ch || [];
  if (G.online.ch.some((c) => c.id === msg.ch.id)) return "Already accepted.";
  const c = CHALLENGES[msg.ch.type]; if (!c) return "Unknown challenge.";
  if (c.career && G.mode !== "career") return "That challenge is for player careers.";
  G.online.ch.push({ id: msg.ch.id, from: code, type: msg.ch.type, prog: 0, until: absDay() + 7, s: G.season });
  autosave();
  Online.send(code, `💪 Challenge accepted: ${c.n}`).catch(() => {});
  return "Challenge accepted. You have one week.";
}
function challengeAfterMatch(f, m) {
  if (!G.online) return;
  const list = G.online && G.online.ch; if (!list || !list.length) return;
  const me = G.mode === "career" ? G.userPlayer : null;
  const cid = me != null ? (m.sideOf[me] != null ? m.sides[m.sideOf[me]].cid : pl(me).club) : G.userClub;
  const s = m.sides[0].cid === cid ? 0 : m.sides[1].cid === cid ? 1 : null; if (s == null) return;
  const won = m.g[s] > m.g[1 - s], played = me == null || m.rt[me] != null;
  for (const c of list) {
    if (c.done || c.until < absDay()) continue;
    if (c.type === "goals2" && played) c.prog += m.goals[me] || 0;
    else if (c.type === "assist" && played) c.prog += m.ast[me] || 0;
    else if (c.type === "rate75" && played && m.rt[me] >= 7.5) c.prog = 1;
    else if (c.type === "cs" && played && m.g[1 - s] === 0) c.prog = 1;
    else if (c.type === "goals3" && m.g[s] >= 3) c.prog = 1;
    else if (c.type === "win2") { if (won) c.prog++; else { c.done = "fail"; } }
    if (!c.done && c.prog >= CHALLENGES[c.type].need) c.done = "ok";
    if (c.done) challengeReport(c);
  }
}
function challengeWeekly() {
  const list = G.online && G.online.ch; if (!list) return;
  for (const c of list) if (!c.done && c.until < absDay()) { c.done = "fail"; challengeReport(c); }
  G.online.ch = list.filter((c) => !c.reported || c.until > absDay() - 60);
  if (G.online.outbox && G.online.outbox.length && Online.state === "ready") { const box = G.online.outbox; G.online.outbox = []; box.forEach(([code, t]) => Online.send(code, t).catch(() => {})); }
}
function challengeReport(c) {
  if (c.reported) return; c.reported = true;
  const n = CHALLENGES[c.type].n, ok = c.done === "ok";
  if (ok) { G.online.chWon = (G.online.chWon || 0) + 1; if (G.mode === "career" && G.career && G.career.life) { cfame(1); G.career.life.cash += 10000; } }
  inbox({ t: ok ? "Challenge complete" : "Challenge failed", b: `${ok ? "You did it" : "You didn't manage it"}: ${n}.${ok && G.mode === "career" ? " Bragging rights and a €10K bonus." : ""}`, type: "career" });
  const text = ok ? `🏆 Challenge complete: ${n}` : `😩 I failed your challenge: ${n}`;
  if (Online.state === "ready") Online.send(c.from, text).catch(() => { (G.online.outbox = G.online.outbox || []).push([c.from, text]); });
  else { G.online.outbox = (G.online.outbox || []).concat([[c.from, text]]).slice(-20); }
}

// ---------- hooks used by the engine ----------
function dramaWeekly() {
  if (G.mode === "career" && G.career && !G.career.retired) { arcWeekly(); rivalDuelWeekly(); }
  challengeWeekly();
}
function dramaAfterMatch(f, m) {
  if (G.mode === "career" && G.career) {
    if (!f.nt) { rivalAfterMatch(f, m); recordsAfterMatch(f, m); }
    const p = pl(G.userPlayer), L = G.career.last;
    if (L && L.f === f.i && L.g >= 3 && !f.nt) G.career.hat = (G.career.hat || 0) + 1;
    if (m.big && p && m.bigRes) {
      const [good, bad] = m.bigRes;
      crep(good * 1.5 - bad);
      if (good >= 1 && (m.big === "Final" || m.big === "Semi-final")) headline(`Big-game player: ${fullName(p)} delivers in the ${m.big.toLowerCase()}`);
      else if (bad >= 2) headline(`${fullName(p)} goes missing when it matters`);
    }
  }
  challengeAfterMatch(f, m);
}
