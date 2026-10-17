/* Touchline — online friends and chat (Firebase). Works on the hosted website; disabled inside claude.ai. */
"use strict";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDOBu-zI_2Qgu_-6flX8wgPQCei-JfUle8",
  authDomain: "touchline-1adc4.firebaseapp.com",
  projectId: "touchline-1adc4",
  storageBucket: "touchline-1adc4.firebasestorage.app",
  messagingSenderId: "582615663644",
  appId: "1:582615663644:web:ac0431097dd9f2cc928bd9",
};
const FB_VER = "10.12.2";

const Online = {
  state: "off", // off | connecting | ready | error
  err: "",
  fs: null, db: null, uid: null,
  profiles: {},   // code -> profile data (live)
  chats: {},      // pair -> [messages]
  unsub: [],
  open: null,     // friend code currently open in chat
  lastPush: 0,

  available() { return !IN_CLAUDE && location.protocol.startsWith("http"); },

  async connect() {
    if (!this.available() || this.state === "connecting" || this.state === "ready") return;
    this.state = "connecting"; this.err = "";
    try {
      const base = `https://www.gstatic.com/firebasejs/${FB_VER}`;
      const [appM, authM, fsM] = await Promise.all([import(`${base}/firebase-app.js`), import(`${base}/firebase-auth.js`), import(`${base}/firebase-firestore.js`)]);
      const app = appM.initializeApp(FIREBASE_CONFIG);
      const auth = authM.getAuth(app);
      const cred = await authM.signInAnonymously(auth);
      this.uid = cred.user.uid;
      this.fs = fsM; this.db = fsM.getFirestore(app);
      this.state = "ready";
      if (G) await this.ensureProfile();
      if (!this.beat) this.beat = setInterval(() => { if (!document.hidden) this.pushProfile(true); }, 45000);
    } catch (e) {
      this.state = "error";
      const c = (e && e.code) || "";
      const detail = ` [${c || (e && e.message) || "unknown"}]`;
      this.err = (c.includes("unauthorized-domain") ? "This website isn't on Firebase's list of allowed sites. Add it under Authentication → Settings → Authorized domains."
        : c.includes("api-key") ? "The Firebase API key wasn't accepted. Double-check the key in online.js."
        : c.includes("operation-not-allowed") || c.includes("admin-restricted") ? "Anonymous sign-in is switched off in Firebase. Turn it on under Authentication → Sign-in method."
        : c.includes("permission-denied") ? "Firestore refused the request. Check that the security rules were published."
        : c.includes("not-found") || c.includes("failed-precondition") ? "The Firestore database doesn't exist yet. Create it under Firestore Database → Create database."
        : c.includes("network") || /fetch|import/i.test(String(e && e.message)) ? "Couldn't reach the chat server. Check your internet connection."
        : "Couldn't connect.") + detail;
      console.error(e);
    }
    refreshOnlineUI();
  },

  myName() {
    if (!G) return "";
    return G.mode === "career" && pl(G.userPlayer) ? fullName(pl(G.userPlayer)) : G.mgr.name || "Manager";
  },
  profileData() {
    const c = club(G.userClub);
    const base = { uid: this.uid, code: G.online.code, name: this.myName(), mode: G.mode, club: c.name, short: c.short, c1: c.c1, c2: c.c2, league: leagueOf(c).name, season: G.season, updated: Date.now() };
    if (G.mode === "career") {
      const p = pl(G.userPlayer);
      if (p) Object.assign(base, { pos: p.pos, ovr: p.o, age: age(p), nat: p.nat, face: p.face, apps: p.st.ap + p.hist.reduce((s, h) => s + h.ap, 0), goals: p.st.g + p.hist.reduce((s, h) => s + h.g, 0), caps: p.caps || 0, trophies: G.career.trophies.length, retired: !!G.career.retired });
    } else Object.assign(base, { trophies: G.mgr.trophies.length, conf: Math.round(G.mgr.conf) });
    try { base.team = teamSnapshot(); } catch (e) { /* ignore */ }
    base.chWon = (G.online && G.online.chWon) || 0;
    // presence for the developer page
    base.seen = Date.now(); base.ver = typeof BUILD !== "undefined" ? BUILD : "";
    try { base.doing = typeof activityText === "function" ? activityText() : ""; } catch (e) { base.doing = ""; }
    if (G.mode === "career" && G.career && G.career.life) { base.cash = Math.round(G.career.life.cash); base.fame = Math.round(G.career.life.fame); }
    else if (G.mode === "manager") base.budget = Math.round(club(G.userClub).budget || 0);
    base.date = `${G.season}/${(G.season + 1) % 100}, day ${G.day}`;
    try { base.posts = socialExport(); } catch (e) { /* ignore */ }
    if (G.mode === "career" && G.career) base.rep = Math.round(G.career.rep == null ? 50 : G.career.rep);
    return base;
  },
  async ensureProfile() {
    if (this.state !== "ready" || !G) return;
    G.online = G.online || { code: null, friends: [], read: {} };
    const { doc, getDoc, setDoc } = this.fs;
    if (!G.online.code) {
      const stem = (this.myName().split(" ").pop() || "PLAYER").normalize("NFD").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10) || "PLAYER";
      for (let i = 0; i < 6; i++) {
        const code = `${stem}-${String(ri(1000, 9999))}`;
        const snap = await getDoc(doc(this.db, "profiles", code));
        if (!snap.exists()) { G.online.code = code; break; }
      }
      if (!G.online.code) throw new Error("no free code");
      await setDoc(doc(this.db, "profiles", G.online.code), this.profileData());
      autosave();
    } else {
      await setDoc(doc(this.db, "profiles", G.online.code), this.profileData()).catch((e) => {
        if (String(e.code).includes("permission")) { this.err = "This save's friend code belongs to another device. Your friends can still see your old card."; }
      });
    }
    this.listen();
  },
  pushProfile(force) {
    if (this.state !== "ready" || !G || !G.online || !G.online.code) return;
    if (!force && Date.now() - this.lastPush < 20000) return;
    this.lastPush = Date.now();
    this.fs.setDoc(this.fs.doc(this.db, "profiles", G.online.code), this.profileData()).catch(() => {});
  },
  pair(code) { return [G.online.code, code].sort().join("__"); },
  stop() { this.unsub.forEach((u) => u()); this.unsub = []; this.profiles = {}; this.chats = {}; this.open = null; },
  listen() {
    this.stop();
    if (!G || !G.online || !G.online.code) return;
    const { doc, onSnapshot, collection, query, orderBy, limitToLast, deleteDoc } = this.fs;
    // commands from the developer page (a fixed list of game actions; only admins can write them)
    const myCode = G.online.code;
    this.unsub.push(onSnapshot(collection(this.db, "cmds", myCode, "q"), (snap) => {
      let n = 0;
      snap.docs.forEach((d) => {
        if (!G || !G.online || G.online.code !== myCode) return;
        try { applyDevCmd(d.data()); n++; } catch (e) { console.error(e); }
        deleteDoc(d.ref).catch(() => {});
      });
      if (n) { autosave(); render(); this.pushProfile(true); }
    }, () => {}));
    for (const code of G.online.friends) {
      this.unsub.push(onSnapshot(doc(this.db, "profiles", code), (s) => { this.profiles[code] = s.exists() ? s.data() : null; refreshOnlineUI(); }, () => {}));
      const pr = this.pair(code);
      const q = query(collection(this.db, "chats", pr, "msgs"), orderBy("at"), limitToLast(60));
      this.unsub.push(onSnapshot(q, (s) => {
        this.chats[pr] = s.docs.map((d) => { const x = d.data({ serverTimestamps: "estimate" }); return { id: d.id, from: x.from, text: x.text, h2h: x.h2h || null, ch: x.ch || null, pc: x.pc || null, pl: x.pl || null, at: x.at && x.at.toMillis ? x.at.toMillis() : Date.now() }; });
        if (this.open === code) this.markRead(code);
        refreshOnlineUI();
      }, (e) => { this.err = "Messages couldn't load. Check that the Firestore security rules were published."; refreshOnlineUI(); }));
    }
  },
  async addFriend(raw) {
    const code = String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9]{1,12}-\d{4}$/.test(code)) return "That doesn't look like a friend code. It should look like KASSEM-4821.";
    if (code === G.online.code) return "That's your own code.";
    if (G.online.friends.includes(code)) return "You're already friends.";
    const s = await this.fs.getDoc(this.fs.doc(this.db, "profiles", code));
    if (!s.exists()) return "No player found with that code.";
    G.online.friends.push(code);
    autosave(); this.listen();
    return `Added ${s.data().name}. Ask them to add your code too: ${G.online.code}.`;
  },
  removeFriend(code) { G.online.friends = G.online.friends.filter((x) => x !== code); if (this.open === code) this.open = null; autosave(); this.listen(); },
  async send(code, text) {
    text = String(text || "").trim().slice(0, 500);
    if (!text) return;
    const { collection, addDoc, serverTimestamp } = this.fs;
    await addDoc(collection(this.db, "chats", this.pair(code), "msgs"), { from: G.online.code, text, at: serverTimestamp() });
  },
  // Kora: comments and likes on posts travel as chat messages between the two friends.
  async postComment(code, owner, at, text) {
    text = String(text || "").trim().slice(0, 300); if (!text) return;
    const { collection, addDoc, serverTimestamp } = this.fs;
    await addDoc(collection(this.db, "chats", this.pair(code), "msgs"), { from: G.online.code, text, at: serverTimestamp(), pc: { o: owner, p: at } });
  },
  async postLike(code, owner, at, cap) {
    const { collection, addDoc, serverTimestamp } = this.fs;
    await addDoc(collection(this.db, "chats", this.pair(code), "msgs"), { from: G.online.code, text: `❤️ liked your post: "${String(cap || "").slice(0, 60)}"`, at: serverTimestamp(), pl: { o: owner, p: at } });
  },
  postMsgs(owner, at, kind = "pc") {
    const out = [];
    for (const pr in this.chats) for (const m of this.chats[pr]) if (m[kind] && m[kind].o === owner && m[kind].p === at) out.push(m);
    return out.sort((a, b) => a.at - b.at);
  },
  koraNew() {
    if (!G || !G.online || !G.online.code) return 0;
    const seen = G.online.koraSeen || 0, me = G.online.code;
    let n = 0; for (const pr in this.chats) for (const m of this.chats[pr]) if (m.from !== me && m.at > seen && ((m.pc && m.pc.o === me) || (m.pl && m.pl.o === me))) n++;
    return n;
  },
  async sendChallenge(code, type) {
    const c = CHALLENGES[type]; if (!c) return "Pick a challenge.";
    const fp = this.profiles[code];
    if (c.career && fp && fp.mode !== "career") return "Your friend is a manager, so pick a team challenge.";
    const { collection, addDoc, serverTimestamp } = this.fs;
    await addDoc(collection(this.db, "chats", this.pair(code), "msgs"), { from: G.online.code, text: `🎯 Challenge: ${c.n}`, at: serverTimestamp(), ch: { id: `${G.online.code}-${Date.now()}`, type } });
    return "Challenge sent.";
  },
  async challenge(code) {
    const fp = this.profiles[code];
    if (!fp || !fp.team) return "Your friend needs to open the game once before you can challenge them.";
    const mine = teamSnapshot(), them = fp.team;
    const lam = (x, y) => 1.3 * Math.exp(0.024 * (x.att - y.def) + 0.01 * (x.mid - y.mid));
    const pois = (l) => { let k = 0, p = 1; const L = Math.exp(-l); do { k++; p *= rnd(); } while (p > L); return k - 1; };
    const ga = pois(lam(mine, them) * 1.05), gb = pois(lam(them, mine));
    let mineScorers = "";
    if (G.mode === "career") { const me = pl(G.userPlayer); if (me && me.club >= 0) { let g = 0; for (let i = 0; i < ga; i++) if (rnd() < (POS_GROUP[me.pos] === "ATT" ? 0.35 : 0.15)) g++; if (g) mineScorers = ` ${me.ln} scored ${g}.`; } }
    const text = `⚔️ Friendly: ${mine.name} ${ga}–${gb} ${them.name}.${mineScorers}`;
    const { collection, addDoc, serverTimestamp } = this.fs;
    await addDoc(collection(this.db, "chats", this.pair(code), "msgs"), { from: G.online.code, text, at: serverTimestamp(), h2h: { a: G.online.code, b: code, ga, gb } });
    return text;
  },
  h2h(code) {
    const r = { w: 0, d: 0, l: 0 };
    for (const m of this.chats[this.pair(code)] || []) {
      if (!m.h2h) continue;
      const mineA = m.h2h.a === G.online.code, my = mineA ? m.h2h.ga : m.h2h.gb, th = mineA ? m.h2h.gb : m.h2h.ga;
      if (my > th) r.w++; else if (my < th) r.l++; else r.d++;
    }
    return r;
  },
  markRead(code) { const m = this.chats[this.pair(code)] || []; if (m.length) { G.online.read[code] = m[m.length - 1].at; } },
  unread(code) {
    if (!G || !G.online) return 0;
    const m = this.chats[this.pair(code)] || [], last = G.online.read[code] || 0;
    return m.filter((x) => x.at > last && x.from !== G.online.code).length;
  },
  totalUnread() { return G && G.online ? G.online.friends.reduce((s, c) => s + this.unread(c), 0) : 0; },
};

