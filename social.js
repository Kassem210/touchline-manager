/* Touchline — "Kora", the in-game social app: your posts, teammates' posts, friends' posts and fan comments. */
"use strict";

const fmtK = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : n >= 1e4 ? `${Math.round(n / 1e3)}K` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(Math.round(n)));

// what you can post
const POST_TYPES = {
  match: { n: "Matchday photo", em: "📸", bg: ["#0f5132", "#1c8a4c"], m: 1, caps: ["Big three points today 💪", "Always proud to wear this shirt", "On to the next one"] },
  goal: { n: "Goal celebration", em: "⚽", bg: ["#7a1f1f", "#e85d04"], m: 1.5, caps: ["What a feeling!! ⚽🔥", "That one was for you, fans", "Never stop believing"] },
  training: { n: "Training grind", em: "🏋️", bg: ["#1d3557", "#457b9d"], m: 0.8, caps: ["No days off", "Hard work beats talent when talent doesn't work hard", "Extra session done ✅"] },
  thanks: { n: "Thank the fans", em: "🙏", bg: ["#264653", "#2a9d8f"], m: 0.9, caps: ["Your support means everything", "We go again together ❤️", "Thank you for always being there"] },
  family: { n: "Family time", em: "👨‍👩‍👧", bg: ["#6d597a", "#b56576"], m: 1.1, caps: ["My whole world ❤️", "Best part of the week", "Home is where they are"] },
  car: { n: "New ride", em: "🚗", bg: ["#111111", "#5c5c5c"], m: 1.2, caps: ["New toy 😎", "Dreams do come true", "Worked hard for this one"] },
  home: { n: "Home tour", em: "🏡", bg: ["#a47148", "#e6b980"], m: 1, caps: ["Finally home 🏡", "Welcome to the new place", "Grateful for everything"] },
  holiday: { n: "Holiday", em: "🏖️", bg: ["#0077b6", "#48cae4"], m: 1.2, caps: ["Recharging 🌊", "Sahel vibes", "Back stronger soon"] },
  party: { n: "Night out", em: "🎉", bg: ["#3c096c", "#9d4edd"], m: 1.1, caps: ["Good times with the boys 🎉", "Celebrating right", "Weekend mode"] },
  charity: { n: "Charity visit", em: "❤️", bg: ["#9b2226", "#ee9b00"], m: 1, caps: ["Today was special", "Giving back to the community", "These kids are the real heroes"] },
  sponsor: { n: "Sponsored post", em: "👟", bg: ["#222222", "#d4a017"], m: 0.7, caps: ["New boots just dropped #ad", "Proud partner #ad", "Gear up #ad"] },
  cryptic: { n: "Cryptic message", em: "🤔", bg: ["#2b2d42", "#8d99ae"], m: 1.3, caps: ["Time will tell…", "New chapters. 🤐", "Big decisions."] },
  rival: { n: "Shade your rival", em: "😏", bg: ["#5f0f40", "#9a031e"], m: 1.4, caps: ["Some talk, some deliver 🏆", "Numbers don't lie 📊", "Still waiting for a challenge 😴"] },
};
function captionsFor(type) {
  const C = G.career, fresh = C.last && C.last.at && absDay() - C.last.at <= 7;
  if (type === "match" && fresh) return C.last.res > 0 ? ["Big three points today 💪", "What a team performance", "On to the next one"] : C.last.res < 0 ? ["Not good enough today. We'll bounce back", "Heads up, we go again", "Sorry fans. We owe you one"] : ["A point is a point. We go again", "Should have won that one", "Keep building 💪"];
  return POST_TYPES[type].caps;
}
// who can post what right now, and why not
function postAllowed(type) {
  const C = G.career, L = C.life, p = pl(G.userPlayer);
  const recent = C.last && C.last.at && absDay() - C.last.at <= 7;
  switch (type) {
    case "match": return recent ? "" : "Play a match first.";
    case "goal": return recent && C.last.g > 0 ? "" : "Score in your last match first.";
    case "family": return L.partner || L.kids.length ? "" : "You need a partner or kids.";
    case "car": return L.items.some((id) => SHOP_BY[id] && SHOP_BY[id].cat === "Cars") ? "" : "Buy a car first.";
    case "home": return L.items.some((id) => SHOP_BY[id] && SHOP_BY[id].cat === "Homes") ? "" : "Buy a home first.";
    case "sponsor": return L.spons ? "" : "You need a boot deal.";
    case "rival": return typeof rivalOf === "function" && rivalOf() ? "" : "You don't have a rival yet.";
    case "cryptic": return p.club >= 0 ? "" : "You don't have a club.";
    default: return "";
  }
}
// how fans feel: -1 (angry) to 1 (love it)
function postMood(type) {
  const C = G.career, p = pl(G.userPlayer), L = C.life;
  const f = p.form.length ? avg(p.form.slice(-3)) : 6.6;
  const fresh = C.last && C.last.at && absDay() - C.last.at <= 7;
  const won = fresh && C.last.res > 0, lost = fresh && C.last.res < 0;
  const formM = clamp((f - 6.6) / 1.2, -1, 1);
  const rep = ((C.rep == null ? 50 : C.rep) - 50) / 60;
  let m = 0.15 + rep;
  switch (type) {
    case "match": m += won ? 0.5 : lost ? -0.3 : 0.1; break;
    case "goal": m += 0.7 + formM * 0.2; break;
    case "training": m += 0.35; break;
    case "thanks": m += lost ? 0.4 : 0.3; break;
    case "family": m += 0.4; break;
    case "charity": m += 0.6; break;
    case "car": case "home": m += formM >= 0 ? 0.1 : -0.7 + formM * 0.3; if (lost) m -= 0.3; break;
    case "holiday": m += G.day > 30 && G.day < 300 ? -0.5 : 0.3; break;
    case "party": m += lost ? -0.9 : won ? 0.1 : -0.3; break;
    case "sponsor": m -= 0.15; break;
    case "cryptic": m -= legendHere() ? 0.6 : 0.3; break;
    case "rival": { const r = rivalOf(); m += r && p.st.g + p.st.as >= r.st.g + r.st.as ? 0.35 : -0.5; break; }
  }
  return clamp(m + randn() * 0.15, -1, 1);
}

