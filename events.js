/* Touchline — random life events with choices, children's schools and football training. */
"use strict";

// ---------- schools & training ----------
const SCHOOLS_EG = [
  { id: "pub", n: "Public school", fee: 0, d: "Free government school close to home.", sport: 0 },
  { id: "ais", n: "American International School in Egypt (AIS)", fee: 12000, d: "American curriculum with a big sports programme.", sport: 0.08 },
  { id: "alsson", n: "Alsson British & American International School", fee: 9000, d: "New Giza campus with British and American programmes.", sport: 0.05 },
  { id: "lfc", n: "Lycée Français du Caire", fee: 7000, d: "French curriculum school in Cairo.", sport: 0.02 },
  { id: "deo", n: "Deutsche Evangelische Oberschule (DEO)", fee: 6000, d: "The German school in Cairo, leading to the Abitur.", sport: 0.02 },
];
const SCHOOLS_INTL = [
  { id: "pub", n: "Local state school", fee: 0, d: "Free school close to home.", sport: 0 },
  { id: "intl", n: "International school", fee: 15000, d: "Small classes and good facilities.", sport: 0.04 },
  { id: "sport", n: "Sports boarding school", fee: 25000, d: "Football every day after lessons.", sport: 0.12 },
];
const TRAINING = [
  { id: 0, n: "No football training", wk: 0, chance: 0, pot: 0 },
  { id: 1, n: "Local club training", wk: 200, chance: 0.12, pot: 1 },
  { id: 2, n: "Elite football academy", wk: 1500, chance: 0.25, pot: 2 },
];
const egyptLife = () => { const p = pl(G.userPlayer); return !!p && (p.nat === "EGY" || (p.club >= 0 && club(p.club).country === "Egypt") || (G.career.lastClub != null && club(G.career.lastClub).country === "Egypt")); };
const schoolList = () => (egyptLife() ? SCHOOLS_EG : SCHOOLS_INTL);
const schoolOf = (k) => SCHOOLS_EG.concat(SCHOOLS_INTL).find((s) => s.id === k.school) || null;
const kidAge = (k) => G.season - k.by;
function kidCosts(L) {
  return L.kids.reduce((s, k) => s + (k.school ? Math.round((schoolOf(k) || { fee: 0 }).fee / 52) : 0) + (k.train ? TRAINING[k.train].wk : 0), 0);
}
function setSchool(i, id) {
  const L = G.career.life, k = L.kids[i], sc = schoolList().find((s) => s.id === id);
  if (!k || !sc) return "";
  if (kidAge(k) < 4) return `${k.name} is too young for school.`;
  if (kidAge(k) > 17) return `${k.name} has finished school.`;
  k.school = id;
  if (L.partner) {
    if (L.pschool == null) L.pschool = pick(schoolList()).id;
    if (L.pschool === id) partnerMood(6, `She's thrilled with ${k.name}'s new school.`);
    else partnerMood(-3, `She'd have preferred ${schoolList().find((s) => s.id === L.pschool).n} for ${k.name}.`);
  }
  return `${k.name} will go to ${sc.n}${sc.fee ? ` (about ${money(sc.fee)} a year)` : ""}.`;
}
function setTraining(i, lvl) {
  const L = G.career.life, k = L.kids[i];
  if (!k || k.g !== "boy") return "";
  if (kidAge(k) < 4) return `${k.name} is too young to start training.`;
  if (kidAge(k) > 15) return `${k.name} is too old to start at an academy now.`;
  k.train = lvl;
  return lvl ? `${k.name} starts ${TRAINING[lvl].n.toLowerCase()} (${money(TRAINING[lvl].wk)}/wk).` : `${k.name} stops football training.`;
}
// called once a season from endSeason
function kidsSeason() {
  const L = G.career && G.career.life; if (!L) return;
  for (const k of L.kids) {
    const a = kidAge(k) + 1;
    if (a > 17) k.school = k.school ? k.school : null;
    if (k.g !== "boy") continue;
    if (k.train) {
      k.ty = (k.ty || 0) + 1;
      k.pot = clamp(k.pot + TRAINING[k.train].pot, 50, 96);
      if (!k.fb && rnd() < TRAINING[k.train].chance + ((schoolOf(k) || {}).sport || 0)) {
        k.fb = true;
        inbox({ t: `${k.name} has fallen in love with football`, b: `After ${k.ty} season${k.ty > 1 ? "s" : ""} of training, ${k.name} says he wants to be a footballer like you.`, type: "life" });
      }
    } else if (k.fb && a >= 8 && rnd() < 0.12) {
      k.fb = false;
      inbox({ t: `${k.name} has lost interest in football`, b: `Without regular training, ${k.name} has moved on to other things. Football training could bring the spark back.`, type: "life" });
    }
    if (a > 15 && k.train) k.train = 0;
  }
}

// ---------- random events ----------
const tmName = (c) => { const p = c.tm != null ? pl(c.tm) : null; return p ? fullName(p) : "A teammate"; };
const pickTeammate = () => { const me = pl(G.userPlayer); if (!me || me.club < 0) return null; const l = squad(me.club).filter((q) => q.id !== me.id); return l.length ? pick(l).id : null; };
const ctrust = (d) => { G.career.trust = clamp((G.career.trust == null ? 50 : G.career.trust) + d, 0, 100); };
const cmor = (d) => { const p = pl(G.userPlayer); p.mor = clamp(p.mor + d, 5, 100); };
const cfame = (d) => { G.career.life.fame = clamp(G.career.life.fame + d, 0, 100); };
const chappy = (d) => { G.career.life.happy = clamp(G.career.life.happy + d, 0, 100); };
const ccash = (d) => { G.career.life.cash += d; };
const mconf = (d) => { G.mgr.conf = clamp(G.mgr.conf + d, 0, 100); };