function teamSnapshot() {
  const c = club(G.userClub);
  const lu = G.mode === "manager" && !c.auto ? validateUserLineup(c) : { xi: (c.xi && c.xi.length === 11 ? c.xi : autoLineup(c).xi) };
  const form = FORMATIONS[c.form];
  const s = sideStrength({ on: lu.xi.map((id, i) => (id != null && pl(id) ? { pid: id, pos: form[i] } : null)).filter(Boolean), form: 1 });
  return { name: c.name, short: c.short, c1: c.c1, c2: c.c2, att: Math.round(s.att * 10) / 10, mid: Math.round(s.mid * 10) / 10, def: Math.round(s.def * 10) / 10 };
}
let onlineRenderT = null;
function refreshOnlineUI() {
  clearTimeout(onlineRenderT);
  onlineRenderT = setTimeout(() => {
    if (!G) return;
    const box = document.getElementById("chatScroll");
    const atBottom = box ? box.scrollTop + box.clientHeight >= box.scrollHeight - 30 : true;
    const draft = document.getElementById("chatInput"), dv = draft ? draft.value : null, hadFocus = draft && document.activeElement === draft;
    const add = document.getElementById("friendCode"), av = add ? add.value : null;
    const ae = document.activeElement, igId = ae && ae.id && ae.id.startsWith("igc-") ? ae.id : null, igV = igId ? ae.value : null;
    const n = Online.totalUnread();
    if (UI.page === "phone" || UI.page === "kora") { Online._lastN = n; render(); } else if (n !== Online._lastN) { Online._lastN = n; render(); }
    const nd = document.getElementById("chatInput"); if (nd && dv != null) { nd.value = dv; if (hadFocus) nd.focus(); }
    const na = document.getElementById("friendCode"); if (na && av != null) na.value = av;
    if (igId) { const el = document.getElementById(igId); if (el) { el.value = igV; el.focus(); } }
    const nb = document.getElementById("chatScroll"); if (nb && atBottom) nb.scrollTop = nb.scrollHeight;
  }, 60);
}