// ---------- comments ----------
const FAN_A = ["ahly", "zamalek", "kora", "goal", "ultras", "cairo", "alex", "football", "matchday", "the12th", "sahel", "nile", "egy", "pharaoh", "fc", "tiki", "king", "ballon"];
const FAN_B = ["fan", "boy", "girl", "daily", "forever", "4life", "hq", "10", "7", "official", "lover", "nation", "zone", "talks", "eg", "99", "2009", "x"];
const fanName = () => `${pick(FAN_A)}${pick(["_", ".", ""])}${pick(FAN_B)}`;
const CM = {
  pos: ["🔥🔥🔥", "Mafeesh zayak ya king 👑", "GOAT behaviour", "We love you {ln}!", "Golden Ball loading…", "Best in the league, no debate", "Ya 3am el 7ag 💪", "Legend 🙌", "My favourite player ever", "Sign him for life", "❤️❤️❤️", "El king {ln} 👑", "Proud of you"],
  neg: ["Focus on football bro", "Play like this on the pitch first", "Less posting, more scoring", "We pay your wages for this?? 😤", "{r} rating and you're posting this?", "Embarrassing", "Ya 3am 7aram 3aleik", "Bench him", "Read the room 🙄", "Leave if you don't care about the club"],
  neu: ["👀", "Nice pic", "Where is this?", "Who took the photo? 📸", "😂😂", "Come to Cairo!", "Follow back pls 🙏", "First!", "Fantasy captain this week?", "Wallpaper material"],
  goal: ["WHAT A GOAL", "Replayed it 50 times", "Top bins 🎯", "Puskás award incoming"],
  car: ["How fast does it go? 🏎️", "Buy me one 😂", "Imagine scoring as fast as that car"],
  home: ["Invite us for dinner 😂", "Mashallah, beautiful"],
  family: ["Beautiful family ❤️", "Mashallah 🤲", "Cutest thing today"],
  charity: ["Respect ❤️", "A real role model", "This is what a captain looks like"],
  training: ["Grind never stops 💪", "That's the work ethic we want", "Who's your trainer?"],
  rival: ["Shots fired 😂", "{rv} is going to see this 💀", "Respect your opponents man", "Cooked him 🔥"],
  cryptic: ["Don't leave us 😭", "Is this a goodbye??", "Agent is calling 📞", "WHAT DOES THIS MEAN"],
  sponsor: ["#ad 🙄", "Nice boots tho", "Discount code?"],
  party: ["Party animal 🎉", "Rest before the match!!", "Coach is watching 👀"],
  holiday: ["Enjoy king 🌊", "Pre-season is coming 😅", "Take me with you"],
};
function genComments(type, mood, n, who) {
  const p = pl(G.userPlayer), r = typeof rivalOf === "function" ? rivalOf() : null;
  const fill = (t) => t.replace("{ln}", who.ln || "").replace("{r}", p && p.form.length ? p.form[p.form.length - 1].toFixed(1) : "6.0").replace("{rv}", r ? r.ln : "your rival");
  const out = [];
  for (let i = 0; i < n; i++) {
    const roll = rnd() * 2 - 1;
    const pool = CM[type] && rnd() < 0.35 ? CM[type] : roll < mood - 0.35 ? CM.pos : roll > mood + 0.35 ? CM.neg : CM.neu;
    out.push({ u: fanName(), t: fill(pick(pool)) });
  }
  return out;
}

