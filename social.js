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
  return { id: S.seq++, by, type, cap, d: absDay(), likes: 0, cm: [], ncm: 0, liked: false, ...extra };
}
function socialPost(type, cap) {
  const C = G.career, L = C.life, p = pl(G.userPlayer), S = soc(), T = POST_TYPES[type];
  const why = postAllowed(type); if (why) return { err: why };
  if (S.posts.length && S.posts[0].d === absDay()) return { err: "You've already posted today. Fans get tired of spam." };
  const recent = S.posts.filter((x) => absDay() - x.d < 7).length;
  const mood = postMood(type);
  const spam = Math.pow(0.75, recent);
  const likes = Math.round(S.followers * clamp(0.06 + mood * 0.04 + randn() * 0.01, 0.01, 0.14) * T.m * spam);
  const follow = Math.round(likes * (mood > 0 ? 0.05 : -0.04) + S.followers * 0.002 * mood);
  S.followers = Math.max(100, S.followers + follow);
  const post = makePost("me", type, String(cap || captionsFor(type)[0]).slice(0, 140), { likes, ncm: Math.round(likes * (0.012 + Math.abs(mood) * 0.01)), mood, at: Date.now(),
    sc: (type === "match" || type === "goal") && C.last ? C.last.sc || null : null });
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
function addNpc(post) { const S = soc(); S.npc.unshift(post); if (S.npc.length > 40) S.npc.length = 40; }
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