// ---------- commands from the developer page ----------
function devClub(name) { const n = String(name || "").trim().toLowerCase(); return G.clubs.find((c) => c.name.toLowerCase() === n) || null; }
function applyDevCmd(cmd) {
  const a = cmd.a || {}, career = G.mode === "career" && G.career, p = career ? pl(G.userPlayer) : null;
  const num = (v, lo, hi) => clamp(Math.round(+v || 0), lo, hi);
  switch (cmd.t) {
    case "msg": inbox({ t: String(a.title || "Message").slice(0, 120), b: String(a.body || "").slice(0, 600), type: career ? "career" : "board" }); break;
    case "cash": {
      const amt = num(a.amount, -1e9, 1e9);
      if (career) G.career.life.cash += amt;
      else { const c = club(G.userClub); c.budget = Math.max(0, (c.budget || 0) + amt); c.bal += amt; }
      break;
    }
    case "offer": {
      const c = devClub(a.club); if (!career || !c || !p || p.club === c.id) break;
      const wage = num(a.wage, 0, 5e6) || Math.round(wageFor(p, c)), fee = num(a.fee, 0, 1e9);
      inbox({ t: `${c.name} want to sign you`, b: `${c.name} (${leagueOf(c).name}) have made an offer: ${fee ? `a ${money(fee)} fee` : "a free move"} and ${money(wage)}/wk.`, type: "career", act: { kind: "coffer", cid: c.id, fee, wage } });
      break;
    }
    case "move": {
      const c = devClub(a.club); if (!career || !c || !p || p.club === c.id) break;
      if (p.loan) p.loan = null;
      if (p.club >= 0) G.career.lastClub = p.club;
      doTransfer(p, c, num(a.fee, 0, 1e9), 4, num(a.wage, 0, 5e6) || Math.round(wageFor(p, c)));
      G.userClub = c.id; G.career.fa = false; G.career.captain = null;
      inbox({ t: `Welcome to ${c.name}`, b: `You've completed your move to ${c.name}.`, type: "career" });
      break;
    }
    case "ovr": {
      if (!p) break; const target = clamp(p.o + num(a.delta, -40, 40), 30, 99), w = POS_W[p.pos];
      for (let k = 0; k < 300 && p.o !== target; k++) { const up = p.o < target; for (let i = 0; i < 7; i++) if (w[i] > 0) p.a[i] = r1(clamp(p.a[i] + (up ? 0.3 : -0.3), 10, 99)); calcOvr(p); if (up ? p.o >= target : p.o <= target) break; }
      p.pot = Math.max(p.pot, p.o); p.val = playerValue(p);
      break;
    }
    case "pot": if (p) p.pot = clamp(p.pot + num(a.delta, -40, 40), p.o, 99); break;
    case "fame": if (career) { const d = num(a.delta, -100, 100); G.career.life.fame = clamp(G.career.life.fame + d, 0, 100); G.career.rep = clamp((G.career.rep == null ? 50 : G.career.rep) + d, 0, 100); } break;
    case "heal": if (p) { p.inj = 0; p.fit = 100; } break;
    case "injure": if (p) p.inj = Math.max(p.inj, num(a.days, 1, 365)); break;
    case "event": {
      const ev = EVENT_BY[a.id]; if (!ev || ev.m !== G.mode) break;
      let ctx; try { ctx = ev.ctx(); ev.t(ctx); ev.b(ctx); } catch (e) { break; }
      inbox({ t: ev.t(ctx), b: ev.b(ctx), type: "event", act: { kind: "event", ev: ev.id, ctx } });
      break;
    }
    case "arc": { if (!career || typeof ARCS === "undefined" || !ARCS[a.id]) break; let d; try { d = ARCS[a.id].init(); } catch (e) { break; } G.career.arc = { id: a.id, step: 0, at: absDay(), d }; break; }
    case "kora": {
      if (!career || typeof accPost !== "function") break;
      const acc = ["news", "jour", "stats", "memes"].includes(a.acc) ? a.acc : "news", text = String(a.text || "").slice(0, 280);
      const post = accPost(acc, acc === "memes" ? "meme" : "news", text, { head: text, top: text.slice(0, 48), bot: "", likes: ri(5000, 60000) });
      post.cm = genComments(acc === "memes" ? "meme" : "news", 0.2, 3, p || {});
      break;
    }
  }
}