// ---------- your account ----------
function soc() {
  const C = G.career;
  if (!C.social) C.social = { followers: Math.round(600 + Math.pow(C.life.fame, 2) * 80), posts: [], npc: [], seq: 1 };
  return C.social;
}
function makePost(by, type, cap, extra = {}) {
  const S = soc();
  return { id: S.seq++, by, type, cap, d: absDay(), likes: 0, cm: [], ncm: 0, liked: false, v: (rnd() * 3) | 0, ...extra };
}
function socialPost(type, cap, moment) {
  const C = G.career, L = C.life, p = pl(G.userPlayer), S = soc(), T = POST_TYPES[type];
  const why = moment ? "" : postAllowed(type); if (why) return { err: why };
  if (S.posts.length && S.posts[0].d === absDay()) return { err: "You've already posted today. Fans get tired of spam." };
  const recent = S.posts.filter((x) => absDay() - x.d < 7).length;
  const mood = moment ? clamp((type === "injury" ? 0.45 : 0.6) + ((C.rep == null ? 50 : C.rep) - 50) / 80 + randn() * 0.1, -1, 1) : postMood(type);
  const spam = Math.pow(0.75, recent);
  const likes = Math.round(S.followers * clamp(0.06 + mood * 0.04 + randn() * 0.01, 0.01, 0.14) * T.m * spam);
  const follow = Math.round(likes * (mood > 0 ? 0.05 : -0.04) + S.followers * 0.002 * mood);
  S.followers = Math.max(100, S.followers + follow);
  const post = makePost("me", type, String(cap || captionsFor(type)[0]).slice(0, 140), { likes, ncm: Math.round(likes * (0.012 + Math.abs(mood) * 0.01)), mood, at: Date.now(),
    sc: (type === "match" || type === "goal") && C.last ? C.last.sc || null : null, moment: moment || null });
  if (type === "transfer" && p.club >= 0) post.to = p.club;
  post.cm = genComments(type, mood, 4, p);
  // real people react too
  const tm = typeof pickTeammate === "function" ? pickTeammate() : null;
  if (tm && rnd() < 0.6 && mood > -0.3) post.cm.unshift({ u: handleOf(pl(tm)), t: pick(["🔥 my brother", "Big man 💪", "Let's gooo", "Captain material", "❤️"]), v: 1 });
  if (type === "family" && L.partner) post.cm.unshift({ u: handleName(L.partner), t: "❤️❤️", v: 1 });
  if (type === "rival" && rivalOf()) post.cm.unshift({ u: handleOf(rivalOf()), t: pick(["Check the trophy cabinet 🏆", "Cute.", "See you on the pitch 😴"]), v: 1 });
  S.posts.unshift(post); if (S.posts.length > 40) S.posts.length = 40;
  // consequences
  const res = [];
  if (type === "family" && L.partner) partnerMood(4, "She loved your post about the family.", "family");
  if (type === "party") { cdisc(3, "posting party pictures"); if (mood < -0.3) res.push("The club saw the party photos."); }
  if (type === "holiday" && G.day > 30 && G.day < 300) { ctrust(-2); res.push("The manager wonders why you're on holiday mid-season."); }
  if (type === "charity") crep(2);
  if (type === "training") { crep(0.5); ctrust(1); }
  if (type === "thanks") crep(1);
  if (type === "cryptic") { ctrust(legendHere() ? -2 : -5); cfame(2); C.agentSearch = true; res.push("Transfer rumours are flying. Your manager isn't happy."); }
  if (type === "rival") { cfame(3); cdisc(2, "trolling a rival online"); res.push(`${fullName(rivalOf())} has definitely seen it.`); }
  if (type === "sponsor" && L.spons) { const pay = Math.round(L.spons.wk * 0.6); L.cash += pay; res.push(`Your sponsor paid ${money(pay)} for the post.`); }
  if (mood > 0.5) { crep(1); cfame(1); } else if (mood < -0.4) { crep(-1.5); cmor(-2); }
  const verdict = mood > 0.5 ? "The fans love it." : mood > 0.1 ? "Fans liked it." : mood > -0.3 ? "Mixed reactions." : "The fans are not happy.";
  return { post, likes, follow, verdict, res };
}
const handleName = (n) => String(n).toLowerCase().normalize("NFD").replace(/[^a-z0-9 ]/g, "").trim().replace(/\s+/g, ".");
function handleOf(p) { return p ? handleName(fullName(p)) + (p.id % 7 === 0 ? "_official" : p.id % 3 === 0 ? String(p.o) : "") : "player"; }

