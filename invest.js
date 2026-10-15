/* Touchline — investments: businesses, property and markets for player careers. */
"use strict";

const INVESTS = [
  { id: "cafe", n: "Café in Zamalek", cat: "Business", cost: 150000, inc: 650, vol: 0.35, fail: 0.04, d: "A cosy café by the Nile. Steady money, but bad months happen." },
  { id: "gym", n: "Fitness gym in Sheikh Zayed", cat: "Business", cost: 450000, inc: 1700, vol: 0.3, fail: 0.03, fame: true, d: "Members pay monthly, and your name brings people in." },
  { id: "rest", n: "Restaurant in New Cairo", cat: "Business", cost: 850000, inc: 4100, vol: 0.45, fail: 0.05, d: "Big upside, big risk. Restaurants close all the time." },
  { id: "brand", n: "Your own clothing brand", cat: "Business", cost: 600000, inc: 2300, vol: 0.6, fail: 0.05, fame: true, d: "Sales depend on how famous you are." },
  { id: "academy", n: "Youth football academy", cat: "Business", cost: 1200000, inc: 2800, vol: 0.2, fail: 0.01, rep: true, d: "Slow, steady, and good for your public image." },
  { id: "flat", n: "Apartment in New Cairo", cat: "Property", cost: 1000000, inc: 1150, vol: 0.05, grow: 0.05, d: "Rent every week, and the value creeps up." },
  { id: "sahel", n: "Villa on the North Coast (Sahel)", cat: "Property", cost: 2800000, inc: 4000, summer: true, vol: 0.08, grow: 0.06, d: "Huge rent in summer, quiet in winter." },
  { id: "dubai", n: "Apartment in Dubai", cat: "Property", cost: 3500000, inc: 4400, vol: 0.06, grow: 0.04, d: "Expensive, but the rent is strong." },
  { id: "stocks", n: "Stock market fund", cat: "Markets", flex: true, min: 50000, drift: 0.0014, vol: 0.025, d: "Grows over time, with dips along the way." },
  { id: "crypto", n: "Crypto", cat: "Markets", flex: true, min: 20000, drift: 0.001, vol: 0.08, d: "Could double. Could vanish." },
];
const INVEST_BY = Object.fromEntries(INVESTS.map((x) => [x.id, x]));
const invList = () => (G.career.life.inv = G.career.life.inv || []);
const summerNow = () => G.day < 60 || G.day > 300;

function investIncome(h) {
  const x = INVEST_BY[h.k]; if (!x || x.flex) return 0;
  const L = G.career.life;
  let inc = x.inc * (x.cat === "Business" ? h.perf : 1);
  if (x.fame) inc *= 0.5 + L.fame / 80;
  if (x.summer) inc *= summerNow() ? 2.5 : 0.35;
  if (x.cat === "Business" && h.perf < 0.55) inc = -x.inc * (0.55 - h.perf) * 1.5; // losing money
  return Math.round(inc / 50) * 50;
}
function investValue(h) {
  const x = INVEST_BY[h.k];
  if (x.cat === "Business") return Math.round(x.cost * clamp(h.perf, 0.15, 2) * 0.85 / 1000) * 1000;
  return Math.round(h.val / 1000) * 1000;
}
function buyInvest(id, amt) {
  const x = INVEST_BY[id], L = G.career.life; if (!x) return "";
  const cost = x.flex ? Math.max(x.min, Math.round(+amt || 0)) : x.cost;
  if (L.cash < cost) return `You need ${money(cost)} for that.`;
  if (!x.flex && invList().some((h) => h.k === id)) return "You already own one of those.";
  L.cash -= cost;
  if (x.flex) { const h = invList().find((q) => q.k === id); if (h) { h.val += cost; h.paid += cost; } else invList().push({ k: id, paid: cost, val: cost, wk: 0, since: G.season }); }
  else invList().push({ k: id, paid: cost, val: cost, perf: 1, wk: 0, since: G.season });
  if (cost >= 500000 && L.partner) partnerMood(L.ptype === "thrifty" ? 4 : 1, "She likes that you're investing for the future.", "family");
  return x.flex ? `You put ${money(cost)} into ${x.n.toLowerCase()}.` : `You bought: ${x.n}.`;
}
function sellInvest(id) {
  const L = G.career.life, i = invList().findIndex((h) => h.k === id); if (i < 0) return "";
  const h = invList()[i], v = investValue(h), gain = v - h.paid;
  L.cash += v; invList().splice(i, 1);
  return `Sold for ${money(v)} (${gain >= 0 ? "profit" : "loss"} of ${money(Math.abs(gain))}).`;
}
function investWeekly() {
  const C = G.career, L = C && C.life; if (!L || !L.inv || !L.inv.length) return;
  let total = 0;
  for (const h of L.inv.slice()) {
    const x = INVEST_BY[h.k]; if (!x) continue;
    if (x.flex) {
      let r = x.drift + x.vol * randn();
      if (h.k === "crypto" && rnd() < 0.01) { r = -0.8; inbox({ t: "Crypto crash!", b: `The market collapsed overnight. Your crypto lost more than half its value.`, type: "life" }); }
      else if (h.k === "crypto" && rnd() < 0.007) { r = 0.4; inbox({ t: "Crypto is mooning", b: "Your coins jumped 50% in a week. Sell now, or hold on?", type: "life" }); }
      else if (h.k === "stocks" && rnd() < 0.006) { r = -0.18; inbox({ t: "Stock market slump", b: "Markets fell sharply this week. Your fund dropped 18%.", type: "life" }); }
      h.val = Math.max(0, h.val * Math.exp(r)); h.wk = 0;
    } else {
      if (x.cat === "Business") {
        h.perf = clamp(h.perf + randn() * 0.05 * x.vol + (1 - h.perf) * 0.01, 0.2, 1.8);
        if (rnd() < 0.02) {
          const good = rnd() < 0.5;
          const ev = good ? pick(["went viral on social media", "got a glowing review", "had a record month", "was featured on TV"]) : pick(["got a terrible review", "had a burst pipe", "lost its best manager", "was hit by a lawsuit"]);
          h.perf = clamp(h.perf + (good ? 0.25 : -0.22), 0.2, 1.8);
          inbox({ t: `${x.n}: ${good ? "good news" : "bad news"}`, b: `Your ${x.n.toLowerCase()} ${ev}.`, type: "life" });
        }
        if (h.perf < 0.45 && rnd() < x.fail) {
          L.inv = L.inv.filter((q) => q !== h);
          inbox({ t: `${x.n} has closed`, b: `After months of losses, your ${x.n.toLowerCase()} has shut down. You lost the ${money(h.paid)} you put in.`, type: "life" });
          partnerMood(-4, "She's upset about the money you lost.", "spend");
          continue;
        }
        if (x.rep && rnd() < 0.3 && typeof crep === "function") crep(0.1);
      } else h.val *= Math.exp(x.grow / 44 + x.vol * 0.1 * randn());
      h.wk = investIncome(h);
      total += h.wk;
    }
  }
  L.cash += total; L.invWk = total;
}