const EVENTS = [
  // ----- player career -----
  { id: "gift", m: "career", w: 3, ok: () => pl(G.userPlayer).club >= 0, ctx: () => ({ tm: pickTeammate(), item: pick(["a designer watch", "a signed shirt from his first club", "a pair of custom boots", "an expensive bottle of perfume", "a framed photo of your first goal together"]) }),
    t: (c) => `${tmName(c)} gave you a gift`, b: (c) => `${tmName(c)} turned up at training with ${c.item} for you. The whole dressing room is watching how you react.`,
    o: [["Thank him warmly", () => { ctrust(2); cmor(4); chappy(2); return "He's chuffed. The dressing room loved it."; }],
      ["Ignore it", () => { cmor(-2); ctrust(-1); return "Awkward. A few teammates think you're arrogant."; }],
      ["Politely turn it down", () => { cmor(-1); return "He understands, but he looks a bit hurt."; }]] },
  { id: "party", m: "career", w: 2, ok: () => true, ctx: () => ({ tm: pickTeammate() }),
    t: (c) => `${tmName(c)} invites you to his birthday party`, b: () => "It's two nights before the next match. Half the squad will be there.",
    o: [["Go and enjoy it", () => { chappy(5); cdisc(4, "spotted partying before a match"); const p = pl(G.userPlayer); p.fit = clamp(p.fit - 10, 30, 100); partnerMood(-4, "You came home at 4am."); if (rnd() < 0.2) { ctrust(-6); cdisc(8, "pictured partying two nights before a match"); return "Photos leaked. The manager is not happy."; } return "Great night. You're tired, but the bond with the lads is stronger."; }],
      ["Show up for an hour", () => { chappy(2); cmor(2); return "You show your face and leave early. Everyone's happy."; }],
      ["Stay home and rest", () => { cmor(-1); ctrust(1); return "The lads tease you a bit, but the manager notices your professionalism."; }]] },
  { id: "press", m: "career", w: 2, ok: () => pl(G.userPlayer).club >= 0, ctx: () => ({}),
    t: () => "A journalist asks about the manager", b: () => "There are rumours the manager could be sacked. A reporter asks if the players still believe in him.",
    o: [["Back the manager publicly", () => { ctrust(5); return "The manager thanks you privately."; }],
      ["No comment", () => "The story moves on."],
      ["Say the team needs a change", () => { ctrust(-12); cfame(3); cdisc(6, "criticising the manager in public"); return "It's front-page news. The manager won't forget this."; }]] },
  { id: "loan", m: "career", w: 1.5, ok: () => G.career.life.cash > 80000, ctx: () => ({ tm: pickTeammate(), amt: pick([20000, 50000, 100000]) }),
    t: (c) => `${tmName(c)} asks to borrow money`, b: (c) => `${tmName(c)} is in trouble with debts and asks you to lend him ${money(c.amt)}. He promises to pay it back.`,
    o: [["Lend him the money", (c) => { ccash(-c.amt); cmor(3); if (rnd() < 0.6) { ccash(c.amt); return `He paid you back within a month, with a thank-you dinner.`; } partnerMood(-8, `She found out you lent ${money(c.amt)} to a teammate who never paid it back.`); return "Weeks pass. The money never comes back."; }],
      ["Lend him half", (c) => { ccash(-c.amt / 2); if (rnd() < 0.7) { ccash(c.amt / 2); return "He paid back every cent."; } return "He's gone quiet about it. That money's gone."; }],
      ["Say no", () => { cmor(-1); return "He says he understands. Things are a bit cold between you."; }]] },
  { id: "hospital", m: "career", w: 1.5, ok: () => true, ctx: () => ({}),
    t: () => "Children's hospital visit", b: () => "The club's charity foundation asks if you'll visit sick children on your day off.",
    o: [["Go and spend the afternoon", () => { cfame(3); chappy(5); crep(4); return "The kids' faces lit up. The video went viral."; }],
      ["Send signed shirts instead", () => { cfame(1); return "A kind gesture. The hospital thanks you."; }],
      ["Decline", () => { cfame(-2); return "A tabloid mentions you were the only player who didn't go."; }]] },
  { id: "abuse", m: "career", w: 1.5, ok: () => true, ctx: () => ({}),
    t: () => "Abuse on social media", b: () => "After the last game, rival fans are flooding your comments with insults.",
    o: [["Clap back at them", () => { cfame(2); ctrust(-3); cdisc(3, "in a social media row"); return "Your reply went viral, but the club asked you to tone it down."; }],
      ["Ignore it", () => { cmor(-2); return "It stings, but it passes."; }],
      ["Report it and post a calm message", () => { cfame(2); cmor(1); return "Fans and the club respect how you handled it."; }]] },
  { id: "mentor", m: "career", w: 1.5, ok: () => age(pl(G.userPlayer)) >= 24, ctx: () => ({}),
    t: () => "A youngster asks for advice", b: () => "An 18-year-old from the academy asks if you'd help him with extra training after sessions.",
    o: [["Mentor him", () => { ctrust(4); chappy(2); return "The manager loves seeing senior players set an example."; }],
      ["Give him a few tips", () => { ctrust(1); return "He's grateful."; }],
      ["You're too busy", () => { ctrust(-1); return "He nods and walks off."; }]] },
  { id: "ad", m: "career", w: 1.5, ok: () => G.career.life.fame >= 6, ctx: () => ({ fee: Math.round((10000 + G.career.life.fame * 3000) / 1000) * 1000 }),
    t: () => "Energy drink advert", b: (c) => `An energy drink brand offers you ${money(c.fee)} to star in a TV advert. Filming is on your day off.`,
    o: [["Take the money", (c) => { ccash(c.fee); cfame(2); const p = pl(G.userPlayer); p.fit = clamp(p.fit - 5, 30, 100); return `${money(c.fee)} in the bank, and the advert is everywhere.`; }],
      ["Ask for double", (c) => { if (rnd() < 0.4) { ccash(c.fee * 2); cfame(2); return `They agreed! ${money(c.fee * 2)}.`; } return "They found another player instead."; }],
      ["Decline", () => "You keep your day off."]] },
  { id: "knock", m: "career", w: 1.5, ok: () => pl(G.userPlayer).club >= 0, ctx: () => ({}),
    t: () => "Playing through a knock", b: () => "You've got a sore hamstring. The manager asks if you can play in the next game anyway.",
    o: [["Play through it", () => { ctrust(5); if (rnd() < 0.3) { const p = pl(G.userPlayer); p.inj = Math.max(p.inj, ri(14, 35)); return "The hamstring went. You're out for a few weeks."; } return "You got through it. The manager won't forget your commitment."; }],
      ["Ask to rest", () => { const p = pl(G.userPlayer); p.fit = clamp(p.fit + 10, 0, 100); ctrust(-1); return "You sit this one out to be safe."; }]] },
  { id: "fight", m: "career", w: 1.2, ok: () => pl(G.userPlayer).club >= 0, ctx: () => ({ tm: pickTeammate() }),
    t: () => "Bust-up in training", b: (c) => `${tmName(c)} and another player start pushing each other after a late tackle in training.`,
    o: [["Step in and calm it down", () => { ctrust(4); cmor(1); return "You split them up. The manager notices your leadership."; }],
      ["Stay out of it", () => "The coaches sort it out."],
      ["Take your teammate's side", () => { cmor(2); ctrust(-3); cdisc(3); return "He appreciates the loyalty, but the dressing room is split."; }]] },
  { id: "holiday", m: "career", w: 2, ok: () => !!G.career.life.partner, ctx: () => ({ eg: egyptLife() }),
    t: () => `${G.career.life.partner} wants a holiday`, b: () => `${G.career.life.partner} says you never spend time together and wants to get away.`,
    o: [["Book the Maldives (€40K)", () => { ccash(-40000); partnerMood(16, "She's still talking about the Maldives."); chappy(6); return "Ten days of sun. She's over the moon."; }],
      [null, (c) => { ccash(-5000); partnerMood(7, c.eg ? "She loved the weekend in Sahel." : "She loved the weekend by the sea."); chappy(3); return c.eg ? "A relaxing weekend on the North Coast." : "A relaxing weekend away."; }, (c) => (c.eg ? "A weekend in Sahel (€5K)" : "A weekend by the sea (€5K)")],
      ["Not now, the season is busy", () => { partnerMood(-10, "She's upset you keep putting football first."); return "She goes quiet for the rest of the evening."; }]] },
  { id: "kidtraining", m: "career", w: 1.5, ok: () => G.career.life.kids.some((k) => k.g === "boy" && kidAge(k) >= 4 && kidAge(k) <= 15), ctx: () => { const L = G.career.life; const i = L.kids.findIndex((k) => k.g === "boy" && kidAge(k) >= 4 && kidAge(k) <= 15); return { i }; },
    t: (c) => `${G.career.life.kids[c.i].name} wants to come to training`, b: (c) => `${G.career.life.kids[c.i].name} asks if he can come and watch you train today.`,
    o: [["Bring him along", (c) => { const k = G.career.life.kids[c.i]; chappy(4); partnerMood(3, "She loved seeing you with your son."); if (!k.fb && rnd() < 0.15) { k.fb = true; return `${k.name} hasn't stopped kicking a ball since. He wants to be a footballer!`; } return `${k.name} had the best day of his life.`; }],
      ["Not today", () => { chappy(-1); return "He's disappointed, but there'll be other days."; }]] },
  { id: "report", m: "career", w: 1.2, ok: () => G.career.life.kids.some((k) => k.school && kidAge(k) >= 6), ctx: () => ({ i: G.career.life.kids.findIndex((k) => k.school && kidAge(k) >= 6), good: rnd() < 0.55 }),
    t: (c) => `${G.career.life.kids[c.i].name}'s school report`, b: (c) => { const k = G.career.life.kids[c.i]; return c.good ? `${k.name} is doing really well at ${schoolOf(k).n}. The teachers are full of praise.` : `${k.name} is struggling at ${schoolOf(k).n}. The teachers want to meet you.`; },
    o: [["Go to the parents' meeting", (c) => { chappy(2); partnerMood(5, "She's glad you made time for the school meeting."); return c.good ? "Proud parents." : "You agree a plan with the teachers. Things will improve."; }],
      ["Hire a private tutor (€10K)", () => { ccash(-10000); partnerMood(3, "She likes that you're investing in the kids."); return "The tutor starts next week."; }],
      ["Leave it to your partner", () => { partnerMood(-6, "She's tired of handling the school stuff alone."); return "She handles it, but she isn't happy about it."; }]] },
  { id: "invest", m: "career", w: 1, ok: () => G.career.life.cash > 300000, ctx: () => ({ amt: pick([150000, 250000]), biz: pick(["a restaurant", "a padel club", "a clothing brand", "a coffee chain"]) }),
    t: (c) => `An old friend pitches ${c.biz}`, b: (c) => `A friend from your childhood wants you to invest ${money(c.amt)} in ${c.biz}.`,
    o: [["Invest", (c) => { ccash(-c.amt); if (rnd() < 0.45) { ccash(c.amt * 2.2); cfame(1); return `It took off! You've made ${money(c.amt * 1.2)} profit.`; } partnerMood(-10, `She's angry you lost ${money(c.amt)} on your friend's business.`); return "It closed within a year. The money's gone."; }],
      ["Invest a small amount", (c) => { ccash(-c.amt / 5); if (rnd() < 0.5) { ccash(c.amt * 0.45); return "A modest profit."; } return "It didn't work out, but you didn't lose much."; }],
      ["Decline", () => "Your friend is disappointed but understands."]] },
  { id: "president", m: "career", w: 0.8, ok: () => pl(G.userPlayer).club >= 0 && (pl(G.userPlayer).form.slice(-5).reduce((s, x) => s + x, 0) / Math.max(1, pl(G.userPlayer).form.slice(-5).length)) >= 7, ctx: () => ({}),
    t: () => "A gift from the club president", b: () => "The club president is so pleased with your form that he offers you a luxury car.",
    o: [["Accept it", () => { const L = G.career.life; if (!L.items.includes("car4")) L.items.push("car4"); chappy(4); return "A brand-new supercar is parked outside your house."; }],
      ["Accept and auction it for charity", () => { cfame(4); chappy(3); crep(4); return "The car raised a fortune for charity. The fans love you."; }],
      ["Politely decline", () => { ctrust(1); return "The president respects your humility."; }]] },
  { id: "cover", m: "career", w: 1.2, ok: () => pl(G.userPlayer).club >= 0, ctx: () => ({ tm: pickTeammate() }),
    t: (c) => `${tmName(c)} asks you to cover for him`, b: (c) => `${tmName(c)} skipped a recovery session and asks you to tell the coaches he was with you.`,
    o: [["Cover for him", () => { cmor(2); if (rnd() < 0.3) { ctrust(-6); cdisc(6, "caught lying to the coaches"); return "The coaches found out. You're both in trouble."; } return "Nobody noticed. He owes you one."; }],
      ["Tell the truth", () => { ctrust(3); cmor(-3); return "The coaches appreciate your honesty. He doesn't."; }],
      ["Stay out of it", () => "You don't get involved."]] },
  { id: "fanphoto", m: "career", w: 1.5, ok: () => true, ctx: () => ({}),
    t: () => "Fans at dinner", b: () => `You're out for dinner${G.career.life.partner ? " with " + G.career.life.partner : ""} when a crowd of fans asks for photos.`,
    o: [["Take photos with everyone", () => { cfame(2); partnerMood(-3, "Dinner turned into a photo shoot."); return "The fans are delighted."; }],
      ["Sign a few things, then go back to dinner", () => { cfame(1); return "A good balance."; }],
      ["Ask them to leave you alone", () => { cfame(-2); partnerMood(2, "She liked having you to herself."); return "Someone posts that you were rude."; }]] },
  // ----- manager -----
  { id: "payrise", m: "manager", w: 2, ok: () => true, ctx: () => { const l = squad(G.userClub).sort((a, b) => b.o - a.o).slice(0, 5); return { p: pick(l).id }; },
    t: (c) => `${fullName(pl(c.p))} wants a pay rise`, b: (c) => `${fullName(pl(c.p))} feels he's underpaid at ${money(pl(c.p).wage)} a week and wants 20% more.`,
    o: [["Give him the rise", (c) => { const p = pl(c.p); p.wage = Math.round(p.wage * 1.2 / 100) * 100; p.mor = clamp(p.mor + 15, 0, 100); return `${shortName(p)} is delighted.`; }],
      ["Promise to talk in the summer", (c) => { const p = pl(c.p); p.mor = clamp(p.mor - 4, 0, 100); return "He accepts it, for now."; }],
      ["Refuse", (c) => { const p = pl(c.p); p.mor = clamp(p.mor - 15, 0, 100); if (rnd() < 0.4) p.listed = 1; return p.listed ? `${shortName(p)} has handed in a transfer request.` : `${shortName(p)} is sulking.`; }]] },
  { id: "mpress", m: "manager", w: 2, ok: () => true, ctx: () => ({}),
    t: () => "Tough press conference", b: () => "A journalist says your tactics are outdated and asks if you're the right person for the job.",
    o: [["Answer calmly", () => { mconf(2); return "A measured answer. The board approve."; }],
      ["Lose your temper", () => { mconf(-4); squad(G.userClub).forEach((p) => (p.mor = clamp(p.mor + 3, 0, 100))); return "It's all over the news. The players liked your fire, the board didn't."; }],
      ["Make a joke of it", () => { mconf(1); return "The room laughs. Crisis averted."; }]] },
  { id: "nightclub", m: "manager", w: 1.5, ok: () => true, ctx: () => ({ p: pick(squad(G.userClub)).id }),
    t: (c) => `${fullName(pl(c.p))} caught at a nightclub`, b: (c) => `Photos show ${fullName(pl(c.p))} out at 3am, two days before a match.`,
    o: [["Fine him a week's wages", (c) => { const p = pl(c.p); p.mor = clamp(p.mor - 8, 0, 100); club(G.userClub).bal += p.wage; mconf(1); return "He accepts the fine. Discipline matters."; }],
      ["Drop him for the next game", (c) => { const p = pl(c.p); p.sus = Math.max(p.sus, 1); p.mor = clamp(p.mor - 12, 0, 100); return `${shortName(p)} will miss the next match.`; }],
      ["Let it go", (c) => { pl(c.p).mor = clamp(pl(c.p).mor + 3, 0, 100); squad(G.userClub).forEach((p) => (p.mor = clamp(p.mor - 1, 0, 100))); return "Some players think you play favourites."; }]] },
  { id: "tickets", m: "manager", w: 1, ok: () => true, ctx: () => ({}),
    t: () => "Fans ask for cheaper tickets", b: () => "The supporters' group asks you to back their campaign for cheaper away tickets.",
    o: [["Back the fans", () => { mconf(2); club(G.userClub).income = Math.round(club(G.userClub).income * 0.98); return "The fans sing your name. The finance director is less happy."; }],
      ["Stay neutral", () => "You say it's a matter for the board."],
      ["Side with the board", () => { mconf(1); return "The board appreciate it. The fans don't."; }]] },
  { id: "naming", m: "manager", w: 0.8, ok: () => true, ctx: () => ({ amt: Math.round((club(G.userClub).income * 4) / 1e5) * 1e5 }),
    t: () => "Training ground sponsorship", b: (c) => `A betting company offers ${money(c.amt)} to put its name on the training ground.`,
    o: [["Accept", (c) => { club(G.userClub).bal += c.amt; mconf(2); return `${money(c.amt)} for the club.`; }],
      ["Decline", () => { mconf(-1); return "You turn it down on principle."; }]] },
  { id: "youngster", m: "manager", w: 1.5, ok: () => squad(G.userClub).some((p) => age(p) <= 19), ctx: () => ({ p: pick(squad(G.userClub).filter((p) => age(p) <= 19)).id }),
    t: (c) => `${fullName(pl(c.p))} wants a chance`, b: (c) => `Academy graduate ${fullName(pl(c.p))} asks when he'll get his first-team chance.`,
    o: [["Promise him minutes soon", (c) => { const p = pl(c.p); p.mor = clamp(p.mor + 15, 0, 100); p.pot = Math.min(96, p.pot + 1); return "He's training like a man possessed."; }],
      ["Tell him to be patient", (c) => { pl(c.p).mor = clamp(pl(c.p).mor - 3, 0, 100); return "He nods, a little disappointed."; }],
      ["Send him out on loan", (c) => { const p = pl(c.p); p.pot = Math.min(96, p.pot + 2); p.mor = clamp(p.mor + 5, 0, 100); return `${shortName(p)} will get regular football elsewhere. (He stays registered with you.)`; }]] },

  // ----- more player scenarios -----
  { id: "fixer", m: "career", w: 0.8, ok: () => pl(G.userPlayer).club >= 0, ctx: () => ({ amt: pick([50000, 100000, 250000]) }),
    t: () => "A stranger with an offer", b: (c) => `A man you've never met offers you ${money(c.amt)} in cash to pick up a yellow card in the first half of your next match.`,
    o: [["Report it to the club", () => { ctrust(8); cfame(4); crep(8); return "The club and the federation thank you. The story makes you a hero."; }],
      ["Say no and walk away", () => "You never hear from him again."],
      ["Take the money", (c) => { if (rnd() < 0.45) { cdisc(60, "banned for match-fixing"); const p = pl(G.userPlayer); p.sus = Math.max(p.sus, 12); cfame(-15); ctrust(-30); partnerMood(-25, "She can't believe you got involved in match-fixing."); return "You were caught. A 12-match ban and your name is all over the news."; } ccash(c.amt); return `${money(c.amt)} in an envelope. You'll have to live with it.`; }]] },
  { id: "supplement", m: "career", w: 1, ok: () => true, ctx: () => ({}),
    t: () => "A miracle supplement", b: () => "A guy at the gym swears a new supplement doubles recovery speed. It isn't on the club's approved list.",
    o: [["Try it", () => { const p = pl(G.userPlayer); if (rnd() < 0.3) { cdisc(45, "failing a drug test"); p.sus = Math.max(p.sus, 16); p.pot = Math.max(p.o, p.pot - 2); cfame(-8); ctrust(-15); return "You failed a drug test. Banned for 16 matches, and your reputation has taken a hit."; } p.fit = 100; return "You feel great. Nobody noticed. This time."; }],
      ["Ask the club doctor first", () => { ctrust(2); return "The doctor says it's banned. Good call."; }],
      ["Ignore it", () => "You stick to the club's programme."]] },
  { id: "extrasession", m: "career", w: 1.5, ok: () => pl(G.userPlayer).club >= 0, ctx: () => ({}),
    t: () => "Extra training on your day off", b: () => "The assistant coach offers you one-to-one sessions on your day off this week.",
    o: [["Say yes", () => { G.career.bonusXP = (G.career.bonusXP || 0) + 0.6; const p = pl(G.userPlayer); p.fit = clamp(p.fit - 6, 30, 100); ctrust(2); return "Hard work. You'll feel the benefit."; }],
      ["Not this week", () => "You enjoy your day off."]] },
  { id: "legend", m: "career", w: 0.8, ok: () => age(pl(G.userPlayer)) <= 24, ctx: () => ({}),
    t: () => "A club legend offers to mentor you", b: () => "A retired club legend has watched you play and offers to work with you every week.",
    o: [["Accept gratefully", () => { const p = pl(G.userPlayer); if (rnd() < 0.6) { p.pot = Math.min(97, p.pot + 1); G.career.potLog = { d: 1, s: G.season, day: G.day, why: "a legend's mentoring" }; } G.career.bonusXP = (G.career.bonusXP || 0) + 0.4; return "His advice is gold. The coaches notice the difference."; }],
      ["Politely decline", () => "He wishes you well."]] },
  { id: "diet", m: "career", w: 1, ok: () => true, ctx: () => ({}),
    t: () => "The nutritionist's plan", b: () => "The club nutritionist wants you on a strict diet: no sugar, no fast food, early nights.",
    o: [["Follow it strictly", () => { chappy(-4); const p = pl(G.userPlayer); if (rnd() < 0.5 && age(p) <= 27) { p.pot = Math.min(97, p.pot + 1); G.career.potLog = { d: 1, s: G.season, day: G.day, why: "a professional diet" }; return "You're leaner and sharper. The coaches raise your ceiling."; } return "You're leaner and sharper."; }],
      ["Follow it most days", () => "A sensible balance."],
      ["Ignore it", () => { ctrust(-2); cdisc(2); return "The nutritionist tells the manager."; }]] },
  { id: "documentary", m: "career", w: 0.8, ok: () => G.career.life.fame >= 15, ctx: () => ({ fee: pick([150000, 300000, 600000]) }),
    t: () => "A documentary about you", b: (c) => `A streaming service wants to film a documentary about your season and offers ${money(c.fee)}.`,
    o: [["Let the cameras in", (c) => { ccash(c.fee); cfame(6); partnerMood(-4, "Cameras in the house every day."); ctrust(-2); return "The show is a hit. The dressing room finds the cameras annoying."; }],
      ["Only on match days", (c) => { ccash(c.fee / 3); cfame(3); return "A lighter version gets made."; }],
      ["Turn it down", () => "You keep your private life private."]] },
  { id: "sickfan", m: "career", w: 1.2, ok: () => true, ctx: () => ({}),
    t: () => "A young fan's wish", b: () => "A seriously ill boy's only wish is to meet you before your next game.",
    o: [["Meet him and promise a goal", () => { cmor(8); cfame(3); chappy(5); crep(4); return "You spend an hour with him. You've never been more fired up for a match."; }],
      ["Record a video message", () => { cfame(1); return "His family send a thank-you note."; }]] },
  { id: "oldclub", m: "career", w: 0.8, ok: () => G.career.life.cash > 250000, ctx: () => ({}),
    t: () => "Your first club needs help", b: () => "The small club where you started as a kid is close to closing because of money problems.",
    o: [["Donate €200K", () => { ccash(-200000); cfame(4); chappy(6); crep(5); return "The club is saved, and the youth stand will carry your name."; }],
      ["Visit and raise awareness", () => { cfame(2); chappy(2); return "Your visit brings in sponsors."; }],
      ["Do nothing", () => { chappy(-2); return "You see the news later. It stings."; }]] },
  { id: "parents", m: "career", w: 1, ok: () => G.career.life.cash > 80000, ctx: () => ({}),
    t: () => "Your parents' house", b: () => "Your parents' house needs major repairs. They'd never ask, but they're struggling.",
    o: [["Buy them a new house (€500K)", () => { ccash(-500000); chappy(10); partnerMood(3, "She thinks it was a lovely thing to do.", "family"); return "Your mum cried. Best money you ever spent."; }],
      ["Pay for the repairs (€60K)", () => { ccash(-60000); chappy(5); return "The house is good as new."; }],
      ["Not right now", () => { chappy(-4); return "They say it's fine. It doesn't feel fine."; }]] },
  { id: "oldposts", m: "career", w: 0.8, ok: () => G.career.life.fame >= 8, ctx: () => ({}),
    t: () => "Old posts resurface", b: () => "Someone has dug up embarrassing posts you made as a teenager. They're trending.",
    o: [["Apologise publicly", () => { cfame(-1); ctrust(1); crep(1); return "Most fans accept the apology."; }],
      ["Ignore it", () => { cfame(-4); crep(-5); return "It drags on for a week."; }],
      ["Delete your account", () => { cfame(-2); chappy(3); return "Peace and quiet. You don't miss it."; }]] },
  { id: "secret", m: "career", w: 1, ok: () => pl(G.userPlayer).club >= 0, ctx: () => { const me = pl(G.userPlayer), cur = club(me.club); const l = G.clubs.filter((c) => c.id !== cur.id && c.rep > cur.rep && c.rep <= me.o + 8); return { c: l.length ? pick(l).id : null }; },
    t: (c) => (c.c != null ? `${club(c.c).name} make a secret approach` : "A secret approach"), b: (c) => `Someone close to ${c.c != null ? club(c.c).name : "a bigger club"} asks if you'd be open to a move.`,
    o: [["Say you're interested", () => { G.career.lastOffer = -1e9; ctrust(-3); return "Word gets back to your manager, but expect an offer next window."; }],
      ["Tell your club about it", () => { ctrust(6); return "The manager appreciates your loyalty."; }],
      ["Ignore it", () => "You focus on your football."]] },
  { id: "rival", m: "career", w: 1.2, ok: () => pl(G.userPlayer).club >= 0, ctx: () => { const me = pl(G.userPlayer); const l = squad(me.club).filter((q) => q.pos === me.pos && q.id !== me.id); return { tm: l.length ? pick(l).id : pickTeammate() }; },
    t: (c) => `${tmName(c)} takes a dig at you`, b: (c) => `${tmName(c)}, who plays your position, told a reporter he deserves to start ahead of you.`,
    o: [["Answer him on the pitch", () => { cmor(6); G.career.bonusXP = (G.career.bonusXP || 0) + 0.3; return "You train like a man possessed this week."; }],
      ["Confront him in the dressing room", () => { if (rnd() < 0.5) { cmor(3); cdisc(2); return "He backs down. Message received."; } ctrust(-5); cdisc(9, "in a dressing-room bust-up"); return "It turns into a shouting match. The manager is furious with you both."; }],
      ["Laugh it off", () => { ctrust(2); return "The manager likes how calmly you handled it."; }]] },
  { id: "language", m: "career", w: 1, ok: () => { const p = pl(G.userPlayer); return p.club >= 0 && club(p.club).nat !== p.nat; }, ctx: () => ({}),
    t: () => "Language lessons", b: () => "The club offers you language lessons to settle in better.",
    o: [["Take them seriously", () => { ctrust(5); chappy(3); G.career.life.ap = Math.max(0, G.career.life.ap - 1); return "You're chatting with teammates in no time. Uses some free time this week."; }],
      ["Skip them", () => { ctrust(-1); return "You'll get by with gestures."; }]] },
  { id: "gaming", m: "career", w: 1, ok: () => true, ctx: () => ({}),
    t: () => "Gaming tournament invite", b: () => "A big streamer invites you to play in a charity gaming tournament, live in front of a million viewers.",
    o: [["Play and stream it", () => { cfame(3); chappy(4); const p = pl(G.userPlayer); p.fit = clamp(p.fit - 3, 30, 100); return "You got knocked out in round two, but the clips went viral."; }],
      ["Decline and rest", () => "An early night instead."]] },
  { id: "speeding", m: "career", w: 0.8, ok: () => G.career.life.items.some((x) => /^car/.test(x)), ctx: () => ({}),
    t: () => "Caught speeding", b: () => "Police stopped you doing 160 km/h in your car. A photographer was nearby.",
    o: [["Pay the fine and apologise", () => { ccash(-5000); cfame(-1); return "A small story, quickly forgotten."; }],
      ["Get a lawyer to fight it (€40K)", () => { ccash(-40000); if (rnd() < 0.5) return "Case dismissed."; cfame(-3); return "You lost, and it looked arrogant."; }],
      ["Blame your driver", () => { cfame(-5); ctrust(-3); cdisc(6, "lying about a speeding offence"); partnerMood(-5, "She's embarrassed by the story in the papers."); return "Nobody believes it. The papers have a field day."; }]] },
  { id: "captainband", m: "career", w: 0.7, ok: () => G.career.captain === pl(G.userPlayer).club, ctx: () => ({ tm: pickTeammate() }),
    t: () => "Dressing room trouble", b: (c) => `As captain, the squad wants you to tell the manager that ${tmName(c)} is being treated unfairly.`,
    o: [["Speak up for him", () => { cmor(4); ctrust(-3); return "The squad respects you. The manager less so."; }],
      ["Stay neutral", () => "You let it blow over."],
      ["Side with the manager", () => { ctrust(4); cmor(-4); return "The manager is grateful. Some players think you've gone soft."; }]] },
  { id: "kidsfootball", m: "career", w: 0.8, ok: () => G.career.life.kids.some((k) => k.g === "boy" && kidAge(k) >= 6 && kidAge(k) <= 15 && !k.train), ctx: () => ({ i: G.career.life.kids.findIndex((k) => k.g === "boy" && kidAge(k) >= 6 && kidAge(k) <= 15 && !k.train) }),
    t: (c) => `A scout spots ${G.career.life.kids[c.i].name}`, b: (c) => `An academy scout saw ${G.career.life.kids[c.i].name} playing in the park and wants him to join their training programme.`,
    o: [["Sign him up", (c) => { G.career.life.kids[c.i].train = 1; return `${G.career.life.kids[c.i].name} starts local club training (€200/wk).`; }],
      ["He's too young for that", () => "Maybe later."]] },
  { id: "charitymatch", m: "career", w: 0.8, ok: () => true, ctx: () => ({}),
    t: () => "Charity match invite", b: () => "You're invited to captain a team of celebrities and retired legends in a charity match during the break.",
    o: [["Play", () => { cfame(3); chappy(4); return "You scored a bicycle kick. It's on every highlights show."; }],
      ["Coach from the sideline", () => { cfame(2); return "A fun day out."; }],
      ["Decline", () => "You rest instead."]] },
  { id: "partnercareer", m: "career", w: 0.8, ok: () => !!G.career.life.partner, ctx: () => ({ job: pick(["a dream job abroad", "a new business she wants to start", "a big promotion that needs long hours"]) }),
    t: () => `${G.career.life.partner}'s big chance`, b: (c) => `${G.career.life.partner} has been offered ${c.job}. She wants your support.`,
    o: [["Support her fully", () => { partnerMood(14, "She feels you really believe in her.", "talk"); chappy(-1); return "She's over the moon."; }],
      ["Help fund it (€100K)", () => { ccash(-100000); partnerMood(10, "She loved that you invested in her dream.", "gift"); return "She thanks you with a huge hug."; }],
      ["Say football comes first", () => { partnerMood(-14, "She feels her life always comes second to yours.", "family"); return "That didn't go down well."; }]] },
  // ----- more manager scenarios -----
  { id: "clash", m: "manager", w: 1.5, ok: () => squad(G.userClub).length > 5, ctx: () => { const s = shuffle(squad(G.userClub).slice()); return { a: s[0].id, b: s[1].id }; },
    t: (c) => "Fight on the training ground", b: (c) => `${fullName(pl(c.a))} and ${fullName(pl(c.b))} had to be pulled apart in training.`,
    o: [["Fine them both", (c) => { [c.a, c.b].forEach((id) => (pl(id).mor = clamp(pl(id).mor - 6, 0, 100))); mconf(1); return "Discipline restored."; }],
      ["Sit them down together", (c) => { [c.a, c.b].forEach((id) => (pl(id).mor = clamp(pl(id).mor + 3, 0, 100))); return "They shake hands. Crisis over."; }],
      ["Ignore it", () => { squad(G.userClub).forEach((p) => (p.mor = clamp(p.mor - 2, 0, 100))); return "The tension lingers."; }]] },
  { id: "starleave", m: "manager", w: 1.2, ok: () => true, ctx: () => ({ p: squad(G.userClub).sort((a, b) => b.o - a.o)[0].id }),
    t: (c) => `${fullName(pl(c.p))}'s agent calls`, b: (c) => `${fullName(pl(c.p))}'s agent says his client is thinking about his future.`,
    o: [["Offer a new contract now", (c) => { const p = pl(c.p); p.wage = Math.round(p.wage * 1.25 / 100) * 100; p.ce = Math.max(p.ce, G.season + 4); p.mor = clamp(p.mor + 12, 0, 100); return `${shortName(p)} signs a new long-term deal.`; }],
      ["Tell him he's not for sale", (c) => { const p = pl(c.p); p.mor = clamp(p.mor - 5, 0, 100); mconf(1); return "The fans love the message."; }],
      ["Put him up for sale", (c) => { pl(c.p).listed = 1; return "He's on the transfer list. Expect bids."; }]] },
  { id: "tour", m: "manager", w: 1, ok: () => G.day < 60 || (G.day > 150 && G.day < 190), ctx: () => ({ amt: Math.round((club(G.userClub).income * 2) / 1e5) * 1e5 }),
    t: () => "Invitation to a tour", b: (c) => `A promoter offers ${money(c.amt)} for a quick friendly tour abroad.`,
    o: [["Accept", (c) => { club(G.userClub).bal += c.amt; squad(G.userClub).forEach((p) => (p.fit = clamp(p.fit - 15, 30, 100))); return "Good money, tired legs."; }],
      ["Decline", () => "The squad rests."]] },
  { id: "wonderkid", m: "manager", w: 0.8, ok: () => club(G.userClub).budget > 1e6, ctx: () => ({ fee: Math.round(club(G.userClub).budget * 0.15 / 1e5) * 1e5 }),
    t: () => "Your scout found a wonderkid", b: (c) => `Your chief scout has found a 16-year-old abroad with huge potential. His club wants ${money(c.fee)}.`,
    o: [["Sign him", (c) => { const cl = club(G.userClub); cl.budget -= c.fee; cl.bal -= c.fee; const p = genPlayer({ pos: pick(["ST", "AM", "LW", "RW", "CM", "CB"]), ovr: ri(50, 58), ag: 16, nat: wpick(FOR_EU), cid: cl.id, pot: ri(84, 93) }); setContract(p, cl, 4); cl.sq.push(p.id); return `${fullName(p)} (${p.pos}) joins your academy.`; }],
      ["Pass", () => "The scout looks disappointed."]] },
  { id: "mole", m: "manager", w: 1, ok: () => true, ctx: () => ({}),
    t: () => "Dressing-room leak", b: () => "Your team selection was in the newspapers before you'd even told the players.",
    o: [["Hunt down the mole", () => { squad(G.userClub).forEach((p) => (p.mor = clamp(p.mor - 3, 0, 100))); mconf(1); return "You find him. Trust takes a hit across the squad."; }],
      ["Hold a team meeting", () => { squad(G.userClub).forEach((p) => (p.mor = clamp(p.mor + 2, 0, 100))); return "The players promise it won't happen again."; }],
      ["Ignore it", () => "It happens again a month later."]] },
  { id: "target", m: "manager", w: 0.8, ok: () => G.day < 120, ctx: () => ({ amt: Math.round(club(G.userClub).budget * 0.3 / 1e5) * 1e5 + 1e6 }),
    t: () => "The board's offer", b: (c) => `The board will add ${money(c.amt)} to your budget now, but they'll expect you to finish above target.`,
    o: [["Take the money", (c) => { club(G.userClub).budget += c.amt; G.mgr.conf = clamp(G.mgr.conf - 6, 0, 100); return "More money, more pressure."; }],
      ["Decline", () => { mconf(3); return "The board appreciate your prudence."; }]] },
  { id: "derby", m: "manager", w: 1, ok: () => true, ctx: () => ({}),
    t: () => "Derby-week press", b: () => "Before the derby, a journalist asks if your side are scared of the opposition.",
    o: [["Fire up the fans", () => { squad(G.userClub).forEach((p) => (p.mor = clamp(p.mor + 5, 0, 100))); return "The stadium will be rocking."; }],
      ["Show respect", () => { mconf(1); return "A classy answer."; }],
      ["Mock them", () => { squad(G.userClub).forEach((p) => (p.mor = clamp(p.mor + 3, 0, 100))); mconf(-2); return "Their players have pinned your quotes on their dressing-room wall."; }]] },
  { id: "presser", m: "career", w: 0, ok: () => false, ctx: () => ({}),
    t: () => "Press conference", b: () => "",
    o: [[null, (c) => { crep(2); ctrust(1); return c.won ? "\"It's all about the team.\" The fans love your humility." : "\"We'll learn and come back stronger.\" A mature answer."; }, () => "Stay humble"],
      [null, (c) => { cfame(2); crep(c.won ? 1 : -1); return c.won ? "\"I told you I'd deliver.\" Confident, and you backed it up." : "\"I'm still the best player out there.\" Some fans roll their eyes."; }, () => "Talk yourself up"],
      [null, (c) => { cfame(4); crep(-3); ctrust(-3); cdisc(4, "after explosive comments"); return c.lost ? "You blamed the referee and your teammates. It's tomorrow's back page." : `You mocked ${c.opp}. It's everywhere, and not everyone is laughing.`; }, () => "Say something explosive"]] },
];
const EVENT_BY = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
function maybeEvent() {
  if (!G) return;
  if (G.mode === "career" && (!G.career || G.career.retired)) return;
  if (G.mode === "manager" && G.sacked) return;
  if (G.inbox.some((m) => m.act && m.act.kind === "event" && !m.done)) return;
  if (rnd() > (G.mode === "career" ? 0.3 : 0.18)) return;
  const pool = EVENTS.filter((e) => e.m === G.mode && (G.recentEv || []).indexOf(e.id) < 0).filter((e) => { try { return e.ok(); } catch (x) { return false; } });
  if (!pool.length) return;
  const ev = wpick(pool.map((e) => [e, e.w]));
  let ctx; try { ctx = ev.ctx(); ev.t(ctx); ev.b(ctx); } catch (x) { return; }
  G.recentEv = [ev.id].concat(G.recentEv || []).slice(0, 5);
  inbox({ t: ev.t(ctx), b: ev.b(ctx), type: "event", act: { kind: "event", ev: ev.id, ctx } });
}
function eventOptions(msg) { const ev = EVENT_BY[msg.act.ev]; return ev ? ev.o.map((o) => (o[0] == null ? o[2](msg.act.ctx) : o[0])) : []; }
function respondEvent(msg, i) {
  const ev = EVENT_BY[msg.act.ev];
  msg.done = true;
  if (!ev || !ev.o[i]) return "";
  try { return ev.o[i][1](msg.act.ctx) || ""; } catch (e) { return "That moment has passed."; }
}