// ---------- what other people post ----------
const NPC_POSTS = {
  training: ["Work in silence 💪", "Sunday sessions", "Getting sharper every day"],
  car: ["New whip 🔥", "Treat yourself", "Vroom vroom"],
  holiday: ["Recharge mode", "Blessed 🌴", "Family trip"],
  win: ["WHAT A WIN 🔥", "Three points! Thank you fans", "Team performance 💪"],
  family: ["Daddy duty ❤️", "Best weekend", "My people"],
  gym: ["Leg day 😮‍💨", "Never skip", "5am club"],
};
function addNpc(post) { const S = soc(); S.npc.unshift(post); if (S.npc.length > 60) S.npc.length = 60; }
function npcPost(p, kind, extra = {}) {
  const fame = clamp(p.o - 50, 5, 45);
  const likes = Math.round(Math.pow(fame, 2) * (40 + rnd() * 60));
  const type = kind === "win" ? "match" : kind === "gym" ? "training" : kind;
  const post = makePost(p.id, type, pick(NPC_POSTS[kind] || NPC_POSTS.training), { likes, ncm: Math.round(likes * 0.015), ...extra });
  post.cm = genComments(type, 0.5, 3, p);
  addNpc(post);
}
function socialWeekly() {
  const C = G.career; if (!C || !C.life) return;
  const S = soc(), p = pl(G.userPlayer);
  try { mediaWeekly(); } catch (e) { console.error(e); }
  S.followers = Math.round(S.followers * (1.002 + (C.rep == null ? 0 : (C.rep - 50) / 20000)) + C.life.fame * 12);
  if (p && p.club >= 0) {
    const n = rnd() < 0.5 ? 1 : 2;
    for (let i = 0; i < n; i++) { const t = pickTeammate(); if (t) npcPost(pl(t), pick(["training", "gym", "car", "family", summerNow() ? "holiday" : "training"])); }
  }
  const r = typeof rivalOf === "function" ? rivalOf() : null;
  if (r && rnd() < 0.3) { const post = makePost(r.id, "training", pick([`${r.st.g} goals and counting ⚽`, "Focused on my own game 🎯", "Nobody outworks me", "Big week ahead"]), { likes: Math.round(Math.pow(clamp(r.o - 50, 5, 45), 2) * 70) }); post.cm = genComments("training", 0.5, 3, r); addNpc(post); }
  const L = C.life;
  if (L.partner && rnd() < 0.2) { const post = makePost("partner", pick(["family", "holiday", "home"]), pick(["Date night with my favourite ❤️", "Proud of you always", "Weekend views", "Us 💕"]), { likes: Math.round(S.followers * 0.02), pname: L.partner }); post.cm = genComments("family", 0.6, 3, p); addNpc(post); }
}
function socialAfterMatch(f, m) {
  const C = G.career, p = pl(G.userPlayer); if (!C || !p) return;
  const cid = m.sideOf[p.id] != null ? m.sides[m.sideOf[p.id]].cid : p.club; if (cid == null || cid < 0 || f.nt) return;
  const s = m.sides[0].cid === cid ? 0 : 1, won = m.g[s] > m.g[1 - s];
  if (C.last && C.last.f === f.i) Object.assign(C.last, { at: absDay(), res: Math.sign(m.g[s] - m.g[1 - s]), sc: `${club(f.h).short} ${m.g[0]}–${m.g[1]} ${club(f.a).short}` });
  const c = club(cid), scorers = Object.keys(m.goals).map(Number).filter((id) => m.sideOf[id] === s).map((id) => pl(id) && pl(id).ln + (m.goals[id] > 1 ? ` ×${m.goals[id]}` : "")).filter(Boolean);
  const post = makePost(`club:${cid}`, "match", `FT | ${club(f.h).name} ${m.g[0]}–${m.g[1]} ${club(f.a).name}${scorers.length ? ` ⚽ ${scorers.join(", ")}` : ""}`, { likes: Math.round(Math.pow(c.rep, 2) * (8 + rnd() * 6) * (won ? 1.4 : 0.8)), sc: `${club(f.h).short} ${m.g[0]}–${m.g[1]} ${club(f.a).short}` });
  post.cm = genComments(m.goals[p.id] ? "goal" : "match", won ? 0.6 : -0.2, 3, p);
  if (m.goals[p.id]) post.cm.unshift({ u: fanName(), t: `${p.ln.toUpperCase()} 🔥🔥🔥` });
  addNpc(post);
  if (won && rnd() < 0.5) { const t = pickTeammate(); if (t && m.rt[t] != null) npcPost(pl(t), "win", { sc: post.sc }); }
  try { memeAfterMatch(f, m); } catch (e) { console.error(e); }
}
function toggleLike(id) {
  const S = soc(), post = S.posts.concat(S.npc).find((x) => x.id === id); if (!post) return;
  post.liked = !post.liked; post.likes += post.liked ? 1 : -1;
}
// a few recent posts are shared with friends on the Phone
function socialExport() {
  if (G.mode !== "career" || !G.career || !G.career.social) return [];
  return G.career.social.posts.slice(0, 5).map((x) => ({ t: x.type, c: x.cap, l: x.likes, at: x.at || Date.now(), sc: x.sc || null }));
}

// ---------- media accounts, transfers, news, memes ----------
// The transfer journalist is a made-up character. Change the name here if you like.
const JOURNALIST = { name: "Fabio Ramone", handle: "fabio.ramone" };
const ACCOUNTS = {
  jour: { h: JOURNALIST.handle, n: JOURNALIST.name, av: "🚨", sub: "Transfer news · Here we go!", v: true },
  news: { h: "kora.news", n: "Kora News", av: "📰", sub: "Football news", v: true },
  stats: { h: "kora.stats", n: "Kora Stats", av: "📊", sub: "Numbers & records", v: true },
  memes: { h: "kora.memes", n: "Kora Memes", av: "😂", sub: "Football memes", v: false },
};
Object.assign(POST_TYPES, {
  transfer: { n: "Transfer", em: "🚨", bg: ["#0b132b", "#1c2541"], m: 1.3, npc: true, caps: ["Dream come true. New chapter ✍️", "Proud to be here", "Let's make history"] },
  news: { n: "News", em: "📰", bg: ["#f4f1ea", "#e9e4d8"], m: 1, npc: true, caps: [] },
  stats: { n: "Stats", em: "📊", bg: ["#111827", "#1f2937"], m: 1, npc: true, caps: [] },
  meme: { n: "Meme", em: "😂", bg: ["#ffffff", "#f1f1f1"], m: 1.2, npc: true, caps: [] },
  trophy: { n: "Trophy", em: "🏆", bg: ["#7a5a00", "#e3b62e"], m: 1.6, npc: true, caps: ["CHAMPIONS 🏆", "We did it!!", "Dreams come true"] },
  award: { n: "Award", em: "🏅", bg: ["#1d2b53", "#3a4f8f"], m: 1.4, npc: true, caps: ["Grateful for this award 🙏", "This one's for the team", "Hard work pays off"] },
  wedding: { n: "Wedding", em: "💍", bg: ["#f8c8dc", "#fbe3ec"], m: 1.5, npc: true, caps: ["Forever starts today 💍", "Married my best friend", "Mr & Mrs ❤️"] },
  baby: { n: "Baby", em: "👶", bg: ["#bde0fe", "#e7f2ff"], m: 1.5, npc: true, caps: ["Welcome to the world, little one 👶", "Best day of my life", "Daddy mode on"] },
  injury: { n: "Injury", em: "🩹", bg: ["#6c757d", "#adb5bd"], m: 1.1, npc: true, caps: ["Setbacks make comebacks 💪", "I'll be back stronger", "Thank you for the messages"] },
  legend: { n: "Legend", em: "⭐", bg: ["#7a5a00", "#f2c230"], m: 1.6, npc: true, caps: ["This club is my home ❤️", "Forever grateful", "Legend status 🙏"] },
  record: { n: "Record", em: "📈", bg: ["#14213d", "#264653"], m: 1.4, npc: true, caps: ["History made 📈", "Records are there to be broken", "Couldn't do it without my teammates"] },
});
Object.assign(CM, {
  transfer: ["WELCOME {ln}!! 🔥", "What a signing", "Overpaid tbh 😬", "Here we go!! 🚨", "He never misses", "Club is moving 💪", "Finally!!!", "Medical when? 🏥"],
  news: ["Wow", "Didn't see that coming 😳", "Source?", "Big if true", "Ya salam"],
  stats: ["{ln} cooking 🔥", "Numbers don't lie", "Where's my guy??", "Underrated"],
  meme: ["😂😂😂", "I'm crying 😭", "Delete this 💀", "Tag him 😂", "Not the {ln} slander 😭"],
  trophy: ["CHAMPIONS 🏆🏆", "What a season!!", "Deserved ❤️"],
  award: ["Deserved 👑", "Robbed others tbh 😂", "Best in the world"],
  wedding: ["Mabrook!! 💍", "Congrats ❤️", "Alf mabrook 🎉"],
  baby: ["Mashallah 🤲", "Future Golden Ball winner 👶", "Congrats!!"],
  injury: ["Get well soon king 🙏", "Come back stronger 💪", "We need you back"],
  legend: ["LEGEND 👑", "Build him a statue", "Forever ours ❤️"],
  record: ["History 📈", "GOAT", "Untouchable"],
});
const accPost = (acc, type, cap, extra = {}) => { const post = makePost(`acc:${acc}`, type, cap, extra); addNpc(post); return post; };

// transfers from anywhere in the world, covered by the journalist
function onTransfer(p, from, to, fee) {
  if (!G || G.mode !== "career" || !G.career || !G.career.life) return;
  const me = pl(G.userPlayer), S = soc();
  const mine = p.id === G.userPlayer, myClub = me && me.club >= 0 ? me.club : null;
  const r = typeof rivalOf === "function" ? rivalOf() : null;
  const notable = mine || fee >= 15e6 || to.id === myClub || (from && from.id === myClub) || (r && p.id === r.id) || (me && me.club >= 0 && club(me.club).lg === to.lg && fee >= 3e6);
  if (!notable || p.loan) return;
  S.tq = S.tq || [];
  const item = { p: p.id, n: fullName(p), ln: p.ln, from: from ? from.id : null, to: to.id, fee, ce: p.ce, o: p.o, mine };
  if (mine) { postTransfer(item); if (typeof UI !== "undefined" && typeof openModal === "function") setTimeout(() => openModal("hwg", item), 450); }
  else { S.tq.push(item); if (S.tq.length > 30) S.tq.shift(); }
}
function postTransfer(t) {
  const to = club(t.to), from = t.from != null ? club(t.from) : null;
  const likes = Math.round(30000 + (t.fee / 1e6) * 9000 + Math.pow(Math.max(0, t.o - 55), 2) * 120) * (t.mine ? 2 : 1);
  const cap = `HERE WE GO! ${t.n} to ${to.name}, deal done${t.fee ? ` for ${money(t.fee)}` : " on a free"}${from ? ` from ${from.name}` : ""}. Contract until ${(t.ce || G.season + 3) + 1}. ✅🔴 #herewego`;
  const post = accPost("jour", "transfer", cap, { likes, ncm: Math.round(likes * 0.02), from: t.from, to: t.to, pn: t.ln, v: rnd() * 3 | 0 });
  post.cm = genComments("transfer", 0.4, 4, { ln: t.ln });
  return post;
}
function postRumour() {
  const me = pl(G.userPlayer);
  const offer = G.inbox.find((m) => m.act && m.act.kind === "coffer" && !m.done && !m.rumoured);
  if (offer && me) {
    offer.rumoured = true; const c = club(offer.act.cid);
    const post = accPost("jour", "transfer", `EXCLUSIVE: ${c.name} have made an official approach for ${fullName(me)}. Talks with his camp ongoing. 🔴⏳ #exclusive`, { likes: Math.round(soc().followers * 0.5 + 20000), from: me.club >= 0 ? me.club : null, to: c.id, rumour: true, pn: me.ln });
    post.cm = genComments("transfer", 0.3, 4, me); return;
  }
  if (rnd() > 0.35) return;
  const stars = Object.values(G.players).filter((q) => q.o >= 82 && q.club >= 0 && typeof q.club === "number" && q.id !== G.userPlayer);
  if (!stars.length) return;
  const q = pick(stars), buyers = G.clubs.filter((c) => c.id !== q.club && c.rep >= club(q.club).rep - 2 && c.rep >= 78);
  if (!buyers.length) return;
  const c = pick(buyers);
  const post = accPost("jour", "transfer", `${c.name} are exploring a move for ${fullName(q)}. Initial talks with ${club(q.club).name}, nothing agreed yet. 🔴 #exclusive`, { likes: Math.round(20000 + q.o * 400), from: q.club, to: c.id, rumour: true, pn: q.ln });
  post.cm = genComments("transfer", 0.2, 3, q);
}
function mediaWeekly() {
  const S = soc(), me = pl(G.userPlayer);
  // the biggest deals of the week
  if (S.tq && S.tq.length) { S.tq.sort((a, b) => b.fee - a.fee); S.tq.splice(0, 3).forEach(postTransfer); if (S.tq.length > 12) S.tq.length = 12; }
  postRumour();
  // general news
  const fresh = (G.news || []).filter((n) => n.s * 400 + n.d > (S.newsAt || 0));
  if (fresh.length) {
    S.newsAt = Math.max(...fresh.map((n) => n.s * 400 + n.d));
    fresh.filter((n) => !/ joins /.test(n.t)).slice(0, 2).forEach((n) => { const post = accPost("news", "news", n.b || n.t, { head: n.t, likes: ri(4000, 40000), v: rnd() * 3 | 0 }); post.cm = genComments("news", 0.1, 3, {}); });
  }
  try { randomNews(); } catch (e) { console.error(e); }
  // league top scorers every other week
  if (me && me.club >= 0 && G.day > 40 && (S.statW = (S.statW || 0) + 1) % 2 === 0) {
    const lg = G.leagues[club(me.club).lg];
    if (lg) {
      const rows = Object.values(G.players).filter((q) => q.club >= 0 && typeof q.club === "number" && club(q.club).lg === lg.id && q.st.lg > 0).sort((a, b) => b.st.lg - a.st.lg).slice(0, 4).map((q) => [q.ln, q.st.lg, q.id === me.id]);
      if (rows.length) { const post = accPost("stats", "stats", `Top scorers in the ${lg.name} so far 🔝⚽`, { rows, title: "TOP SCORERS", likes: ri(6000, 30000) }); post.cm = genComments("stats", 0.3, 3, me); }
    }
  }
}
function memeAfterMatch(f, m) {
  const me = pl(G.userPlayer), L = G.career.last; if (!me || !L || L.f !== f.i) return;
  let post = null;
  if (L.r < 5.9 && rnd() < 0.6) post = accPost("memes", "meme", `${me.ln} today 💀`, { top: `${me.ln.toUpperCase()} BEFORE THE MATCH: "I'M THE BEST"`, bot: `ALSO ${me.ln.toUpperCase()}: ${L.r.toFixed(1)} RATING`, em: pick(["🤡", "😭", "🗑️"]), likes: ri(20000, 90000) });
  else if (L.g >= 2 && rnd() < 0.6) post = accPost("memes", "meme", `Nobody can stop ${me.ln} 😭`, { top: "DEFENDERS WHEN", bot: `${me.ln.toUpperCase()} GETS THE BALL`, em: pick(["😱", "🏃‍♂️💨", "😭"]), likes: ri(30000, 120000) });
  if (post) post.cm = genComments("meme", 0.2, 4, me);
}

// ---------- posting about something that just happened ----------
const MOMENT_KINDS = [
  [/here we go|welcome to|you've joined|joined .* on loan|back home|comes home|comes out of retirement/i, "transfer"],
  [/legend/i, "legend"], [/record/i, "record"], [/married|wedding/i, "wedding"], [/born|baby|son|daughter/i, "baby"],
  [/golden ball|golden boot|golden boy|player of the season|team of the season|award/i, "award"],
  [/win the|won the|champions|trophy|cup winners/i, "trophy"], [/injur|knock/i, "injury"], [/hat-trick|scores \d|masterclass|runs the show/i, "goal"],
  [/charity|fan .* promise|promise kept/i, "charity"], [/car|lamborghini|ferrari|mercedes|porsche/i, "car"], [/villa|apartment|house|mansion/i, "home"],
];
function recentMoments() {
  const C = G.career, now = absDay(), out = [], seen = new Set();
  const add = (t, at) => { if (!t || seen.has(t)) return; const k = MOMENT_KINDS.find(([re]) => re.test(t)); if (!k) return; seen.add(t); out.push({ t, kind: k[1], at }); };
  (C.press || []).forEach((h) => { const at = h.s * 400 + h.d; if (now - at <= 21) add(h.t, at); });
  G.inbox.forEach((m) => { if (m.s != null && m.d != null && now - (m.s * 400 + m.d) > 21) return; if (["career", "life"].includes(m.type)) add(m.t, m.s != null ? m.s * 400 + m.d : now); });
  (C.trophies || []).filter((t) => t.s >= G.season - 1).forEach((t) => add(`Won the ${t.n}`, now));
  (C.awards || []).filter((a) => a.s >= G.season - 1).forEach((a) => add(`${a.n} award`, now));
  const used = new Set((soc().posts || []).map((x) => x.moment));
  return out.filter((x) => !used.has(x.t)).slice(0, 8);
}

// news made from what's happening around the world this week
function randomNews() {
  const S = soc(), me = pl(G.userPlayer), out = [];
  const say = (head, cap, extra = {}) => out.push([head, cap, extra]);
  // star injuries
  S.injSeen = S.injSeen || {};
  const hurt = Object.values(G.players).filter((q) => q.o >= 80 && q.inj >= 14 && q.club >= 0 && typeof q.club === "number" && !S.injSeen[q.id]);
  if (hurt.length) { const q = pick(hurt); S.injSeen[q.id] = G.season * 400 + G.day; const wk = Math.max(2, Math.round(q.inj / 7)); say(`${fullName(q)} ruled out for ${wk} weeks`, `Blow for ${club(q.club).name}: ${fullName(q)} will miss around ${wk} weeks with an injury. 🏥`); }
  for (const k in S.injSeen) if (G.season * 400 + G.day - S.injSeen[k] > 120) delete S.injSeen[k];
  if (me && me.club >= 0 && G.day > 30) {
    const lg = G.leagues[club(me.club).lg];
    if (lg) {
      const order = lg.clubs.slice().sort((a, b) => lg.table[b][6] - lg.table[a][6] || (lg.table[b][4] - lg.table[b][5]) - (lg.table[a][4] - lg.table[a][5]));
      // new leader
      if (S.leader !== order[0] && lg.table[order[0]][0] >= 3) { if (S.leader != null) say(`${club(order[0]).name} go top of the ${lg.name}`, `New leaders! ${club(order[0]).name} are top of the ${lg.name} with ${lg.table[order[0]][6]} points. 🔝`); S.leader = order[0]; }
      // shock results this week
      const rank = (c) => order.indexOf(c) + 1, n = order.length;
      const week = G.fx.filter((f) => f.p && f.c === lg.id && f.d > G.day - 7 && f.d <= G.day);
      const shock = week.find((f) => { const hw = f.hg > f.ag, aw = f.ag > f.hg; return (hw && rank(f.h) > n * 0.6 && rank(f.a) <= 3) || (aw && rank(f.a) > n * 0.6 && rank(f.h) <= 3); });
      if (shock) { const w = shock.hg > shock.ag ? shock.h : shock.a, l = w === shock.h ? shock.a : shock.h; say(`Shock! ${club(w).name} beat ${club(l).name}`, `Upset of the week: ${club(shock.h).name} ${shock.hg}–${shock.ag} ${club(shock.a).name}. 😱`); }
      // manager under pressure
      const bottom = order[n - 1];
      S.pressed = S.pressed || {};
      if (rnd() < 0.25 && lg.table[bottom][0] >= 6 && absDay() - (S.pressed[bottom] || -999) > 56 && (S.pressed[bottom] = absDay())) say(`${club(bottom).name} manager under pressure`, `Bottom of the ${lg.name} after ${lg.table[bottom][0]} games, the ${club(bottom).name} board are losing patience. ⏳`);
    }
  }
  out.slice(0, 2).forEach(([head, cap]) => { const post = accPost("news", "news", cap, { head, likes: ri(5000, 45000) }); post.cm = genComments("news", 0.1, 3, {}); });
}
