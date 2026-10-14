/* Touchline — interface. */
"use strict";

const IN_CLAUDE = !!(window.claude && window.claude.use);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const UI = { page: "home", sort: {}, filt: {}, sel: null, modal: null, live: null, pg: 0, comp: {}, ts: { name: "", pos: "", agemax: "", omin: "", vmax: "", lg: "", listed: false, pg: 0 }, saves: [], cloud: [], cloudOk: false, start: { step: "home" }, lastSaved: null, busy: false };

// ---------- graphics ----------
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function lum(hex) { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }
const faceCache = new Map();
function faceSVG(face, c1 = "#7d847f", c2 = "#ffffff") {
  const key = face.join(",") + c1 + c2;
  if (faceCache.has(key)) return faceCache.get(key);
  const [sk, hs, hcn, bd, ey, br, ns, mo] = face;
  const skin = SKIN[sk] || SKIN[2], dark = shade(skin, -0.16), hc = HAIR_COLORS[hcn] || "#222";
  const browC = hcn === "blond" || hcn === "grey" ? shade(hc, -0.35) : hc;
  let back = "", front = "";
  const cap = "M28.5 42 Q26 14 50 14 Q74 14 71.5 42 Q69 28 60 25 Q50 23 40 25 Q31 28 28.5 42Z";
  if (hs === 5) back += `<ellipse cx="50" cy="34" rx="30" ry="25" fill="${hc}"/>`;
  if (hs === 6) back += `<path d="M27 38 Q23 66 31 80 L69 80 Q77 66 73 38 Z" fill="${hc}"/>`;
  if (hs === 7) { back += `<path d="M27 36 Q22 62 28 76 L72 76 Q78 62 73 36 Z" fill="${hc}"/>`; }
  const shirt = `<path d="M6 100 Q9 80 30 76 L41 72 L59 72 L70 76 Q91 80 94 100 Z" fill="${c1}"/><path d="M41 72 L50 83 L59 72" fill="none" stroke="${c2}" stroke-width="3.2" stroke-linejoin="round"/>`;
  const neck = `<path d="M41.5 60 L41.5 74 Q50 81 58.5 74 L58.5 60 Z" fill="${dark}"/>`;
  const ears = `<ellipse cx="28.8" cy="47" rx="3.6" ry="5.6" fill="${dark}"/><ellipse cx="71.2" cy="47" rx="3.6" ry="5.6" fill="${dark}"/>`;
  const head = `<ellipse cx="50" cy="45" rx="21" ry="25" fill="${skin}"/>`;
  const ew = [3.3, 3.7, 2.9][ey] || 3.3;
  const eyes = [41.5, 58.5].map((x) => `<ellipse cx="${x}" cy="46.5" rx="${ew}" ry="2.1" fill="#fbfbf8"/><circle cx="${x}" cy="46.6" r="1.55" fill="#2b1d14"/>`).join("");
  const bw = [1.3, 1.9, 2.5][br] || 1.8;
  const brows = `<path d="M37 41.2 Q41.5 39 46 41" stroke="${browC}" stroke-width="${bw}" fill="none" stroke-linecap="round"/><path d="M54 41 Q58.5 39 63 41.2" stroke="${browC}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`;
  const nose = [
    `<path d="M50.5 47.5 L48.2 55.2 Q50 56.6 52.2 55.4" fill="none" stroke="${shade(skin, -0.28)}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<path d="M48.6 48 Q46 55 47.2 56.2 Q50 57.6 52.8 56.2 Q54 55 51.4 48Z" fill="${dark}" opacity=".7"/>`,
    `<path d="M49 48 L47.5 55 Q50 57 52.5 55 L51 48" fill="none" stroke="${shade(skin, -0.25)}" stroke-width="1.2" stroke-linecap="round"/>`,
  ][ns] || "";
  const lip = shade(skin, -0.32);
  const mouth = [
    `<path d="M44.5 62 Q50 65.2 55.5 62" stroke="${lip}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`,
    `<path d="M45 62.6 L55 62.6" stroke="${lip}" stroke-width="1.8" stroke-linecap="round"/>`,
    `<path d="M44 61.6 Q50 66.5 56 61.6 Q50 63.4 44 61.6Z" fill="${lip}"/>`,
  ][mo] || "";
  const jaw = "M29 46 Q29 70 50 72 Q71 70 71 46 Q69.5 61 62 63.6 Q56 59.6 50 60.4 Q44 59.6 38 63.6 Q30.5 61 29 46Z";
  let beard = "";
  if (bd === 1) beard = `<path d="${jaw}" fill="${hc}" opacity=".26"/>`;
  if (bd === 2) beard = `<path d="${jaw}" fill="${hc}" opacity=".93"/><path d="M43.5 59.3 Q50 56.8 56.5 59.3 Q50 60.8 43.5 59.3Z" fill="${hc}"/>`;
  if (bd === 3) beard = `<path d="M44 63 Q50 74 56 63 Q50 66.5 44 63Z" fill="${hc}"/><path d="M43.5 59.3 Q50 56.8 56.5 59.3 Q50 60.8 43.5 59.3Z" fill="${hc}"/>`;
  if (bd === 4) beard = `<path d="M43 59.4 Q50 56.4 57 59.4 Q50 61.2 43 59.4Z" fill="${hc}"/>`;
  if (hs === 1) front = `<path d="${cap}" fill="${hc}" opacity=".78"/>`;
  if (hs === 2) front = `<path d="M27.8 43 Q24.5 11 50 12 Q75.5 11 72.2 43 Q70 29 62 26.5 Q52 30 44 26.8 Q33 28 27.8 43Z" fill="${hc}"/>`;
  if (hs === 3) front = `<path d="M27.8 43 Q23 8 50 7 Q78 7 72.2 43 Q70 27 61 24 Q47 21 37 27 Q30 31 27.8 43Z" fill="${hc}"/><path d="M38 14 Q56 6 70 20" stroke="${shade(hc, 0.18)}" stroke-width="2" fill="none" opacity=".6"/>`;
  if (hs === 4) { front = `<path d="${cap}" fill="${hc}"/>`; for (let i = 0; i < 7; i++) front += `<circle cx="${31 + i * 6.3}" cy="${20 + Math.abs(3 - i) * 2.4}" r="5.2" fill="${hc}"/>`; }
  if (hs === 5) front = `<path d="M28.5 40 Q30 26 50 25 Q70 26 71.5 40 Q66 30 50 30 Q34 30 28.5 40Z" fill="${hc}"/>`;
  if (hs === 6) front = `<path d="M27.8 44 Q24 11 50 11 Q76 11 72.2 44 Q70 26 54 24 L50 30 L46 24 Q30 26 27.8 44Z" fill="${hc}"/>`;
  if (hs === 7) { front = `<path d="${cap}" fill="${hc}"/>`; for (let i = 0; i < 5; i++) front += `<path d="M${31 + i * 9.5} 20 l-1 12" stroke="${shade(hc, 0.15)}" stroke-width="2.4" stroke-linecap="round"/>`; }
  if (hs === 8) front = `<path d="${cap}" fill="${hc}" opacity=".35"/><path d="M42 12 Q50 6 58 12 L57 29 Q50 26 43 29Z" fill="${hc}"/>`;
  const svg = `<svg viewBox="0 0 100 100" aria-hidden="true">${back}${shirt}${neck}${ears}${head}${beard}${eyes}${brows}${nose}${mouth}${front}</svg>`;
  faceCache.set(key, svg);
  return svg;
}
function faceHTML(p, size = 32) {
  const c = p.club >= 0 ? club(p.club) : null;
  const inner = p.ph ? `<img src="${esc(p.ph)}" alt="">` : faceSVG(p.face, c ? c.c1 : "#7d847f", c ? c.c2 : "#ffffff");
  return `<span class="face" style="width:${size}px;height:${size}px">${inner}</span>`;
}
function crest(c, size = 28) {
  const tc = lum(c.c1) > 0.62 ? "#15201a" : "#ffffff";
  const t = esc(c.short.slice(0, 4));
  const fs = t.length >= 4 ? 9 : t.length === 3 ? 11 : 13;
  const shape = typeof c.id === "string" ? 1 : c.id % 3;
  let body;
  if (shape === 0) body = `<path d="M3 3 H37 V21 Q37 35 20 42 Q3 35 3 21Z" fill="${c.c1}" stroke="rgba(0,0,0,.28)" stroke-width="1.2"/><path d="M14 3 H26 V40 Q20 42 20 42 Q20 42 14 40Z" fill="${c.c2}" opacity=".9"/>`;
  else if (shape === 1) body = `<circle cx="20" cy="22" r="18.5" fill="${c.c1}" stroke="rgba(0,0,0,.28)" stroke-width="1.2"/><circle cx="20" cy="22" r="14" fill="none" stroke="${c.c2}" stroke-width="2.4"/>`;
  else body = `<path d="M4 6 Q20 0 36 6 V24 Q36 36 20 42 Q4 36 4 24Z" fill="${c.c1}" stroke="rgba(0,0,0,.28)" stroke-width="1.2"/><path d="M4 16 H36 V24 H4Z" fill="${c.c2}" opacity=".9"/>`;
  const txtC = shape === 0 || shape === 2 ? (lum(c.c2) > 0.62 ? "#15201a" : "#ffffff") : tc;
  return `<svg class="crest" width="${size}" height="${Math.round(size * 1.1)}" viewBox="0 0 40 44" aria-hidden="true">${body}<text x="20" y="${shape === 1 ? 26 : 25}" text-anchor="middle" font-family="Saira Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="${fs}" fill="${txtC}" stroke="${txtC === "#ffffff" ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.4)"}" stroke-width=".6" paint-order="stroke">${t}</text></svg>`;
}
const ovrBg = (o) => (o >= 85 ? "#a57900" : o >= 78 ? "#c58f00" : o >= 70 ? "#1c8a4c" : o >= 60 ? "#2c6aa8" : o >= 50 ? "#6a7570" : "#8a5a44");
const ovrTag = (o) => `<span class="ovr" style="background:${ovrBg(o)}">${Math.round(o)}</span>`;
const posTag = (pos) => `<span class="pos ${POS_GROUP[pos]}">${pos}</span>`;
const stars = (rep) => { const s = clamp(Math.round((rep - 50) / 8), 1, 5); return `<span class="stars" title="Reputation ${rep}">${"★".repeat(s)}${"☆".repeat(5 - s)}</span>`; };
const clubName = (c) => `<span class="row" style="gap:6px;flex-wrap:nowrap">${crest(c, 20)}<span>${esc(c.name)}</span></span>`;
const ICON = {
  home: '<path d="M3 11 12 4l9 7v9H3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  inbox: '<path d="M3 5h18v14H3z M3 13h5l2 3h4l2-3h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  squad: '<circle cx="9" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2.5 20c.8-4 3.4-6 6.5-6s5.7 2 6.5 6M16 4.8a3.4 3.4 0 0 1 0 6.4M18 14.4c2 .8 3.2 2.6 3.6 5.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  tactics: '<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3v18" stroke="currentColor" stroke-width="1.4" opacity=".5"/><circle cx="8" cy="8" r="1.8" fill="currentColor"/><circle cx="16" cy="16" r="1.8" fill="currentColor"/><path d="M9.5 9.5l5 5" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>',
  fixtures: '<rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2"/>',
  comps: '<path d="M7 4h10v4a5 5 0 0 1-10 0z M7 6H4a3 3 0 0 0 3 4 M17 6h3a3 3 0 0 1-3 4 M12 13v4 M8 20h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  transfers: '<path d="M4 8h14l-3-3M20 16H6l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  club: '<path d="M4 4h16v6c0 6-4 9-8 11-4-2-8-5-8-11z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  career: '<circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7" fill="none" stroke="currentColor" stroke-width="2"/>',
  saves: '<path d="M5 3h11l3 3v15H5z M8 3v6h8V3 M8 21v-7h8v7" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  world: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" fill="none" stroke="currentColor" stroke-width="1.6"/>',
};
ICON.phone = '<rect x="6" y="2.5" width="12" height="19" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10.5 18.5h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9 8h6M9 11.5h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>';
ICON.life = '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';
const icon = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;

// ---------- toast / modal ----------
let toastT = null;
function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => (el.hidden = true), 3200);
}
function openModal(kind, data = {}) { UI.modal = { kind, ...data }; renderModal(); }
function closeModal() { if (UI.live && UI.live.timer) clearInterval(UI.live.timer); UI.modal = null; renderModal(); }
function renderModal() {
  let root = document.getElementById("modal-root");
  if (!root) { root = document.createElement("div"); root.id = "modal-root"; document.body.appendChild(root); }
  if (!UI.modal) { root.innerHTML = ""; return; }
  const fn = MODALS[UI.modal.kind];
  const keepScroll = root.querySelector(".scrim") ? root.querySelector(".scrim").scrollTop : 0;
  root.innerHTML = fn ? fn(UI.modal) : "";
  const s = root.querySelector(".scrim"); if (s && UI.modal.keep) s.scrollTop = keepScroll;
}
function modalShell(title, body, opts = {}) {
  return `<div class="scrim" data-a="scrim"><div class="modal ${opts.wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(opts.label || "Dialog")}">
  <div class="modal-h">${title}${opts.noClose ? "" : `<button class="btn sm x" data-a="close" aria-label="Close">Close</button>`}</div>
  <div class="modal-b">${body}</div></div></div>`;
}

// ---------- render ----------
function render() {
  const app = document.getElementById("app");
  if (!G) { app.innerHTML = renderStart(); return; }
  const c = club(G.userClub);
  const unread = G.inbox.filter((m) => !m.read).length;
  const nav = G.mode === "manager"
    ? [["home", "Home"], ["inbox", "Inbox"], ["squad", "Squad"], ["tactics", "Tactics"], ["fixtures", "Fixtures"], ["comps", "Competitions"], ["transfers", "Transfers"], ["club", "Club"], ["phone", "Phone"], ["sep"], ["saves", "Save & menu"]]
    : [["home", "Home"], ["inbox", "Inbox"], ["career", "My career"], ["life", "Life"], ["squad", "Squad"], ["fixtures", "Fixtures"], ["comps", "Competitions"], ["world", "Players"], ["phone", "Phone"], ["sep"], ["saves", "Save & menu"]];
  const today = userFxOn(G.day);
  const retiredLock = G.mode === "career" && G.career && G.career.retired && !G.career.pundit;
  const goLabel = retiredLock ? "Retired" : today && !today.p ? "Match day" : "Continue";
  const p = G.mode === "career" ? pl(G.userPlayer) : null;
  app.innerHTML = `<div class="frame">
  <header class="topbar">
    <div class="club">${p ? faceHTML(p, 38) : crest(c, 34)}<div style="min-width:0"><div class="nm">${esc(p ? fullName(p) : c.name)}</div><div class="small muted">${esc(p ? c.name + " · " + p.pos : leagueOf(c).name)}</div></div></div>
    <div class="date"><b>${fmtDate(G.day, { wd: true, y: true })}</b><span class="small muted">${G.season}/${String((G.season + 1) % 100).padStart(2, "0")} season${UI.lastSaved ? " · saved" : ""}</span></div>
    <button class="btn pri go" data-a="continue" ${retiredLock ? "disabled" : ""}>${goLabel}</button>
  </header>
  <nav class="rail" aria-label="Sections">${nav.map(([k, l]) => k === "sep" ? '<div class="sep"></div>' : `<button class="${UI.page === k ? "on" : ""}" data-a="nav" data-p="${k}">${icon(k === "world" ? "world" : k)}<span>${l}</span>${k === "inbox" && unread ? `<span class="badge-n">${unread}</span>` : ""}${k === "phone" && Online.totalUnread() ? `<span class="badge-n">${Online.totalUnread()}</span>` : ""}</button>`).join("")}</nav>
  <main id="main">${(PAGES[UI.page] || PAGES.home)()}</main></div>`;
}

// ---------- start screen ----------
function renderStart() {
  const st = UI.start;
  if (st.step === "mgr") return startManager();
  if (st.step === "custom") return startCustom();
  if (st.step === "career") return startCareer();
  const saves = UI.saves.slice().sort((a, b) => b.saved - a.saved);
  const saveRow = (s, cloud) => {
    const fake = { id: s.clubId || 0, c1: s.c1 || "#136f43", c2: s.c2 || "#fff", short: s.short || "TL" };
    return `<div class="savecard">${crest(fake, 34)}<div style="min-width:0"><b>${esc(s.name)}</b><div class="small muted">${esc(s.mode === "career" ? "Player career · " + s.player : "Manager · " + s.player)} · ${esc(s.club)} · ${s.season}/${(s.season + 1) % 100} · ${fmtDate(s.day, { season: s.season })}</div><div class="small muted">${cloud ? "Cloud" : "This device"} · saved ${new Date(s.saved).toLocaleString()}</div></div>
    <div class="row"><button class="btn pri sm" data-a="${cloud ? "loadCloud" : "loadLocal"}" data-id="${esc(s.id)}">Load</button><button class="btn sm danger" data-a="${cloud ? "delCloudAsk" : "delLocalAsk"}" data-id="${esc(s.id)}">Delete</button></div></div>`;
  };
  return `<div class="start">
  <div class="hero"><div><div class="small muted disp" style="letter-spacing:.2em;text-transform:uppercase;font-weight:700">Football management · ${LEAGUE_DATA.length} leagues · ${LEAGUE_DATA.reduce((s, l) => s + l.clubs.trim().split("\n").length, 0)} clubs</div>
  <h1>Touch<em>line</em></h1>
  <p>Run a club from the Premier League to the Botola Pro, chase the Champions League or the CAF Champions League, or start as a 17-year-old and play your way to the Golden Ball.</p></div>
  <div class="panel stack"><h4>How saves work</h4><p class="small muted" style="margin:0">Each person who opens this page gets their own saves. Games autosave on this device after every match. ${UI.cloudOk ? "Use <b>Save to cloud</b> from the in-game menu to carry a save to another device." : IN_CLAUDE ? "Cloud saves light up when you're signed in with edit access." : "To move a save to another device or a friend, export it as a file from the in-game menu and import it there."} You can also export a save file and import it anywhere.</p></div></div>
  <div class="choices" style="margin-bottom:26px">
    <button class="choice" data-a="startMgr"><span class="chip">Manager</span><h3>Take charge of a club</h3><span class="muted">Pick any of the real clubs across Europe and Africa: transfers, tactics, the board and the trophies are yours.</span></button>
    <button class="choice" data-a="startCustom"><span class="chip">Manager</span><h3>Create your own club</h3><span class="muted">Name it, colour it, name every player, and enter it into the division of your choice.</span></button>
    <button class="choice" data-a="startCareer"><span class="chip">Player career</span><h3>Become a player</h3><span class="muted">Design your player's face or upload a photo, pick a starting club, train, earn moves and win awards.</span></button>
  </div>
  <div class="grid ${IN_CLAUDE ? "g2" : ""}">
    <div class="panel"><div class="panel-h"><h3>Saves on this device</h3><label class="btn sm" for="importFile">Import save file</label><input type="file" id="importFile" accept=".json,.gz,application/json" hidden data-c="import"></div>
    <div class="stack">${saves.length ? saves.map((s) => saveRow(s, false)).join("") : `<div class="empty">No saves yet. Start a new game above.</div>`}</div></div>
    ${IN_CLAUDE ? `<div class="panel"><div class="panel-h"><h3>Cloud saves</h3>${UI.cloudOk ? `<button class="btn sm" data-a="refreshCloud">Refresh</button>` : ""}</div>
    <div class="stack">${!UI.cloudOk ? `<div class="empty">Cloud saves aren't available in this view. Local saves and save files still work.</div>` : UI.cloud.length ? UI.cloud.map((s) => saveRow(s, true)).join("") : `<div class="empty">No cloud saves yet.</div>`}</div></div>` : ""}
  </div></div>`;
}

function leagueOptions(sel, filter) {
  return LEAGUE_DATA.filter((l) => !filter || filter(l)).map((l) => `<option value="${l.id}" ${l.id === sel ? "selected" : ""}>${esc(l.country)} — ${esc(l.name)}</option>`).join("");
}
function clubsOfLeagueData(lid) {
  const L = LEAGUE_DATA.find((l) => l.id === lid);
  return L.clubs.trim().split("\n").map((row, i) => { const [name, short, rep, c1, c2] = row.split("|"); return { key: lid + ":" + i, name, short, rep: +rep, c1, c2, id: i }; });
}
function startManager() {
  const st = UI.start; st.lg = st.lg || "ENG1";
  const clubs = clubsOfLeagueData(st.lg).sort((a, b) => b.rep - a.rep);
  return `<div class="start"><div class="page-h"><div><h4>New manager game</h4><h1>Choose your club</h1></div><button class="btn" data-a="startBack">Back</button></div>
  <div class="panel stack" style="margin-bottom:16px"><div class="row">
    <label class="f" style="flex:2;min-width:220px">League<select data-c="startLg">${leagueOptions(st.lg)}</select></label>
    <label class="f" style="flex:1;min-width:160px">Your name<input type="text" id="mgrName" value="${esc(st.mgrName || "")}" placeholder="Manager name" data-c="startField" data-k="mgrName"></label>
    <label class="f" style="flex:1;min-width:160px">Save name<input type="text" id="saveName" value="${esc(st.saveName || "")}" placeholder="My save" data-c="startField" data-k="saveName"></label></div><label class="row small" style="gap:8px;align-items:flex-start;max-width:520px"><input type="checkbox" id="realToggle" ${UI.start.real !== false ? "checked" : ""} data-c="startReal" style="margin-top:3px"><span><b>Real players</b><br><span class="muted">${Object.values(REAL_PLAYERS).reduce((s, x) => s + x.trim().split("\n").length, 0)} real players at 60+ clubs, using 2025/26 squads and approximate ratings. Everyone else is generated. Untick for an all-fictional world.</span></span></label></div>
  <div class="clublist">${clubs.map((c) => `<button class="clubpick ${st.club === c.key ? "on" : ""}" data-a="pickStartClub" data-k="${c.key}">${crest(c, 30)}<span style="min-width:0"><b>${esc(c.name)}</b><br>${stars(c.rep)}</span></button>`).join("")}</div>
  <div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn pri go" data-a="beginMgr" ${st.club ? "" : "disabled"}>Start career</button></div></div>`;
}
function natOptions(sel) { return Object.keys(NATIONS).sort((a, b) => NATIONS[a][0].localeCompare(NATIONS[b][0])).map((k) => `<option value="${k}" ${k === sel ? "selected" : ""}>${esc(NATIONS[k][0])}</option>`).join(""); }
function startCustom() {
  const st = UI.start;
  if (!st.cu) { st.cu = { name: "", short: "", c1: "#0f5a8a", c2: "#f2c230", lg: "ENG2", str: 1, nat: "ENG" }; st.names = null; }
  if (!NATIONS[st.cu.nat]) st.cu.nat = "ENG";
  const cu = st.cu;
  const roles = TEMPLATE_START.concat(TEMPLATE_BENCH);
  if (!st.names) st.names = roles.map(() => { const [f, l] = randName(cu.nat); return [f, l, cu.nat]; });
  const preview = { id: 0, c1: cu.c1, c2: cu.c2, short: (cu.short || cu.name.slice(0, 3) || "NEW").toUpperCase() };
  return `<div class="start"><div class="page-h"><div><h4>New manager game</h4><h1>Create your club</h1></div><button class="btn" data-a="startBack">Back</button></div>
  <div class="grid g21"><div class="panel stack">
    <div class="row"><label class="f" style="flex:2;min-width:200px">Club name<input type="text" id="cuName" value="${esc(cu.name)}" placeholder="e.g. Nile City FC" data-c="cuField" data-k="name"></label>
    <label class="f" style="width:110px">Short<input type="text" id="cuShort" maxlength="4" value="${esc(cu.short)}" placeholder="NCF" data-c="cuField" data-k="short"></label>
    <label class="f">Home<input type="color" id="cuC1" value="${cu.c1}" data-c="cuField" data-k="c1"></label><label class="f">Trim<input type="color" id="cuC2" value="${cu.c2}" data-c="cuField" data-k="c2"></label></div>
    <div class="row"><label class="f" style="flex:2;min-width:220px">Enter division<select data-c="cuField" data-k="lg">${leagueOptions(cu.lg)}</select></label>
    <label class="f" style="flex:1;min-width:150px">Squad strength<select data-c="cuField" data-k="str"><option value="0" ${cu.str == 0 ? "selected" : ""}>Underdogs</option><option value="1" ${cu.str == 1 ? "selected" : ""}>Average</option><option value="2" ${cu.str == 2 ? "selected" : ""}>Contenders</option><option value="3" ${cu.str == 3 ? "selected" : ""}>Superclub</option></select></label></div>
    <p class="small muted" style="margin:0">Your club replaces the lowest-ranked side in that division.</p>
    <div class="row"><label class="f" style="flex:1;min-width:160px">Your name<input type="text" id="mgrName2" value="${esc(st.mgrName || "")}" data-c="startField" data-k="mgrName"></label><label class="f" style="flex:1;min-width:160px">Save name<input type="text" id="saveName2" value="${esc(st.saveName || "")}" data-c="startField" data-k="saveName"></label></div><label class="row small" style="gap:8px;align-items:flex-start;max-width:520px"><input type="checkbox" id="realToggle" ${UI.start.real !== false ? "checked" : ""} data-c="startReal" style="margin-top:3px"><span><b>Real players</b><br><span class="muted">${Object.values(REAL_PLAYERS).reduce((s, x) => s + x.trim().split("\n").length, 0)} real players at 60+ clubs, using 2025/26 squads and approximate ratings. Everyone else is generated. Untick for an all-fictional world.</span></span></label>
  </div>
  <div class="panel stack" style="align-items:center;justify-content:center;text-align:center">${crest(preview, 96)}<h2>${esc(cu.name || "Your club")}</h2>
  <div class="row" style="justify-content:center">${[0, 1, 2].map((i) => `<span class="face" style="width:56px;height:56px">${faceSVG([i * 2, [2, 4, 3][i], ["dark", "black", "brown"][i], i, 1, 1, i, 0], cu.c1, cu.c2)}</span>`).join("")}</div></div></div>
  <div class="panel" style="margin-top:16px"><div class="panel-h"><h3>Name your players</h3><div class="row"><label class="f" style="flex-direction:row;align-items:center;gap:8px">Name style<select data-c="cuField" data-k="nat">${natOptions(cu.nat)}</select></label><button class="btn sm" data-a="cuRandom">Randomise names</button></div></div>
  <div class="stack" style="gap:6px">${roles.map((r, i) => `<div class="editgrid">${posTag(r)}<input type="text" id="cuf${i}" aria-label="First name" value="${esc(st.names[i][0])}" data-c="cuName" data-i="${i}" data-j="0"><input type="text" id="cul${i}" aria-label="Last name" value="${esc(st.names[i][1])}" data-c="cuName" data-i="${i}" data-j="1"><select class="nat" id="cun${i}" aria-label="Nationality" data-c="cuName" data-i="${i}" data-j="2">${natOptions(st.names[i][2])}</select></div>`).join("")}</div>
  <p class="small muted">The first eleven are your starters; the rest are squad players and academy prospects.</p></div>
  <div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn pri go" data-a="beginCustom">Found the club</button></div></div>`;
}
const TALENTS = [["Prospect", 51, 80], ["Talent", 54, 86], ["Wonderkid", 57, 92]];
function startCareer() {
  const st = UI.start;
  if (!st.cp) st.cp = { fn: "", ln: "", nat: "EGY", pos: "ST", foot: "R", age: 17, tal: 1, face: genFace("EGY", 17), ph: null, lg: "EGY1" };
  const cp = st.cp;
  const clubs = clubsOfLeagueData(cp.lg).filter((c) => c.rep <= 74).sort((a, b) => b.rep - a.rep);
  const myO = TALENTS[cp.tal][1] - (18 - cp.age);
  const role = (rep) => (rep - myO <= 5 ? "Likely starter" : rep - myO <= 10 ? "Squad player" : "Youth team");
  const opt = (k, arr, cur) => arr.map(([v, l]) => `<button class="${cur === v ? "on" : ""}" data-a="cpSet" data-k="${k}" data-v="${v}">${l}</button>`).join("");
  const f = cp.face;
  const sw = (i, col, k) => `<button data-a="cpFace" data-i="${i}" data-v="${k}" aria-label="Option ${k}" style="width:28px;height:28px;border-radius:50%;border:2px solid ${f[i] === k ? "var(--ink)" : "var(--line)"};background:${col};cursor:pointer"></button>`;
  return `<div class="start"><div class="page-h"><div><h4>New player career</h4><h1>Create your player</h1></div><button class="btn" data-a="startBack">Back</button></div>
  <div class="grid g21"><div class="panel stack">
    <div class="row"><label class="f" style="flex:1;min-width:150px">First name<input type="text" id="cpFn" value="${esc(cp.fn)}" data-c="cpField" data-k="fn"></label><label class="f" style="flex:1;min-width:150px">Last name<input type="text" id="cpLn" value="${esc(cp.ln)}" data-c="cpField" data-k="ln"></label>
    <label class="f" style="flex:1;min-width:150px">Nationality<select data-c="cpField" data-k="nat">${natOptions(cp.nat)}</select></label></div>
    <div class="row"><span class="small muted" style="width:72px">Position</span><div class="seg">${opt("pos", POSITIONS.map((p) => [p, p]), cp.pos)}</div></div>
    <div class="row"><span class="small muted" style="width:72px">Foot</span><div class="seg">${opt("foot", [["R", "Right"], ["L", "Left"]], cp.foot)}</div>
    <span class="small muted" style="margin-left:12px">Age</span><div class="seg">${opt("age", [[16, "16"], [17, "17"], [18, "18"]], cp.age)}</div></div>
    <div class="row"><span class="small muted" style="width:72px">Talent</span><div class="seg">${opt("tal", TALENTS.map((t, i) => [i, t[0]]), cp.tal)}</div><span class="small muted">Talent is only a starting point. How good you become depends on how you train and live.</span></div>
    <div><h4 style="margin:6px 0 8px">Playstyle trait</h4><div class="traits">${traitsFor(cp.pos).map(([k, t]) => `<button class="trait ${cp.trait === k ? "on" : ""}" data-a="cpSet" data-k="trait" data-v="${k}"><b>${esc(t.n)}</b><span class="small muted">${esc(t.d)}</span></button>`).join("")}</div></div>
    <div class="row"><label class="f" style="flex:1;min-width:220px">Start in<select data-c="cpField" data-k="lg">${leagueOptions(cp.lg)}</select></label><label class="f" style="flex:1;min-width:160px">Save name<input type="text" id="saveName3" value="${esc(st.saveName || "")}" data-c="startField" data-k="saveName"></label></div><label class="row small" style="gap:8px;align-items:flex-start;max-width:520px"><input type="checkbox" id="realToggle" ${UI.start.real !== false ? "checked" : ""} data-c="startReal" style="margin-top:3px"><span><b>Real players</b><br><span class="muted">${Object.values(REAL_PLAYERS).reduce((s, x) => s + x.trim().split("\n").length, 0)} real players at 60+ clubs, using 2025/26 squads and approximate ratings. Everyone else is generated. Untick for an all-fictional world.</span></span></label>
    <div><h4 style="margin:6px 0 8px">Starting club</h4><div class="clublist">${clubs.map((c) => `<button class="clubpick ${cp.club === c.key ? "on" : ""}" data-a="cpClub" data-k="${c.key}">${crest(c, 26)}<span><b>${esc(c.name)}</b><br>${stars(c.rep)} <span class="small muted">${role(c.rep)}</span></span></button>`).join("") || `<div class="empty">No smaller clubs in this league. Try another.</div>`}</div></div>
  </div>
  <div class="panel stack" style="align-items:center">
    <span class="face" style="width:150px;height:150px">${cp.ph ? `<img src="${esc(cp.ph)}" alt="Your photo">` : faceSVG(f, "#136f43", "#ffffff")}</span>
    <div class="row" style="justify-content:center"><label class="btn sm" for="cpPhoto">Upload photo</label><input type="file" id="cpPhoto" accept="image/*" hidden data-c="cpPhoto">${cp.ph ? `<button class="btn sm" data-a="cpNoPhoto">Remove photo</button>` : ""}<button class="btn sm" data-a="cpRandFace">Random look</button></div>
    <div class="stack" style="width:100%;gap:8px">
      <div class="row"><span class="small muted" style="width:70px">Skin</span>${SKIN.map((c, i) => sw(0, c, i)).join("")}</div>
      <div class="row"><span class="small muted" style="width:70px">Hair</span><div class="seg">${["Bald", "Buzz", "Short", "Quiff", "Curly", "Afro", "Long", "Twists", "Mohawk"].map((l, i) => `<button class="${f[1] === i ? "on" : ""}" data-a="cpFace" data-i="1" data-v="${i}">${l}</button>`).join("")}</div></div>
      <div class="row"><span class="small muted" style="width:70px">Colour</span>${Object.keys(HAIR_COLORS).map((k) => sw(2, HAIR_COLORS[k], k)).join("")}</div>
      <div class="row"><span class="small muted" style="width:70px">Beard</span><div class="seg">${["None", "Stubble", "Full", "Goatee", "Moustache"].map((l, i) => `<button class="${f[3] === i ? "on" : ""}" data-a="cpFace" data-i="3" data-v="${i}">${l}</button>`).join("")}</div></div>
      <div class="row"><span class="small muted" style="width:70px">Features</span>${[["Eyes", 4], ["Brows", 5], ["Nose", 6], ["Mouth", 7]].map(([l, i]) => `<button class="btn sm" data-a="cpCycle" data-i="${i}">${l}</button>`).join("")}</div>
    </div></div></div>
  <div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn pri go" data-a="beginCareer" ${cp.club && cp.trait && TRAITS[cp.trait] && traitsFor(cp.pos).some(([k]) => k === cp.trait) ? "" : "disabled"}>Sign first contract</button></div></div>`;
}

// ---------- pages ----------
const PAGES = {};
function formOf(cid, comp) {
  return G.fx.filter((f) => f.p && (f.h === cid || f.a === cid) && (!comp || f.c === comp)).sort((a, b) => b.d - a.d).slice(0, 5).reverse()
    .map((f) => { const gf = f.h === cid ? f.hg : f.ag, ga = f.h === cid ? f.ag : f.hg; const r = gf > ga ? "W" : gf < ga ? "L" : f.w != null ? (f.w === cid ? "W" : "L") : "D"; return `<i class="${r}">${r}</i>`; }).join("");
}
function resChip(f, cid) {
  if (!f.p) return "";
  const gf = f.h === cid ? f.hg : f.ag, ga = f.h === cid ? f.ag : f.hg;
  const r = gf > ga ? "w" : gf < ga ? "l" : f.w != null ? (f.w === cid ? "w" : "l") : "d";
  return `<span class="chip ${r}">${r.toUpperCase()}</span>`;
}
const compShort = (id) => (G.comps[id] ? (COMP_INFO[id] ? COMP_INFO[id].short : G.comps[id].type === "cup" ? "Cup" : "League") : id);
const compName = (id) => (G.comps[id] ? G.comps[id].name : id);
function scoreText(f) { if (!f.p) return "v"; let s = `${f.hg}–${f.ag}`; if (f.pen) s += ` (${f.pen[0]}–${f.pen[1]} p)`; else if (f.et) s += " aet"; return s; }

PAGES.home = () => {
  const c = club(G.userClub), nf = nextUserFx();
  const lg = leagueOf(c), order = sortTable(lg.table, lg.clubs), me = order.indexOf(c.id);
  const lo = clamp(me - 3, 0, Math.max(0, order.length - 7));
  const recent = G.fx.filter((f) => f.p && isUserFx(f)).sort((a, b) => b.d - a.d).slice(0, 5);
  const nm = nf ? (() => { const h = club(nf.h), a = club(nf.a); return `<div class="nextmatch"><div class="tm">${crest(h, 56)}<span>${esc(h.name)}</span></div><div><div class="vs">v</div></div><div class="tm">${crest(a, 56)}<span>${esc(a.name)}</span></div></div>
    <div class="row" style="justify-content:center"><span class="chip">${esc(compName(nf.c))}</span><span class="chip">${esc(nf.s || "")}</span><span class="chip">${fmtDate(nf.d, { wd: true })}</span><span class="chip">${nf.d === G.day ? "Today" : "In " + (nf.d - G.day) + " days"}</span></div>`; })() : `<div class="empty">No more fixtures this season. Continue to the end of the season.</div>`;
  const msgs = G.inbox.slice(0, 5).map((m) => `<div class="msg ${m.read ? "read" : ""}" data-a="openMsg" data-id="${m.id}"><span class="dot"></span><div style="min-width:0"><div class="tt">${esc(m.t)}</div><div class="small muted">${fmtDate(m.d)} ${m.s}</div></div></div>`).join("") || `<div class="empty">No messages.</div>`;
  const table = `<table class="t"><thead><tr><th>#</th><th>Club</th><th class="r">P</th><th class="r">GD</th><th class="r">Pts</th></tr></thead><tbody>${order.slice(lo, lo + 7).map((cid, i) => { const t = lg.table[cid]; return `<tr class="click ${cid === c.id ? "me" : ""}" data-a="clubView" data-id="${cid}"><td>${lo + i + 1}</td><td>${clubName(club(cid))}</td><td class="r">${t[0]}</td><td class="r">${t[4] - t[5]}</td><td class="r"><b>${t[6]}</b></td></tr>`; }).join("")}</tbody></table>`;
  let side;
  if (G.mode === "manager") {
    side = `<div class="panel stack"><h4>Board</h4><div class="small">The board expect ${esc(expectText(c))}.</div><div class="meter"><span class="small muted">Confidence</span><div class="bar"><i style="width:${G.mgr.conf}%;background:${G.mgr.conf < 30 ? "var(--loss)" : G.mgr.conf < 55 ? "var(--warn)" : "var(--win)"}"></i></div><b class="num">${Math.round(G.mgr.conf)}</b></div>
    <div class="kpis"><div class="kpi"><b>${money(c.budget)}</b><span>Transfer budget</span></div><div class="kpi"><b>${money(c.bal)}</b><span>Balance</span></div></div></div>`;
  } else {
    const p = pl(G.userPlayer);
    const L = G.career.last;
    side = `<div class="panel stack"><div class="row">${faceHTML(p, 64)}<div><h3>${esc(fullName(p))}</h3><div class="row small">${posTag(p.pos)} ${ovrTag(p.o)} <span class="muted">age ${age(p)} · ${esc(c.name)}</span></div></div></div>
    <div class="kpis"><div class="kpi"><b>${p.st.ap}</b><span>Apps</span></div><div class="kpi"><b>${p.st.g}</b><span>Goals</span></div><div class="kpi"><b>${p.st.as}</b><span>Assists</span></div><div class="kpi"><b>${p.st.ap ? (p.st.rs / p.st.ap).toFixed(2) : "–"}</b><span>Avg rating</span></div></div>
    ${L ? `<div class="small">Last match: rating <b>${L.r.toFixed(1)}</b>${L.g ? `, ${L.g} goal${L.g > 1 ? "s" : ""}` : ""}${L.a ? `, ${L.a} assist${L.a > 1 ? "s" : ""}` : ""}.</div>` : ""}
    <div class="meter"><span class="small muted" style="width:60px">Morale</span><div class="bar"><i style="width:${p.mor}%"></i></div></div><div class="meter"><span class="small muted" style="width:60px">Fitness</span><div class="bar"><i style="width:${p.fit}%"></i></div></div></div>`;
  }
  return `<div class="page-h"><div><h4>${esc(lg.name)} · ${me + 1}${["st", "nd", "rd"][me] || "th"} place</h4><h1>${G.mode === "manager" ? "Manager's office" : "Dressing room"}</h1></div></div>
  <div class="grid g21"><div class="stack" style="gap:16px">
    <div class="panel"><div class="panel-h"><h3>Next match</h3>${nf && nf.d === G.day ? `<button class="btn pri" data-a="continue">Go to match</button>` : ""}</div>${nm}</div>
    <div class="panel"><div class="panel-h"><h3>Recent results</h3><button class="btn sm" data-a="nav" data-p="fixtures">All fixtures</button></div>${recent.length ? `<div class="tw"><table class="t"><tbody>${recent.map((f) => { const me = userTeamOf(f), opp = club(f.h === me ? f.a : f.h); return `<tr class="click" data-a="report" data-id="${f.i}"><td>${resChip(f, me)}</td><td class="small muted">${fmtDate(f.d)}</td><td>${f.n ? "N" : f.h === me ? "H" : "A"}</td><td>${clubName(opp)}</td><td class="r"><b>${scoreText(f)}</b></td><td class="small muted hide-sm">${esc(compShort(f.c))}</td></tr>`; }).join("")}</tbody></table></div>` : `<div class="empty">The season hasn't started yet.</div>`}</div>
    <div class="panel"><div class="panel-h"><h3>Inbox</h3><button class="btn sm" data-a="nav" data-p="inbox">Open inbox</button></div>${msgs}</div>
  </div><div class="stack" style="gap:16px">${side}
    <div class="panel"><div class="panel-h"><h3>${esc(lg.name)}</h3><button class="btn sm" data-a="nav" data-p="comps">Full table</button></div><div class="tw">${table}</div></div>
    <div class="panel"><h3>Around the world</h3>${G.news.slice(0, 6).map((n) => `<div class="msg read"><div><div class="tt">${esc(n.t)}</div><div class="small muted">${esc(n.b)}</div></div></div>`).join("") || `<div class="empty">Quiet so far.</div>`}</div>
  </div></div>`;
};

PAGES.inbox = () => {
  const list = G.inbox;
  return `<div class="page-h"><div><h4>${list.filter((m) => !m.read).length} unread</h4><h1>Inbox</h1></div><button class="btn sm" data-a="readAll">Mark all read</button></div>
  <div class="panel">${list.map((m) => `<div class="msg ${m.read ? "read" : ""}" data-a="openMsg" data-id="${m.id}"><span class="dot"></span><div style="min-width:0;flex:1"><div class="row" style="justify-content:space-between"><span class="tt">${esc(m.t)}</span><span class="small muted">${fmtDate(m.d)} ${m.s}</span></div><div class="small muted">${esc(m.b)}</div>${m.act && !m.done ? `<span class="chip gold" style="margin-top:4px">Needs a reply</span>` : ""}</div></div>`).join("") || `<div class="empty">Nothing here.</div>`}</div>`;
};

function sortRows(rows, key, defs) {
  const s = UI.sort[key] || defs;
  const get = SORTERS[s.k] || ((p) => p[s.k]);
  return rows.sort((a, b) => { const x = get(a), y = get(b); return (x > y ? 1 : x < y ? -1 : 0) * s.d; });
}
const SORTERS = { age: (p) => age(p), name: (p) => p.ln, pos: (p) => POSITIONS.indexOf(p.pos), form: (p) => (p.form.length ? avg(p.form) : 0), ap: (p) => p.st.ap, g: (p) => p.st.g, as: (p) => p.st.as, club: (p) => (p.club >= 0 ? club(p.club).name : "~") };
function th(key, k, label, cls = "") { const s = UI.sort[key]; return `<th class="s ${cls}" data-a="sort" data-key="${key}" data-k="${k}">${label}${s && s.k === k ? (s.d > 0 ? " ▲" : " ▼") : ""}</th>`; }
function statusChips(p) {
  let s = "";
  if (p.inj > 0) s += `<span class="chip inj" title="Out for ${p.inj} days">Inj ${p.inj}d</span>`;
  if (p.sus > 0) s += `<span class="chip sus">Ban ${p.sus}</span>`;
  if (p.listed) s += `<span class="chip">Listed</span>`;
  if (p.ce != null && p.ce <= G.season) s += `<span class="chip sus">Expiring</span>`;
  if (p.id === G.userPlayer) s += `<span class="chip gold">You</span>`;
  return s;
}
PAGES.squad = () => {
  const c = club(G.userClub);
  const f = UI.filt.squad || "ALL";
  let rows = squad(c.id).filter((p) => f === "ALL" || POS_GROUP[p.pos] === f);
  rows = sortRows(rows, "squad", { k: "pos", d: 1 });
  const wages = squad(c.id).reduce((s, p) => s + p.wage, 0);
  return `<div class="page-h"><div><h4>${c.sq.length} players · wages ${money(wages)}/wk</h4><h1>Squad</h1></div><div class="seg">${["ALL", "GK", "DEF", "MID", "ATT"].map((k) => `<button class="${f === k ? "on" : ""}" data-a="filt" data-key="squad" data-v="${k}">${k === "ALL" ? "All" : k}</button>`).join("")}</div></div>
  <div class="panel"><div class="tw"><table class="t"><thead><tr>${th("squad", "name", "Player")}${th("squad", "pos", "Pos")}${th("squad", "age", "Age", "r")}<th>Nat</th>${th("squad", "o", "Ovr", "c")}${th("squad", "pot", "Pot", "c")}${th("squad", "fit", "Fit", "r")}${th("squad", "mor", "Mor", "r")}${th("squad", "form", "Form", "r")}${th("squad", "ap", "Apps", "r")}${th("squad", "g", "Gls", "r")}${th("squad", "as", "Ast", "r")}${th("squad", "val", "Value", "r")}${th("squad", "wage", "Wage", "r")}${th("squad", "ce", "Until", "r")}<th></th></tr></thead>
  <tbody>${rows.map((p) => `<tr class="click ${p.id === G.userPlayer ? "me" : ""}" data-a="player" data-id="${p.id}"><td><div class="pcell">${faceHTML(p, 28)}<span class="nm">${esc(fullName(p))}</span></div></td><td>${posTag(p.pos)}</td><td class="r">${age(p)}</td><td class="small">${p.nat}</td><td class="c">${ovrTag(p.o)}</td><td class="c small muted">${p.pot}</td><td class="r" style="color:${p.fit < 70 ? "var(--loss)" : p.fit < 88 ? "var(--warn)" : "inherit"}">${p.fit}%</td><td class="r">${moraleWord(p.mor)}</td><td class="r">${p.form.length ? avg(p.form.slice(-5)).toFixed(1) : "–"}</td><td class="r">${p.st.ap}</td><td class="r">${p.st.g}</td><td class="r">${p.st.as}</td><td class="r">${money(p.val)}</td><td class="r">${money(p.wage)}</td><td class="r">${p.ce != null ? p.ce + 1 : "–"}</td><td>${statusChips(p)}</td></tr>`).join("")}</tbody></table></div></div>`;
};
const moraleWord = (m) => (m >= 85 ? "Superb" : m >= 70 ? "Good" : m >= 50 ? "Okay" : m >= 30 ? "Low" : "Poor");

PAGES.tactics = () => {
  if (G.mode !== "manager") return PAGES.home();
  const c = club(G.userClub);
  if (c.auto) autoLineup(c); else validateUserLineup(c);
  const form = FORMATIONS[c.form], xy = FORM_XY[c.form];
  const sel = UI.sel;
  const slots = form.map((pos, i) => {
    const p = c.xi[i] != null ? pl(c.xi[i]) : null;
    const [x, y] = xy[i];
    const e = p ? Math.round(effAt(p, pos)) : 0;
    return `<button class="slot ${sel && sel.k === "xi" && sel.i === i ? "sel" : ""}" style="left:${x}%;bottom:${y}%" data-a="slot" data-k="xi" data-i="${i}">${p ? faceHTML(p, 42) : `<span class="face" style="width:42px;height:42px"></span>`}${p && p.pos !== pos ? `<span class="warn">${e}</span>` : ""}<span class="nm">${p ? esc(shortName(p)) : "Empty"}</span><span class="ps">${pos}${p ? " · " + e : ""}</span></button>`;
  }).join("");
  const benchHtml = c.bench.map((id, i) => { const p = pl(id); return `<tr class="click ${sel && sel.k === "bench" && sel.i === i ? "me" : ""}" data-a="slot" data-k="bench" data-i="${i}"><td><div class="pcell">${faceHTML(p, 24)}<span class="nm">${esc(shortName(p))}</span></div></td><td>${posTag(p.pos)}</td><td>${ovrTag(p.o)}</td><td class="r small">${p.fit}%</td></tr>`; }).join("");
  let picker = "";
  if (sel) {
    const pos = sel.k === "xi" ? form[sel.i] : null;
    const cur = sel.k === "xi" ? c.xi[sel.i] : c.bench[sel.i];
    const rows = squad(c.id).filter((p) => p.id !== cur).map((p) => ({ p, e: pos ? effAt(p, pos) : p.o })).sort((a, b) => b.e - a.e);
    picker = `<div class="panel"><div class="panel-h"><h3>${pos ? `Pick ${pos}` : "Pick substitute"}</h3><button class="btn sm" data-a="unsel">Cancel</button></div><div class="tw" style="max-height:420px;overflow:auto"><table class="t"><thead><tr><th>Player</th><th>Pos</th><th class="r">${pos ? "At " + pos : "Ovr"}</th><th class="r">Fit</th><th>Role</th></tr></thead><tbody>${rows.map(({ p, e }) => { const role = c.xi.includes(p.id) ? "XI" : c.bench.includes(p.id) ? "Bench" : ""; return `<tr class="click" data-a="assign" data-id="${p.id}"><td><div class="pcell">${faceHTML(p, 24)}<span class="nm">${esc(fullName(p))}</span>${statusChips(p)}</div></td><td>${posTag(p.pos)}</td><td class="r"><b>${Math.round(e)}</b></td><td class="r">${p.fit}%</td><td class="small muted">${role}</td></tr>`; }).join("")}</tbody></table></div></div>`;
  }
  const str = (() => { const m = { sides: [{ on: c.xi.map((id, i) => id != null ? { pid: id, pos: form[i] } : null).filter(Boolean), form: 1 }] }; return sideStrength(m.sides[0]); })();
  return `<div class="page-h"><div><h4>Team selection</h4><h1>Tactics</h1></div>
  <div class="row"><label class="row small" style="gap:6px"><input type="checkbox" id="autoPick" ${c.auto ? "checked" : ""} data-c="autoPick"> Assistant picks the team</label><button class="btn" data-a="autoXI">Pick best XI now</button></div></div>
  <div class="grid g21"><div class="stack" style="gap:16px"><div class="panel"><div class="pitch">${pitchLines()}${slots}</div><p class="small muted" style="margin:8px 0 0">Tap a player, then pick a replacement. A red number means he's playing out of position.</p></div></div>
  <div class="stack" style="gap:16px">
    <div class="panel stack"><label class="f">Formation<select data-c="formation">${Object.keys(FORMATIONS).map((k) => `<option ${k === c.form ? "selected" : ""}>${k}</option>`).join("")}</select></label>
    <div><div class="small muted" style="margin-bottom:4px;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Mentality</div><div class="seg">${["Defensive", "Balanced", "Attacking"].map((l, i) => `<button class="${c.ment === i ? "on" : ""}" data-a="ment" data-v="${i}">${l}</button>`).join("")}</div></div>
    <div class="kpis"><div class="kpi"><b>${Math.round(str.att)}</b><span>Attack</span></div><div class="kpi"><b>${Math.round(str.mid)}</b><span>Midfield</span></div><div class="kpi"><b>${Math.round(str.def)}</b><span>Defence</span></div></div></div>
    ${picker}
    <div class="panel"><h3>Substitutes</h3><div class="tw"><table class="t"><tbody>${benchHtml}</tbody></table></div></div>
  </div></div>`;
};
function pitchLines() {
  return `<svg class="lines" viewBox="0 0 68 90" preserveAspectRatio="none"><g fill="none" stroke="var(--pitch-line)" stroke-width=".35"><rect x="2" y="2" width="64" height="86"/><line x1="2" y1="45" x2="66" y2="45"/><circle cx="34" cy="45" r="7"/><rect x="16" y="2" width="36" height="13"/><rect x="25" y="2" width="18" height="5"/><rect x="16" y="75" width="36" height="13"/><rect x="25" y="83" width="18" height="5"/></g></svg>`;
}

PAGES.fixtures = () => {
  const c = club(G.userClub);
  const list = G.fx.filter((f) => isUserFx(f)).sort((a, b) => a.d - b.d);
  return `<div class="page-h"><div><h4>${G.season}/${(G.season + 1) % 100}</h4><h1>Fixtures &amp; results</h1></div></div>
  <div class="panel"><div class="tw"><table class="t"><thead><tr><th>Date</th><th>Competition</th><th></th><th>Opponent</th><th class="r">Score</th><th></th></tr></thead><tbody>
  ${list.map((f) => { const me = userTeamOf(f), home = f.h === me, opp = club(home ? f.a : f.h); return `<tr class="${f.p ? "click" : ""} ${f.d === G.day ? "me" : ""}" ${f.p ? `data-a="report" data-id="${f.i}"` : ""}><td class="small">${fmtDate(f.d, { wd: true })}</td><td class="small"><b>${esc(compShort(f.c))}</b> <span class="muted hide-sm">${esc(f.s || "")}</span></td><td>${f.n ? "N" : home ? "H" : "A"}</td><td>${clubName(opp)}</td><td class="r"><b>${scoreText(f)}</b></td><td>${resChip(f, me)}</td></tr>`; }).join("") || `<tr><td colspan="6" class="empty">No fixtures.</td></tr>`}
  </tbody></table></div></div>`;
};

// competitions
function zonesFor(lg, i, n) {
  if (lg.tier === 1) {
    const u = (EURO_SLOTS.UCL[lg.id] || EURO_SLOTS.CAFCL[lg.id] || 0), e = (EURO_SLOTS.UEL[lg.id] || EURO_SLOTS.CAFCC[lg.id] || 0);
    if (i < u) return "ucl"; if (i < u + e) return "uel";
  }
  if (lg.up && i < lg.up) return "up";
  if (lg.down && i >= n - lg.down) return "down";
  return "";
}
function leagueTable(lg) {
  const order = sortTable(lg.table, lg.clubs);
  return `<div class="tw"><table class="t"><thead><tr><th>#</th><th>Club</th><th class="r">P</th><th class="r">W</th><th class="r">D</th><th class="r">L</th><th class="r hide-sm">GF</th><th class="r hide-sm">GA</th><th class="r">GD</th><th class="r">Pts</th><th class="hide-sm">Form</th></tr></thead><tbody>
  ${order.map((cid, i) => { const t = lg.table[cid]; return `<tr class="click ${cid === G.userClub ? "me" : ""}" data-a="clubView" data-id="${cid}"><td class="zone ${zonesFor(lg, i, order.length)}">${i + 1}</td><td>${clubName(club(cid))}</td><td class="r">${t[0]}</td><td class="r">${t[1]}</td><td class="r">${t[2]}</td><td class="r">${t[3]}</td><td class="r hide-sm">${t[4]}</td><td class="r hide-sm">${t[5]}</td><td class="r">${t[4] - t[5]}</td><td class="r"><b>${t[6]}</b></td><td class="hide-sm"><span class="formdots">${formOf(cid, lg.id)}</span></td></tr>`; }).join("")}
  </tbody></table></div>`;
}
function fixtureRows(list) {
  return list.map((f) => `<tr class="${f.p ? "click" : ""}" ${f.p ? `data-a="report" data-id="${f.i}"` : ""}><td class="small muted">${fmtDate(f.d)}</td><td class="r">${esc(club(f.h).name)} ${crest(club(f.h), 18)}</td><td class="c"><b>${scoreText(f)}</b></td><td>${crest(club(f.a), 18)} ${esc(club(f.a).name)}</td></tr>`).join("");
}
function stageBlocks(cid) {
  const byStage = {};
  G.fx.filter((f) => f.c === cid && !(f.s || "").startsWith("League phase") && !(f.s || "").startsWith("Group")).forEach((f) => { const k = (f.s || "").replace(/ · (1st|2nd) leg/, ""); (byStage[k] = byStage[k] || []).push(f); });
  const keys = Object.keys(byStage).sort((a, b) => byStage[b][0].d - byStage[a][0].d);
  return keys.map((k) => `<div class="panel"><h3>${esc(k)}</h3><div class="tw"><table class="t"><tbody>${fixtureRows(byStage[k].sort((a, b) => a.d - b.d))}</tbody></table></div></div>`).join("") || `<div class="panel empty">The knockout rounds haven't been drawn yet.</div>`;
}
function topScorers(clubIds, field = "lg", n = 10) {
  const set = new Set(clubIds);
  return Object.values(G.players).filter((p) => set.has(p.club) && p.st[field] > 0).sort((a, b) => b.st[field] - a.st[field] || a.st.ap - b.st.ap).slice(0, n);
}
PAGES.comps = () => {
  const tab = UI.comp.tab || "league";
  const c = club(G.userClub);
  const tabs = `<div class="seg">${[["league", "Leagues"], ["cup", "Cups"], ["cont", "Continental"], ["intl", "International"], ["hist", "History"]].map(([k, l]) => `<button class="${tab === k ? "on" : ""}" data-a="compTab" data-v="${k}">${l}</button>`).join("")}</div>`;
  let body = "";
  if (tab === "league") {
    const lid = UI.comp.lg || c.lg, lg = G.leagues[lid];
    const lgFx = G.fx.filter((f) => f.c === lid);
    const lastDay = Math.max(-1, ...lgFx.filter((f) => f.p).map((f) => f.d));
    const nextDay = Math.min(1e9, ...lgFx.filter((f) => !f.p).map((f) => f.d));
    const sc = topScorers(lg.clubs);
    body = `<div class="panel" style="margin-bottom:16px"><select data-c="compLg" aria-label="League">${Object.values(G.leagues).map((l) => `<option value="${l.id}" ${l.id === lid ? "selected" : ""}>${esc(l.country)} — ${esc(l.name)}</option>`).join("")}</select></div>
    <div class="grid g21"><div class="panel">${leagueTable(lg)}<p class="small muted" style="margin:10px 0 0"><span class="chip" style="border-left:3px solid var(--info)">Continental top</span> <span class="chip" style="border-left:3px solid var(--warn)">Second-tier continental</span> <span class="chip" style="border-left:3px solid var(--win)">Promotion</span> <span class="chip" style="border-left:3px solid var(--loss)">Relegation</span></p></div>
    <div class="stack" style="gap:16px"><div class="panel"><h3>Top scorers</h3>${sc.length ? `<table class="t"><tbody>${sc.map((p, i) => `<tr class="click" data-a="player" data-id="${p.id}"><td>${i + 1}</td><td><div class="pcell">${faceHTML(p, 24)}<span class="nm">${esc(shortName(p))}</span></div></td><td>${crest(club(p.club), 18)}</td><td class="r"><b>${p.st.lg}</b></td></tr>`).join("")}</tbody></table>` : `<div class="empty">No goals yet.</div>`}</div>
    ${lastDay >= 0 ? `<div class="panel"><h3>Latest results</h3><div class="tw"><table class="t"><tbody>${fixtureRows(lgFx.filter((f) => f.d === lastDay))}</tbody></table></div></div>` : ""}
    ${nextDay < 1e9 ? `<div class="panel"><h3>Next up · ${fmtDate(nextDay, { wd: true })}</h3><div class="tw"><table class="t"><tbody>${fixtureRows(lgFx.filter((f) => f.d === nextDay))}</tbody></table></div></div>` : ""}</div></div>`;
  } else if (tab === "cup") {
    const cups = Object.values(G.comps).filter((x) => x.type === "cup");
    const cid = UI.comp.cup || ("CUP_" + c.country.replace(/\W/g, ""));
    const cup = G.comps[cid];
    body = `<div class="panel row" style="margin-bottom:16px"><select data-c="compCup" aria-label="Cup">${cups.map((x) => `<option value="${x.id}" ${x.id === cid ? "selected" : ""}>${esc(x.country)} — ${esc(x.name)}</option>`).join("")}</select>${cup.done ? `<span class="chip gold">Winner: ${esc(club(cup.winner).name)}</span>` : `<span class="chip">${esc((cup.stages[cup.si] || {}).name || "")}</span>`}</div><div class="grid g2">${stageBlocks(cid)}</div>`;
  } else if (tab === "intl") {
    const tour = TOURNEYS.map((k) => G.comps[k]).find(Boolean);
    const ranked = Object.values(G.nations).filter((n) => ntEligible(n.id)).sort((a, b) => b.rep - a.rep);
    const next = (() => { const Y = G.season + 1; return ["Euro " + Y, "Club World Cup " + Y, "World Cup " + Y, "Africa Cup of Nations " + Y][Y % 4]; })();
    const intl = G.fx.filter((f) => f.c === "INTL" && f.p).sort((a, b) => b.d - a.d).slice(0, 24);
    const myNat = G.mode === "career" ? pl(G.userPlayer) && pl(G.userPlayer).nat : null;
    let tb = "";
    if (tour) {
      tb = `<div class="panel" style="margin-bottom:16px"><div class="panel-h"><h3>${esc(tour.name)}</h3>${tour.done ? `<span class="chip gold">Winner: ${esc(club(tour.winner).name)}</span>` : `<span class="chip">Starts ${fmtDate(tour.gDays[0], { wd: true })}</span>`}</div>
      <div class="grid g3">${tour.groups.map((g, gi) => { const o = sortTable(tour.table, g); return `<div><h4>Group ${"ABCDEFGH"[gi]}</h4><table class="t"><tbody>${o.map((id, i) => { const t = tour.table[id]; return `<tr class="click ${id === myNat || id === G.userClub ? "me" : ""}" data-a="clubView" data-id="${id}"><td class="zone ${i < 2 ? "up" : ""}">${i + 1}</td><td>${clubName(club(id))}</td><td class="r">${t[0]}</td><td class="r"><b>${t[6]}</b></td></tr>`; }).join("")}</tbody></table></div>`; }).join("")}</div></div>
      <h3 style="margin-bottom:10px">Knockout rounds</h3><div class="grid g2" style="margin-bottom:16px">${stageBlocks(tour.id)}</div>`;
    }
    body = `${tb}<div class="grid g21"><div class="panel"><div class="panel-h"><h3>Nation rankings</h3><span class="small muted">This summer: ${esc(tour ? tour.name : next)}</span></div><div class="tw"><table class="t"><thead><tr><th>#</th><th>Nation</th><th class="r">Strength</th><th class="r">Players</th></tr></thead><tbody>${ranked.map((n, i) => `<tr class="click ${n.id === myNat ? "me" : ""}" data-a="clubView" data-id="${n.id}"><td>${i + 1}</td><td>${clubName(n)}</td><td class="r"><b>${n.rep}</b></td><td class="r">${n.pool}</td></tr>`).join("")}</tbody></table></div></div>
    <div class="panel"><h3>Latest international results</h3>${intl.length ? `<div class="tw"><table class="t"><tbody>${fixtureRows(intl)}</tbody></table></div>` : `<div class="empty">International breaks are in September, October, November and March.</div>`}</div></div>`;
  } else if (tab === "cont") {
    const cid = UI.comp.cont || (leagueOf(c).region === "AF" ? "CAFCL" : "UCL");
    const comp = G.comps[cid];
    let main = "";
    if (comp.type === "euro") {
      const order = sortTable(comp.table, comp.teams);
      main = `<div class="panel"><h3>League phase</h3><div class="tw"><table class="t"><thead><tr><th>#</th><th>Club</th><th class="r">P</th><th class="r">W</th><th class="r">D</th><th class="r">L</th><th class="r">GD</th><th class="r">Pts</th></tr></thead><tbody>${order.map((id, i) => { const t = comp.table[id]; return `<tr class="click ${id === G.userClub ? "me" : ""}" data-a="clubView" data-id="${id}"><td class="zone ${i < 8 ? "up" : i < 24 ? "uel" : "down"}">${i + 1}</td><td>${clubName(club(id))}</td><td class="r">${t[0]}</td><td class="r">${t[1]}</td><td class="r">${t[2]}</td><td class="r">${t[3]}</td><td class="r">${t[4] - t[5]}</td><td class="r"><b>${t[6]}</b></td></tr>`; }).join("")}</tbody></table></div><p class="small muted">Top 8 go straight to the round of 16. 9th–24th play a knockout play-off.</p></div>`;
    } else {
      main = comp.groups.map((g, gi) => { const o = sortTable(comp.table, g); return `<div class="panel"><h3>Group ${"ABCD"[gi]}</h3><table class="t"><thead><tr><th>#</th><th>Club</th><th class="r">P</th><th class="r">GD</th><th class="r">Pts</th></tr></thead><tbody>${o.map((id, i) => { const t = comp.table[id]; return `<tr class="click ${id === G.userClub ? "me" : ""}" data-a="clubView" data-id="${id}"><td class="zone ${i < 2 ? "up" : ""}">${i + 1}</td><td>${clubName(club(id))}</td><td class="r">${t[0]}</td><td class="r">${t[4] - t[5]}</td><td class="r"><b>${t[6]}</b></td></tr>`; }).join("")}</tbody></table></div>`; }).join("");
      main = `<div class="grid g2">${main}</div>`;
    }
    const sc = topScorers(comp.teams, "g", 0);
    body = `<div class="panel row" style="margin-bottom:16px"><div class="seg">${["UCL", "UEL", "CAFCL", "CAFCC"].map((k) => `<button class="${cid === k ? "on" : ""}" data-a="compCont" data-v="${k}">${COMP_INFO[k].short}</button>`).join("")}</div><b>${esc(comp.name)}</b>${comp.done ? `<span class="chip gold">Winner: ${esc(club(comp.winner).name)}</span>` : ""}</div>
    <div class="stack" style="gap:16px">${main}<h3>Knockout rounds</h3><div class="grid g2">${stageBlocks(cid)}</div></div>`;
  } else {
    const H = G.hist;
    const lgRows = Object.keys(H.lg).map((id) => { const L = G.leagues[id]; const last = H.lg[id].slice(-6).reverse(); return `<tr><td><b>${esc(L.name)}</b> <span class="muted small">${esc(L.country)}</span></td><td>${last.map((x) => `<span class="small">${x.s}/${(x.s + 1) % 100}: <b>${esc(x.n)}</b></span>`).join("<br>")}</td></tr>`; }).join("");
    const cont = ["UCL", "UEL", "CAFCL", "CAFCC"].concat(TOURNEYS).map((k) => `<tr><td><b>${esc(COMP_INFO[k].name)}</b></td><td>${(H.euro[k] || []).slice(-6).reverse().map((x) => `<span class="small">${x.s}/${(x.s + 1) % 100}: <b>${esc(x.n)}</b></span>`).join("<br>") || "<span class='muted small'>—</span>"}</td></tr>`).join("");
    const cups = Object.keys(H.cup).map((k) => `<tr><td><b>${esc((G.comps[k] || {}).name || k)}</b></td><td>${H.cup[k].slice(-4).reverse().map((x) => `<span class="small">${x.s}/${(x.s + 1) % 100}: <b>${esc(x.n)}</b></span>`).join("<br>")}</td></tr>`).join("");
    const aw = H.awards.slice().reverse().map((a) => `<tr><td>${a.s}/${(a.s + 1) % 100}</td><td>${a.gb ? `${esc(a.gb.n)} <span class="muted small">${esc(a.gb.c)}</span>` : "—"}</td><td>${a.boot ? `${esc(a.boot.n)} (${a.boot.g})` : "—"}</td><td>${a.ys ? esc(a.ys.n) : "—"}</td></tr>`).join("");
    body = `<div class="grid g2"><div class="panel"><h3>League champions</h3>${lgRows ? `<div class="tw"><table class="t"><tbody>${lgRows}</tbody></table></div>` : `<div class="empty">History is written at the end of each season.</div>`}</div>
    <div class="stack" style="gap:16px"><div class="panel"><h3>Golden Ball · Golden Boot · Golden Boy</h3>${aw ? `<div class="tw"><table class="t"><thead><tr><th>Season</th><th>Golden Ball</th><th>Boot</th><th>Golden Boy</th></tr></thead><tbody>${aw}</tbody></table></div>` : `<div class="empty">No awards yet.</div>`}</div>
    <div class="panel"><h3>Continental and world winners</h3><table class="t"><tbody>${cont}</tbody></table></div>${cups ? `<div class="panel"><h3>Cup winners</h3><div class="tw"><table class="t"><tbody>${cups}</tbody></table></div></div>` : ""}</div></div>`;
  }
  return `<div class="page-h"><div><h4>${G.season}/${(G.season + 1) % 100}</h4><h1>Competitions</h1></div>${tabs}</div>${body}`;
};

// transfers & player search
function searchPlayers() {
  const t = UI.ts;
  const q = t.name.trim().toLowerCase();
  const lgClubs = t.lg && t.lg !== "FA" ? new Set(G.leagues[t.lg].clubs) : null;
  let rows = Object.values(G.players).filter((p) => {
    if (G.mode === "manager" && p.club === G.userClub) return false;
    if (t.pos && p.pos !== t.pos) return false;
    if (t.lg === "FA" && p.club >= 0) return false;
    if (lgClubs && !lgClubs.has(p.club)) return false;
    if (t.agemax && age(p) > +t.agemax) return false;
    if (t.omin && p.o < +t.omin) return false;
    if (t.vmax && p.val > +t.vmax * 1e6) return false;
    if (t.listed && !p.listed) return false;
    if (q && !fullName(p).toLowerCase().includes(q)) return false;
    return true;
  });
  return sortRows(rows, "search", { k: "o", d: -1 });
}
function playerTable(rows, key, start = 0, n = 40) {
  const page = rows.slice(start, start + n);
  return `<div class="tw"><table class="t"><thead><tr>${th(key, "name", "Player")}${th(key, "pos", "Pos")}${th(key, "age", "Age", "r")}<th>Nat</th>${th(key, "club", "Club")}${th(key, "o", "Ovr", "c")}${th(key, "pot", "Pot", "c")}${th(key, "val", "Value", "r")}${th(key, "wage", "Wage", "r")}<th></th></tr></thead><tbody>
  ${page.map((p) => `<tr class="click" data-a="player" data-id="${p.id}"><td><div class="pcell">${faceHTML(p, 26)}<span class="nm">${esc(fullName(p))}</span></div></td><td>${posTag(p.pos)}</td><td class="r">${age(p)}</td><td class="small">${p.nat}</td><td>${p.club >= 0 ? clubName(club(p.club)) : `<span class="chip">Free agent</span>`}</td><td class="c">${ovrTag(p.o)}</td><td class="c small muted">${p.pot}</td><td class="r">${money(p.val)}</td><td class="r">${money(p.wage)}</td><td>${statusChips(p)}${G.shortlist && G.shortlist.includes(p.id) ? `<span class="chip gold">★</span>` : ""}</td></tr>`).join("") || `<tr><td colspan="10" class="empty">No players match.</td></tr>`}
  </tbody></table></div>`;
}
function searchPanel() {
  const t = UI.ts;
  const rows = searchPlayers();
  const pages = Math.max(1, Math.ceil(rows.length / 40)); t.pg = clamp(t.pg, 0, pages - 1);
  return `<div class="panel stack"><div class="row">
    <input type="text" id="tsName" placeholder="Search name" value="${esc(t.name)}" data-c="ts" data-k="name" style="flex:2;min-width:160px">
    <select data-c="ts" data-k="pos" aria-label="Position"><option value="">Any position</option>${POSITIONS.map((p) => `<option ${t.pos === p ? "selected" : ""}>${p}</option>`).join("")}</select>
    <select data-c="ts" data-k="lg" aria-label="League"><option value="">All leagues</option><option value="FA" ${t.lg === "FA" ? "selected" : ""}>Free agents</option>${Object.values(G.leagues).map((l) => `<option value="${l.id}" ${t.lg === l.id ? "selected" : ""}>${esc(l.name)} (${esc(l.country)})</option>`).join("")}</select>
    <input type="number" id="tsAge" placeholder="Max age" value="${esc(t.agemax)}" data-c="ts" data-k="agemax" style="width:96px">
    <input type="number" id="tsOvr" placeholder="Min ovr" value="${esc(t.omin)}" data-c="ts" data-k="omin" style="width:96px">
    <input type="number" id="tsVal" placeholder="Max €M" value="${esc(t.vmax)}" data-c="ts" data-k="vmax" style="width:96px">
    <label class="row small" style="gap:6px"><input type="checkbox" id="tsListed" ${t.listed ? "checked" : ""} data-c="ts" data-k="listed"> Transfer-listed</label></div>
    <div class="small muted">${rows.length} players</div>${playerTable(rows, "search", t.pg * 40)}
    <div class="pager"><button class="btn sm" data-a="tsPg" data-v="-1" ${t.pg ? "" : "disabled"}>Previous</button><span class="small">Page ${t.pg + 1} of ${pages}</span><button class="btn sm" data-a="tsPg" data-v="1" ${t.pg < pages - 1 ? "" : "disabled"}>Next</button></div></div>`;
}
PAGES.world = () => `<div class="page-h"><div><h4>${Object.keys(G.players).length} players</h4><h1>Player database</h1></div></div>${searchPanel()}`;
PAGES.transfers = () => {
  const c = club(G.userClub);
  const tab = UI.comp.ttab || "search";
  const wages = squad(c.id).reduce((s, p) => s + p.wage, 0);
  const win = inWindow();
  let body = "";
  if (tab === "search") body = searchPanel();
  else if (tab === "short") { const rows = (G.shortlist || []).map(pl).filter(Boolean); body = `<div class="panel">${rows.length ? playerTable(rows, "short") : `<div class="empty">Open a player's profile and tap Shortlist to track him here.</div>`}</div>`; }
  else if (tab === "offers") { const bids = G.inbox.filter((m) => m.act && m.act.kind === "bid" && !m.done); body = `<div class="panel">${bids.map((m) => `<div class="msg" data-a="openMsg" data-id="${m.id}"><span class="dot"></span><div><div class="tt">${esc(m.t)}</div><div class="small muted">${esc(m.b)}</div></div></div>`).join("") || `<div class="empty">No offers for your players right now. Transfer-list a player to attract bids.</div>`}</div>`; }
  else if (tab === "listed") { const rows = squad(c.id).filter((p) => p.listed); body = `<div class="panel">${rows.length ? playerTable(rows, "listed") : `<div class="empty">Nobody is transfer-listed. Open a player in your squad to list him.</div>`}</div>`; }
  else { const log = (G.txlog || []).slice(0, 60); body = `<div class="panel"><div class="tw"><table class="t"><thead><tr><th>Date</th><th>Player</th><th>From</th><th>To</th><th class="r">Fee</th></tr></thead><tbody>${log.map((x) => { const p = pl(x.p); return `<tr ${p ? `class="click" data-a="player" data-id="${x.p}"` : ""}><td class="small muted">${fmtDate(x.d)} ${x.s}</td><td>${p ? esc(fullName(p)) : "Retired player"}</td><td>${x.from >= 0 ? clubName(club(x.from)) : "Free"}</td><td>${clubName(club(x.to))}</td><td class="r">${x.fee ? money(x.fee) : "Free"}</td></tr>`; }).join("") || `<tr><td colspan="5" class="empty">No deals yet.</td></tr>`}</tbody></table></div></div>`; }
  return `<div class="page-h"><div><h4>${win ? "Window open" : "Window closed · free agents only"}</h4><h1>Transfers</h1></div>
  <div class="kpis" style="min-width:min(100%,420px)"><div class="kpi"><b>${money(c.budget)}</b><span>Budget</span></div><div class="kpi"><b>${money(wages)}</b><span>Wages / wk</span></div><div class="kpi"><b>${money(c.wcap)}</b><span>Wage cap</span></div></div></div>
  <div class="seg" style="margin-bottom:14px">${[["search", "Search"], ["short", "Shortlist"], ["offers", "Offers received"], ["listed", "Transfer list"], ["log", "Latest deals"]].map(([k, l]) => `<button class="${tab === k ? "on" : ""}" data-a="tTab" data-v="${k}">${l}</button>`).join("")}</div>${body}`;
};

PAGES.club = () => {
  const c = club(G.userClub);
  const wages = squad(c.id).reduce((s, p) => s + p.wage, 0);
  const sv = squad(c.id).reduce((s, p) => s + p.val, 0);
  return `<div class="page-h"><div class="row">${crest(c, 56)}<div><h4>${esc(leagueOf(c).name)} · ${esc(c.country)}</h4><h1>${esc(c.name)}</h1></div></div><div class="row">${G.mgr.owner ? `<span class="chip gold">Owner</span>` : ""}<button class="btn" data-a="editClub">Edit club</button></div></div>
  ${G.mgr.owner ? `<div class="panel row" style="margin-bottom:16px;justify-content:space-between"><div><b>Your personal fortune: ${money(G.mgr.wealth)}</b><div class="small muted">Invest it into the club. It goes straight into the balance and the transfer budget.</div></div><div class="row">${[1e6, 5e6, 20e6].map((v) => `<button class="btn sm" data-a="ownerInvest" data-v="${v}" ${G.mgr.wealth >= v ? "" : "disabled"}>Invest ${money(v)}</button>`).join("")}</div></div>` : ""}
  <div class="grid g21"><div class="stack" style="gap:16px">
    <div class="panel"><h3>Finances</h3><div class="kpis"><div class="kpi"><b>${money(c.bal)}</b><span>Balance</span></div><div class="kpi"><b>${money(c.budget)}</b><span>Transfer budget</span></div><div class="kpi"><b>${money(c.income)}</b><span>Income / wk</span></div><div class="kpi"><b>${money(wages)}</b><span>Wages / wk</span></div><div class="kpi"><b>${money(c.wcap)}</b><span>Wage cap</span></div><div class="kpi"><b>${money(sv)}</b><span>Squad value</span></div></div>
    <p class="small muted">Income covers TV, sponsorship and commercial deals. Gate receipts, prize money and transfer fees are added on top. The board resets your transfer budget each summer from the club's balance.</p></div>
    <div class="panel"><div class="panel-h"><h3>Facilities</h3><span class="small muted">Paid from the club's balance: ${money(c.bal)}</span></div>
    <div class="stack">${Object.keys(FAC).map((k) => { const lvl = c.fac[k], cost = facCost(c, k); return `<div class="facrow"><div style="min-width:0"><b>${FAC[k][0]}</b> <span class="lvl">${"■".repeat(lvl)}<span class="muted">${"■".repeat(5 - lvl)}</span></span><div class="small muted">${FAC[k][1]} ${FAC[k][2]}.</div></div>${cost == null ? `<span class="chip gold">Top level</span>` : `<button class="btn sm ${c.bal >= cost ? "pri" : ""}" data-a="facUp" data-k="${k}">Upgrade · ${money(cost)}</button>`}</div>`; }).join("")}</div></div>
    <div class="panel"><h3>Trophy cabinet</h3>${c.trophies.length ? c.trophies.slice().reverse().map((t) => `<div class="trophy"><span class="chip gold">${t.s}/${(t.s + 1) % 100}</span><b>${esc(t.n)}</b></div>`).join("") : `<div class="empty">No trophies won in this save yet.</div>`}</div>
  </div><div class="stack" style="gap:16px">
    <div class="panel stack"><h3>The board</h3><div class="small">Expectation: <b>${esc(expectText(c))}</b></div><div class="meter"><span class="small muted">Confidence</span><div class="bar"><i style="width:${G.mgr.conf}%"></i></div><b>${Math.round(G.mgr.conf)}</b></div></div>
    <div class="panel"><h3>${esc(G.mgr.name)} · manager record</h3>${G.mgr.trophies.length ? G.mgr.trophies.slice().reverse().map((t) => `<div class="trophy"><span class="chip gold">${t.s}</span><span>${esc(t.n)} <span class="muted small">${esc(t.c)}</span></span></div>`).join("") : `<div class="small muted">No honours yet.</div>`}
    ${G.mgr.hist.length ? `<h4 style="margin-top:12px">History</h4>${G.mgr.hist.slice().reverse().map((h) => `<div class="small">${h.s}/${(h.s + 1) % 100} · ${esc(h.c)}${h.pos ? ` · ${ordinal(h.pos)} in ${esc(h.lg)}` : h.until ? ` · left ${esc(h.until)}` : ""}</div>`).join("")}` : ""}</div>
  </div></div>`;
};

PAGES.career = () => {
  const p = pl(G.userPlayer), cr = G.career, c = club(p.club >= 0 ? p.club : G.userClub);
  const attrs = p.pos === "GK" ? [6, 2, 5, 0] : [0, 1, 2, 3, 4, 5];
  const hist = p.hist.slice().reverse();
  return `<div class="page-h"><div class="row">${faceHTML(p, 76)}<div><h4>${posTag(p.pos)} · age ${age(p)} · ${esc(NATIONS[p.nat] ? NATIONS[p.nat][0] : p.nat)}</h4><h1>${esc(fullName(p))}</h1><div class="row small">${crest(c, 20)} ${esc(c.name)}${cr.retired ? " · retired" : ` · ${money(p.wage)}/wk until ${p.ce + 1}`} · ${p.caps || 0} caps, ${p.ig || 0} international goals</div></div></div>
  <div class="row"><button class="btn" data-a="player" data-id="${p.id}">Full profile</button><button class="btn" data-a="editPlayer" data-id="${p.id}">Edit look</button></div></div>
  ${careerStatus(p, cr)}
  ${cr.retired ? afterCareerPanel() + legacyPanel() : ""}
  ${cr.legacy && cr.legacy.length ? `<div class="panel" style="margin-bottom:16px"><h3>Family legacy</h3>${cr.legacy.map((g) => `<div class="trophy"><span class="chip gold">${g.s0}–${esc(String(g.s1).slice(0, 4))}</span><span><b>${esc(g.n)}</b> <span class="small muted">${g.apps} apps · ${g.goals} goals · ${g.caps} caps · peak ${g.peak} · ${g.trophies} trophies</span></span></div>`).join("")}</div>` : ""}
  <div class="grid g21"><div class="stack" style="gap:16px">
    <div class="panel"><div class="panel-h"><h3>Attributes</h3><div class="row">${ovrTag(p.o)}<span class="small muted">Potential ${p.pot} ${G.mode === "career" && p.id === G.userPlayer ? `<b title="${esc(potTrend().text)}">${potTrend().arrow}</b>` : ""}</span></div></div><div class="stack" style="gap:6px">${attrs.map((i) => attrRow(p, i)).join("")}</div></div>
    ${cr.retired ? "" : trainingPanel(p, cr, attrs)}
    <div class="panel"><h3>Career history</h3><div class="tw"><table class="t"><thead><tr><th>Season</th><th>Club</th><th class="r">Apps</th><th class="r">Gls</th><th class="r">Ast</th><th class="r">Avg</th><th class="r">Ovr</th></tr></thead><tbody>
      <tr class="me"><td>${G.season}/${(G.season + 1) % 100}</td><td>${esc(c.name)}</td><td class="r">${p.st.ap}</td><td class="r">${p.st.g}</td><td class="r">${p.st.as}</td><td class="r">${p.st.ap ? (p.st.rs / p.st.ap).toFixed(2) : "–"}</td><td class="r">${p.o}</td></tr>
      ${hist.map((h) => `<tr><td>${h.s}/${(h.s + 1) % 100}</td><td>${esc(h.cn)}</td><td class="r">${h.ap}</td><td class="r">${h.g}</td><td class="r">${h.as}</td><td class="r">${h.r}</td><td class="r">${h.o}</td></tr>`).join("")}</tbody></table></div>
      <div class="kpis" style="margin-top:12px"><div class="kpi"><b>${hist.reduce((s, h) => s + h.ap, 0) + p.st.ap}</b><span>Career apps</span></div><div class="kpi"><b>${hist.reduce((s, h) => s + h.g, 0) + p.st.g}</b><span>Career goals</span></div><div class="kpi"><b>${hist.reduce((s, h) => s + h.as, 0) + p.st.as}</b><span>Career assists</span></div></div></div>
  </div><div class="stack" style="gap:16px">
    ${cr.retired ? "" : (() => {
      const t = cr.trust == null ? 50 : cr.trust, ag = agentOf(), L = cr.life;
      const promise = cr.promise && cr.promise > absDay();
      return `<div class="panel stack"><h3>Your manager</h3><div class="meter"><span class="small muted" style="width:56px">Trust</span><div class="bar"><i style="width:${t}%;background:${t < 35 ? "var(--loss)" : t < 60 ? "var(--warn)" : "var(--win)"}"></i></div><b class="small">${Math.round(t)}</b></div>
      <div class="small muted">${promise ? "He's promised you more playing time. " : ""}${cr.captain === p.club ? "You're the club captain. " : ""}Higher trust means more starts. Good form builds it; complaining and transfer requests damage it. You can talk to him once every two weeks.</div>
      ${UI.talkRes ? `<div class="moment done">${esc(UI.talkRes)}</div>` : ""}
      <div class="row"><button class="btn" data-a="mgrTalk" data-k="time">Ask for more playing time</button><button class="btn" data-a="mgrTalk" data-k="feedback">Ask for feedback</button><button class="btn" data-a="mgrTalk" data-k="complain">Complain about being dropped</button><button class="btn" data-a="mgrTalk" data-k="captain">Ask to be captain</button></div>
      <div class="row"><select id="posReq" aria-label="Position">${POS_NEAR[p.pos].filter((x) => x !== "GK").map((x) => `<option>${x}</option>`).join("")}</select><button class="btn" data-a="mgrTalk" data-k="position" ${POS_NEAR[p.pos].length ? "" : "disabled"}>Ask to play there</button></div>
      <h4 style="margin-top:6px">Club</h4><div class="row"><button class="btn" data-a="creq" data-v="list" ${p.loan ? "disabled" : ""}>${p.listed ? "Withdraw transfer request" : "Hand in a transfer request"}</button><button class="btn" data-a="creq" data-v="contract" ${p.loan ? "disabled" : ""}>Ask for a new contract</button><button class="btn" data-a="creq" data-v="loan" ${p.loan ? "disabled" : ""}>${p.loan ? "On loan from " + esc(club(p.loan.from).name) : "Ask to go out on loan"}</button></div>
      <p class="small muted" style="margin:0">Clubs only come in for you every couple of seasons, unless you hand in a transfer request or your agent goes looking.</p></div>
      <div class="panel stack"><div class="panel-h"><h3>Agent</h3><span class="chip ${ag.id ? "gold" : ""}">${esc(ag.n)}</span></div>
      ${ag.id ? `<div class="small">${esc(ag.d)} Fee: ${Math.round(ag.fee * 100)}% of wages. Better wages (+${Math.round(ag.wage * 100)}%), more offers, bigger boot deals.</div><div class="row"><button class="btn" data-a="agentAct" data-k="search">${cr.agentSearch ? "Stop looking for a move" : "Find me a new club"}</button><button class="btn" data-a="agentAct" data-k="contract">Negotiate a new contract</button></div>` : `<div class="small muted">An agent negotiates better wages, brings more transfer offers and bigger sponsorship deals, for a cut of your wages.</div>`}
      <div class="stack" style="gap:6px">${AGENTS.filter((a) => a.id && a.id !== ag.id).map((a) => `<div class="facrow"><div><b>${esc(a.n)}</b><div class="small muted">${esc(a.d)} ${Math.round(a.fee * 100)}% fee${a.fame ? ` · needs fame ${a.fame}` : ""}</div></div><button class="btn sm ${L.fame >= a.fame ? "pri" : ""}" data-a="signAgent" data-v="${a.id}" ${L.fame >= a.fame ? "" : "disabled"}>Sign</button></div>`).join("")}${ag.id ? `<button class="btn sm danger" data-a="signAgent" data-v="0">Leave your agent</button>` : ""}</div></div>
      <div class="panel"><button class="btn danger" data-a="retireAsk">Retire from football</button></div>`;
    })()}
    <div class="panel"><h3>Trophies &amp; awards</h3>${cr.trophies.concat(cr.awards.map((a) => ({ ...a, c: "Individual award" }))).sort((a, b) => b.s - a.s).map((t) => `<div class="trophy"><span class="chip gold">${t.s}</span><span><b>${esc(t.n)}</b> <span class="small muted">${esc(t.c)}</span></span></div>`).join("") || `<div class="empty">Your first medal is out there.</div>`}</div>
  </div></div>`;
};
function kidRow(k, i) {
  const a = kidAge(k), schools = schoolList(), sc = schoolOf(k);
  const fbText = k.g !== "boy" ? KID_JOBS[(k.name.length + k.by) % KID_JOBS.length] : k.fb ? `future footballer ${"★".repeat(clamp(Math.round((k.pot - 55) / 8), 1, 5))}` : a < 4 ? "too young to tell" : k.train ? "training, not hooked yet" : KID_JOBS[(k.name.length + k.by) % KID_JOBS.length];
  return `<div class="kid"><div class="row" style="gap:8px"><input type="text" id="kidName${i}" value="${esc(k.name)}" aria-label="Child's name" style="width:130px"><button class="btn sm" data-a="renameKid" data-i="${i}">Save name</button><span class="small muted">${k.g === "boy" ? "Son" : "Daughter"} · age ${a} · ${esc(fbText)}</span></div>
  ${a >= 4 && a <= 17 ? `<div class="row" style="margin-top:6px"><label class="small muted" for="school${i}" style="width:54px">School</label><select id="school${i}" data-c="kidSchool" data-i="${i}" style="flex:1;min-width:200px"><option value="">Choose a school</option>${schools.map((s) => `<option value="${s.id}" ${k.school === s.id ? "selected" : ""}>${esc(s.n)}${s.fee ? ` · about ${money(s.fee)}/yr` : " · free"}</option>`).join("")}</select></div>${sc ? `<div class="small muted" style="margin-left:62px">${esc(sc.d)}</div>` : ""}` : ""}
  ${k.g === "boy" && a >= 4 && a <= 15 ? `<div class="row" style="margin-top:6px"><label class="small muted" for="train${i}" style="width:54px">Football</label><select id="train${i}" data-c="kidTrain" data-i="${i}" style="flex:1;min-width:200px">${TRAINING.map((t) => `<option value="${t.id}" ${(k.train || 0) === t.id ? "selected" : ""}>${esc(t.n)}${t.wk ? ` · ${money(t.wk)}/wk` : ""}</option>`).join("")}</select></div>` : ""}</div>`;
}
function brandBadge(id) { const b = BRAND_BY[id]; return `<span class="brand" style="background:${b.bg};color:${b.fg}">${esc(b.n)}</span>`; }
function careerStatus(p, cr) {
  const rp = cr.rep == null ? 50 : cr.rep, dc = cr.disc || 0;
  const goals = cr.goals && cr.goals.s === G.season && !cr.retired ? cr.goals.list.map((gl) => { const [v, t] = goalProgress(gl); const pct = clamp(Math.round((v / t) * 100), 0, 100); return `<div><div class="row" style="justify-content:space-between"><span class="small">${v >= t ? "✅ " : ""}${esc(gl.n)}</span><b class="small">${v} / ${t}</b></div><div class="bar"><i style="width:${pct}%;background:${v >= t ? "var(--win)" : "var(--accent)"}"></i></div></div>`; }).join("") : "";
  const press = (cr.press || []).slice(0, 5).map((h) => `<div class="headline"><span class="small muted">${fmtDate(h.d, { season: h.s })} ${h.s}</span><b>${esc(h.t)}</b></div>`).join("");
  return `${cr.fa && !cr.retired ? `<div class="moment" style="margin-bottom:16px"><b>You're a free agent.</b> Your last club sacked you. Offers from smaller clubs arrive in your inbox, and free agents can sign at any time. Keep your nose clean.</div>` : ""}
  <div class="grid g3" style="margin-bottom:16px">
    <div class="panel stack"><h4>Public image</h4><div class="meter"><div class="bar"><i style="width:${rp}%;background:${rp < 30 ? "var(--loss)" : rp < 50 ? "var(--warn)" : "var(--win)"}"></i></div><b class="small">${repWord(rp)}</b></div><p class="small muted" style="margin:0">Charity, good form and humble interviews help. Scandals, fights and explosive press conferences hurt. Sponsors and big clubs care about it.</p></div>
    <div class="panel stack"><h4>Discipline</h4><div class="meter"><div class="bar"><i style="width:${dc}%;background:${dc >= 60 ? "var(--loss)" : dc >= 40 ? "var(--warn)" : "var(--win)"}"></i></div><b class="small">${discWord(dc)}</b></div><p class="small muted" style="margin:0">Partying, fights, rows with the manager and scandals add up. At 40 you get a warning, at 60 a fine, and at 80 the club terminates your contract.</p></div>
    <div class="panel stack"><h4>Season goals</h4>${goals || `<div class="small muted">Goals are set at the start of each season.</div>`}</div>
  </div>
  ${press ? `<div class="panel" style="margin-bottom:16px"><h3>Headlines</h3><div class="stack" style="gap:6px">${press}</div></div>` : ""}`;
}
function afterCareerPanel() {
  const cr = G.career, L = cr.life;
  cr.jobOffers = cr.jobOffers && cr.jobOffers.length ? cr.jobOffers : managerJobsForLegend();
  const buy = G.clubs.map((c) => ({ c, price: clubPrice(c) })).filter((x) => x.price <= L.cash).sort((a, b) => b.c.rep - a.c.rep).slice(0, 5);
  const cheapest = G.clubs.map((c) => clubPrice(c)).sort((a, b) => a - b)[0];
  return `<div class="panel stack" style="margin-bottom:16px"><h3>Life after football</h3>
  ${cr.pundit ? `<div class="small"><span class="chip gold">TV pundit</span> You earn ${money(cr.pundit.wk)} a week in the studio. Press Continue to keep living your life.</div>` : `<div class="facrow"><div><b>Become a TV pundit</b><div class="small muted">A weekly studio wage based on your fame, and your life carries on.</div></div><button class="btn sm pri" data-a="goPundit">Take the job</button></div>`}
  <div><b>Become a manager</b><div class="small muted" style="margin-bottom:6px">These clubs want a big name in the dugout. The save switches to manager mode.</div>${cr.jobOffers.map((id) => { const c = club(id); return `<div class="facrow"><div class="row">${crest(c, 26)}<div><b>${esc(c.name)}</b><div class="small muted">${esc(leagueOf(c).name)} · ${stars(c.rep)}</div></div></div><button class="btn sm" data-a="goManager" data-v="${id}">Accept</button></div>`; }).join("")}</div>
  <div><b>Buy a club</b><div class="small muted" style="margin-bottom:6px">You'd be the owner and the manager, and nobody can sack you. You have ${money(L.cash)}.</div>${buy.length ? buy.map(({ c, price }) => `<div class="facrow"><div class="row">${crest(c, 26)}<div><b>${esc(c.name)}</b><div class="small muted">${esc(leagueOf(c).name)} · ${stars(c.rep)}</div></div></div><button class="btn sm" data-a="buyClub" data-v="${c.id}">Buy · ${money(price)}</button></div>`).join("") : `<div class="small muted">The cheapest club costs about ${money(cheapest)}.</div>`}</div></div>`;
}
function trainingPanel(p, cr, attrs) {
  const plan = trainPlan(), t = traitOf(), tr = potTrend();
  const sess = SESSIONS.filter((s) => (p.pos === "GK" ? s.id !== "finish" : s.id !== "keep"));
  return `<div class="panel stack"><div class="panel-h"><h3>Training</h3><span class="small muted">Last week's work: <b>${cr.lastXP != null ? cr.lastXP : "–"}</b> (normal training ≈ 0.85)</span></div>
  ${t ? `<div class="row"><span class="chip gold">${esc(t.n)}</span><span class="small muted">${esc(t.d)}</span></div>` : `<div class="moment"><b>Choose your playstyle trait</b><div class="traits" style="margin-top:8px">${traitsFor(p.pos).map(([k, x]) => `<button class="trait" data-a="pickTrait" data-v="${k}"><b>${esc(x.n)}</b><span class="small muted">${esc(x.d)}</span></button>`).join("")}</div></div>`}
  <div><div class="small muted" style="margin-bottom:4px;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Intensity</div><div class="seg">${INTENSITY.map((x, i) => `<button class="${plan.int === i ? "on" : ""}" data-a="trainInt" data-v="${i}">${x.n}</button>`).join("")}</div> <span class="small muted">${esc(INTENSITY[plan.int].d)}</span></div>
  <div><div class="small muted" style="margin-bottom:4px;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Extra sessions (each uses one free-time slot)</div><div class="row" style="gap:6px">${sess.map((s) => `<button class="btn sm ${plan.extra.includes(s.id) ? "pri" : ""}" data-a="trainSess" data-v="${s.id}">${esc(s.n)}</button>`).join("")}</div></div>
  <div><div class="small muted" style="margin-bottom:4px;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Main focus</div><div class="seg">${attrs.map((i) => `<button class="${cr.tf === i ? "on" : ""}" data-a="train" data-v="${i}">${ATTRS[i]}</button>`).join("")}</div></div>
  <div class="small"><b>Potential ${p.pot} ${tr.arrow}</b> <span class="muted">${esc(tr.text)}</span></div>
  <p class="small muted" style="margin:0">Nothing comes for free. Your growth depends on training intensity, extra sessions, match minutes and form. Your potential is reviewed every month: hard work, regular football and a settled life push it up; laziness, nights out, no minutes and long injuries pull it down.</p></div>`;
}
function legacyPanel() {
  const L = G.career.life, all = L.kids.map((k, i) => ({ ...k, i })), sons = all.filter((k) => k.g === "boy" && k.fb);
  const others = all.filter((k) => !(k.g === "boy" && k.fb));
  return `<div class="panel" style="margin-bottom:16px"><h3>Retired in ${esc(G.career.retired)}</h3>
  ${sons.length ? `<p style="margin:6px 0 12px">Carry on the family name with one of your sons. He starts at 16 in an academy, with his own potential.</p><div class="stack">${sons.map((k) => { const n = seasonsUntil16(k); return `<div class="savecard"><span class="face" style="width:44px;height:44px">${faceSVG([pl(G.userPlayer).face[0], 2, "dark", 0, 1, 0, 1, 0], "#136f43", "#fff")}</span><div><b>${esc(k.name)}</b><div class="small muted">Age ${G.season - k.by} · football talent ${"★".repeat(clamp(Math.round((k.pot - 55) / 8), 1, 5))}</div></div>${n ? `<button class="btn pri sm" data-a="legacySkip" data-i="${k.i}">Skip ${n} season${n > 1 ? "s" : ""}</button>` : `<button class="btn pri sm" data-a="legacyStart" data-i="${k.i}">Play as ${esc(k.name)}</button>`}</div>`; }).join("")}</div>` : `<p style="margin:6px 0 0">None of your children want to be footballers, so the story ends here. Your record stays, and you can start a new career from the menu.</p>`}
  ${others.length ? `<div class="small muted" style="margin-top:10px">${others.map((k) => `${esc(k.name)} ${KID_JOBS[(k.name.length + k.by) % KID_JOBS.length]}.`).join(" ")}</div>` : ""}</div>`;
}
function attrRow(p, i) { const v = p.a[i]; return `<div class="attr"><span>${ATTRS[i]}</span><div class="bar"><i style="width:${v}%;background:${ovrBg(v)}"></i></div><span class="num r">${Math.round(v)}</span></div>`; }

PAGES.life = () => {
  if (G.mode !== "career") return PAGES.home();
  const L = G.career.life, p = pl(G.userPlayer);
  const income = (G.career.retired ? 0 : Math.round(p.wage * (0.55 - agentOf().fee))) + (L.spons ? Math.round(L.spons.wk * 0.7) : 0);
  const upkeep = L.items.reduce((s, id) => s + SHOP_BY[id].up, 0) + kidCosts(L);
  const statusText = { single: "Single", dating: `Dating ${L.partner}`, engaged: `Engaged to ${L.partner}`, married: `Married to ${L.partner}` }[L.status];
  const act = (k, label, v = "", extra = "") => `<button class="btn" data-a="life" data-k="${k}" data-v="${v}" ${L.ap <= 0 && !["breakup"].includes(k) ? "disabled" : ""}>${label}${extra ? ` <span class="small muted">${extra}</span>` : ""}</button>`;
  const cats = ["Cars", "Homes", "Luxury", "Staff"];
  const shop = cats.map((cat) => `<div class="panel"><h3>${cat}</h3><div class="stack" style="gap:8px">${SHOP.filter((x) => x.cat === cat).map((x) => { const own = L.items.includes(x.id); return `<div class="facrow"><div style="min-width:0"><b>${esc(x.n)}</b><div class="small muted">${x.price ? money(x.price) : "No fee"}${x.up ? ` · ${money(x.up)}/wk upkeep` : ""}${x.fx ? ` · ${esc(x.fx)}` : ` · +${x.h} happiness`}</div></div>${own ? `<button class="btn sm" data-a="life" data-k="sell" data-v="${x.id}">${x.price ? `Sell · ${money(Math.round(x.price * (x.keep ? 1 : 0.6)))}` : "Let go"}</button>` : `<button class="btn sm ${L.cash >= x.price ? "pri" : ""}" data-a="life" data-k="buy" data-v="${x.id}" ${L.cash >= x.price ? "" : "disabled"}>${x.price ? "Buy" : "Hire"}</button>`}</div>`; }).join("")}</div></div>`).join("");
  return `<div class="page-h"><div><h4>Off the pitch</h4><h1>Life</h1></div><span class="chip ${L.ap ? "" : "sus"}">Free time this week: ${L.ap}/3</span></div>
  <div class="panel" style="margin-bottom:16px"><div class="kpis"><div class="kpi"><b>${money(L.cash)}</b><span>Bank balance</span></div><div class="kpi"><b>${money(income)}</b><span>Take-home / wk</span></div><div class="kpi"><b>${money(upkeep)}</b><span>Upkeep / wk</span></div><div class="kpi"><b>${L.happy}</b><span>Happiness</span></div><div class="kpi"><b>${Math.round(L.fame)}</b><span>Fame</span></div></div>
  <div class="meter" style="margin-top:12px"><span class="small muted" style="width:76px">Happiness</span><div class="bar"><i style="width:${L.happy}%;background:${L.happy < 40 ? "var(--loss)" : L.happy < 60 ? "var(--warn)" : "var(--win)"}"></i></div></div>
  <p class="small muted" style="margin:8px 0 0">You keep 55% of your wage after tax, minus your agent's cut, plus your boot deal. Happiness feeds your morale on the pitch, and fame makes it easier to meet people. Each life action uses some of your free time, which resets every week.</p></div>
  <div class="grid g2" style="margin-bottom:16px"><div class="panel stack"><h3>Love life</h3><div><b>${esc(statusText)}</b>${L.partner && personalityOf(L) ? `<div class="small" style="margin-top:4px"><span class="chip">${esc(personalityOf(L).n)}</span> <span class="muted">${esc(personalityOf(L).d)}</span></div>` : ""}${L.partner && L.status !== "married" ? `<div class="meter" style="margin-top:6px"><span class="small muted" style="width:76px">Relationship</span><div class="bar"><i style="width:${L.rel}%"></i></div></div>` : ""}
    ${L.partner ? `<div class="meter" style="margin-top:6px"><span class="small muted" style="width:76px">Her mood</span><div class="bar"><i style="width:${L.pm}%;background:${L.pm < 35 ? "var(--loss)" : L.pm < 55 ? "var(--warn)" : "var(--win)"}"></i></div><b class="small">${moodWord(L.pm)}</b></div>${L.pmWhy ? `<div class="small muted" style="margin-top:4px">${esc(L.pmWhy)}</div>` : ""}` : ""}${L.due != null ? `<div class="small" style="margin-top:6px">A baby is on the way.</div>` : ""}</div>
    <div class="row">${DATES.map(([k, l, c]) => act("date", l, k, money(c))).join("")}</div>
    <div class="row">${L.status === "dating" ? act("propose", "Propose", "", "ring €30K") : ""}${L.status === "engaged" ? act("wedding", "Small wedding", "small", "€90K") + act("wedding", "Big wedding", "big", "€900K") : ""}${L.status === "married" ? act("baby", "Try for a baby") + act("family", "Family day") : ""}${L.status === "dating" || L.status === "engaged" ? `<button class="btn danger" data-a="life" data-k="breakup">Break up</button>` : ""}</div>
    ${L.partner ? `<div class="row">${act("talk", "Talk to her")}${act("gift", "Flowers", "small", "€5K")}${act("gift", "Jewellery", "big", "€50K")}</div><p class="small muted" style="margin:0">She cares about money. Reckless spending, nights out and being broke upset her. If you go broke for three weeks, she leaves.</p>` : ""}</div>
  <div class="panel stack"><h3>Free time</h3><div class="row">${act("night", "Night out with teammates", "", "€3K")}${act("charity", "Donate to charity", "", "€100K")}${L.kids.length && L.status !== "married" ? act("family", "Time with the kids") : ""}</div>
  <h4 style="margin-top:6px">Children</h4>${L.kids.length ? L.kids.map((k, i) => kidRow(k, i)).join("") : `<div class="small muted">No children yet. Not every child takes after you, but a son who trains from an early age can become a footballer and carry on your career when you retire.</div>`}</div></div>
  <div class="panel" style="margin-bottom:16px"><div class="panel-h"><h3>Boot deal</h3>${L.spons ? brandBadge(L.spons.brand) : ""}</div>${L.spons ? `<div class="small">${money(L.spons.wk)} a week (you keep 70% after tax) until the end of ${L.spons.until}/${(L.spons.until + 1) % 100}.</div>` : `<div class="small muted">No sponsor yet. Brands come calling as your rating and fame grow, and a good agent gets you bigger deals. Offers arrive in your inbox.</div>`}
  <div class="row" style="margin-top:10px">${BRANDS.map((b) => brandBadge(b.id)).join("")}</div></div>
  <h3 style="margin-bottom:10px">Spend your money</h3><div class="grid g2">${shop}</div>`;
};
PAGES.phone = () => {
  const head = `<div class="page-h"><div><h4>Friends &amp; chat</h4><h1>Phone</h1></div>${G.online && G.online.code ? `<div class="row"><span class="small muted">Your friend code</span><span class="code">${esc(G.online.code)}</span><button class="btn sm" data-a="copyCode">Copy</button></div>` : ""}</div>`;
  if (!Online.available()) return head + `<div class="panel empty">The phone works on the website version of Touchline. It isn't available inside claude.ai.</div>`;
  if (Online.state === "error") return head + `<div class="panel stack"><b>Can't connect</b><div class="small">${esc(Online.err)}</div><div><button class="btn pri" data-a="phoneRetry">Try again</button></div></div>`;
  if (Online.state !== "ready" || !G.online || !G.online.code) { if (Online.state === "off") setTimeout(() => Online.connect(), 0); return head + `<div class="panel empty">Connecting…</div>`; }
  const fr = G.online.friends;
  const card = (code) => {
    const p = Online.profiles[code];
    if (p === undefined) return `<div class="facrow"><span class="small muted">Loading ${esc(code)}…</span></div>`;
    if (p === null) return `<div class="facrow"><div><b>${esc(code)}</b><div class="small muted">This player no longer exists.</div></div><button class="btn sm danger" data-a="phoneRemove" data-v="${esc(code)}">Remove</button></div>`;
    const n = Online.unread(code);
    const pic = p.face ? `<span class="face" style="width:44px;height:44px">${faceSVG(p.face, p.c1 || "#7d847f", p.c2 || "#fff")}</span>` : crest({ id: 0, c1: p.c1 || "#136f43", c2: p.c2 || "#fff", short: p.short || "?" }, 36);
    const stats = p.mode === "career" ? `${esc(p.pos || "")} · ${p.ovr || "?"} ovr · age ${p.age || "?"} · ${p.goals || 0} goals in ${p.apps || 0} games${p.caps ? ` · ${p.caps} caps` : ""}${p.retired ? " · retired" : ""}` : `Manager · ${p.trophies || 0} trophies`;
    return `<button class="friend ${Online.open === code ? "on" : ""}" data-a="phoneOpen" data-v="${esc(code)}">${pic}<span style="min-width:0;flex:1;text-align:left"><b>${esc(p.name)}</b>${n ? ` <span class="badge-n" style="position:static">${n}</span>` : ""}<br><span class="small muted">${esc(p.club)} · ${esc(p.league || "")} · ${p.season}/${(p.season + 1) % 100}</span><br><span class="small muted">${stats}</span></span></button>`;
  };
  let chat;
  if (Online.open && fr.includes(Online.open)) {
    const code = Online.open, p = Online.profiles[code] || { name: code }, msgs = Online.chats[Online.pair(code)] || [];
    Online.markRead(code);
    chat = `<div class="panel chat"><div class="panel-h"><div class="row"><button class="btn sm" data-a="phoneBack">‹ Back</button><b>${esc(p.name)}</b><span class="small muted">${esc(p.club || "")}</span></div><div class="row"><span class="small muted">Head to head: <b>${(() => { const r = Online.h2h(code); return `W${r.w} D${r.d} L${r.l}`; })()}</b></span><button class="btn sm pri" data-a="challenge" data-v="${esc(code)}">⚔️ Challenge to a friendly</button><button class="btn sm danger" data-a="phoneRemove" data-v="${esc(code)}">Remove</button></div></div>
    <div class="chat-scroll" id="chatScroll">${msgs.length ? msgs.map((m) => `<div class="bub ${m.from === G.online.code ? "me" : ""}"><div>${esc(m.text)}</div><span>${new Date(m.at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>`).join("") : `<div class="empty">No messages yet. Say hi!</div>`}</div>
    <div class="row" style="margin-top:10px"><input type="text" id="chatInput" maxlength="500" placeholder="Message ${esc(p.name)}" style="flex:1;min-width:0" aria-label="Message"><button class="btn pri" data-a="phoneSend">Send</button></div>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-a="phoneQuick" data-v="result">Share my last result</button><button class="btn sm" data-a="phoneQuick" data-v="stats">Share my season</button><button class="btn sm" data-a="phoneQuick" data-v="banter">Send some banter</button></div></div>`;
  } else {
    const lg = fr.map((c) => Online.profiles[c]).filter(Boolean).concat([Online.profileData()]).filter((x) => x.mode === "career").sort((a, b) => (b.ovr || 0) - (a.ovr || 0) || (b.goals || 0) - (a.goals || 0));
    const league = lg.length > 1 ? `<div class="panel" style="margin-top:16px"><h3>Friends league</h3><div class="tw"><table class="t"><thead><tr><th>#</th><th>Player</th><th>Club</th><th class="r">Ovr</th><th class="r">Goals</th><th class="r">Caps</th><th class="r">Trophies</th></tr></thead><tbody>${lg.map((x, i) => `<tr class="${x.code === G.online.code ? "me" : ""}"><td>${i + 1}</td><td><b>${esc(x.name)}</b></td><td class="small">${esc(x.club)}</td><td class="r">${x.ovr || "–"}</td><td class="r">${x.goals || 0}</td><td class="r">${x.caps || 0}</td><td class="r">${x.trophies || 0}</td></tr>`).join("")}</tbody></table></div></div>` : "";
    chat = `<div class="panel">${fr.length ? `<div class="stack" style="gap:8px">${fr.map(card).join("")}</div>` : `<div class="empty">No friends yet. Send your code <b>${esc(G.online.code)}</b> to a friend who plays Touchline, then add theirs on the right.</div>`}</div>${league}`;
  }
  return head + `<div class="grid g21"><div class="stack" style="gap:16px">${chat}</div><div class="stack" style="gap:16px">
  <div class="panel stack"><h3>Add a friend</h3><div class="row"><input type="text" id="friendCode" placeholder="e.g. SUNNY-1234" style="flex:1;min-width:0;text-transform:uppercase" aria-label="Friend code"><button class="btn pri" data-a="phoneAdd">Add</button></div>
  <p class="small muted" style="margin:0">Every save has its own friend code. Your friends see your player card update as your career goes on. Messages are stored online, so keep them friendly.</p></div>
  ${Online.err ? `<div class="panel small">${esc(Online.err)}</div>` : ""}</div></div>`;
};
PAGES.saves = () => {
  return `<div class="page-h"><div><h4>${esc(G.name)}</h4><h1>Save &amp; menu</h1></div></div>
  <div class="grid g2"><div class="panel stack"><h3>Save</h3>
    <label class="f">Save name<input type="text" id="gName" value="${esc(G.name)}" data-c="gName"></label>
    <div class="row"><button class="btn pri" data-a="saveNow">Save on this device</button>${UI.cloudOk ? `<button class="btn" data-a="saveCloud">Save to cloud</button>` : ""}<button class="btn" data-a="exportSave">Export save file</button></div>
    <p class="small muted" style="margin:0">This game autosaves on this device after every match and at each Continue. ${UI.cloudOk ? "Cloud saves are private to you and follow you to any device where you open this page." : "Export a file to move a save between devices or hand it to a friend."}</p></div>
  <div class="panel stack"><h3>Menu</h3><button class="btn" data-a="toTitle">Back to title screen</button><button class="btn" data-a="newSlot">Save as a new copy</button>
  <p class="small muted" style="margin:0">Saves live in this browser. Friends opening the same link get their own saves, and nobody can see or overwrite yours.</p></div></div>`;
};

// ---------- modals ----------
const MODALS = {};
MODALS.player = (m) => {
  const p = pl(m.id);
  if (!p) return modalShell("<h3>Player</h3>", `<div class="empty">This player has retired.</div>`);
  const c = p.club >= 0 ? club(p.club) : null;
  const mine = G.mode === "manager" && p.club === G.userClub;
  const attrs = p.pos === "GK" ? [6, 2, 5, 0, 1, 3, 4] : [0, 1, 2, 3, 4, 5];
  const hist = p.hist.slice().reverse();
  let actions = "";
  if (G.mode === "manager" && !mine) {
    const short = G.shortlist && G.shortlist.includes(p.id);
    const fee = m.fee != null ? m.fee : askingPrice(p), wage = m.wage != null ? m.wage : wageDemand(p, club(G.userClub));
    actions = `<div class="panel stack" style="background:var(--panel2)"><div class="panel-h"><h3>${p.club >= 0 ? "Make an offer" : "Offer a contract"}</h3><button class="btn sm" data-a="shortlist" data-id="${p.id}">${short ? "★ Shortlisted" : "☆ Shortlist"}</button></div>
    <div class="row">${p.club >= 0 ? `<label class="f" style="flex:1;min-width:120px">Fee (€)<input type="number" id="ofFee" value="${fee}" step="100000"></label>` : ""}<label class="f" style="flex:1;min-width:120px">Wage (€/wk)<input type="number" id="ofWage" value="${wage}" step="100"></label><label class="f" style="width:110px">Years<select id="ofYears">${[1, 2, 3, 4, 5].map((y) => `<option ${y === (m.years || 3) ? "selected" : ""}>${y}</option>`).join("")}</select></label></div>
    <div class="row"><button class="btn pri" data-a="bid" data-id="${p.id}">Submit offer</button><span class="small muted">${p.club >= 0 ? `Asking price around ${money(askingPrice(p))}` : "Free agent: no fee"}${inWindow() || p.club < 0 ? "" : " · window closed"}</span></div>${m.msg ? `<div class="small" style="font-weight:600">${esc(m.msg)}</div>` : ""}</div>`;
  } else if (mine) {
    const wage = m.wage != null ? m.wage : Math.round(Math.max(wageFor(p, c), p.wage * 1.1) / 100) * 100;
    actions = `<div class="panel stack" style="background:var(--panel2)"><h3>Manage</h3>
    <div class="row"><label class="f" style="flex:1;min-width:120px">New wage (€/wk)<input type="number" id="rnWage" value="${wage}" step="100"></label><label class="f" style="width:110px">Years<select id="rnYears">${[1, 2, 3, 4, 5].map((y) => `<option ${y === 3 ? "selected" : ""}>${y}</option>`).join("")}</select></label><button class="btn pri" data-a="renew" data-id="${p.id}" style="align-self:end">Offer new contract</button></div>
    <div class="row"><button class="btn" data-a="toggleList" data-id="${p.id}">${p.listed ? "Remove from transfer list" : "Transfer-list"}</button><button class="btn danger" data-a="releaseAsk" data-id="${p.id}">Release</button></div>${m.msg ? `<div class="small" style="font-weight:600">${esc(m.msg)}</div>` : ""}</div>`;
  }
  return modalShell(`<h3>Player profile</h3>`, `<div class="stack" style="gap:16px">
  <div class="prof-top"><span class="face" style="width:112px;height:112px">${p.ph ? `<img src="${esc(p.ph)}" alt="">` : faceSVG(p.face, c ? c.c1 : "#7d847f", c ? c.c2 : "#fff")}</span>
  <div style="min-width:0"><h2>${esc(fullName(p))}</h2><div class="row small" style="margin-top:6px">${posTag(p.pos)}<span>Age ${age(p)}</span><span>${esc(NATIONS[p.nat] ? NATIONS[p.nat][0] : p.nat)}</span><span>${p.foot === "L" ? "Left" : "Right"} foot</span>${statusChips(p)}</div>
  <div class="row small" style="margin-top:6px">${c ? `<button class="btn sm" data-a="clubView" data-id="${c.id}">${crest(c, 18)} ${esc(c.name)}</button>` : `<span class="chip">Free agent</span>`}<span class="muted">Value ${money(p.val)} · ${money(p.wage)}/wk${p.ce != null ? ` · until ${p.ce + 1}` : ""}</span></div></div>
  <div class="row">${ovrTag(p.o)}<div class="small muted">Potential<br><b style="color:var(--ink)">${p.pot}</b></div><button class="btn sm" data-a="editPlayer" data-id="${p.id}">Edit</button></div></div>
  <div class="grid g2"><div class="panel"><h3>Attributes</h3><div class="stack" style="gap:6px">${attrs.map((i) => attrRow(p, i)).join("")}</div>
  <div class="small muted" style="margin-top:8px">Best positions: ${p.pos === "GK" ? "GK " + p.o : POSITIONS.filter((x) => x !== "GK").map((x) => [x, effAt(p, x)]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([x, v]) => `${x} ${Math.round(v)}`).join(" · ")}</div></div>
  <div class="panel"><h3>This season</h3><div class="kpis"><div class="kpi"><b>${p.st.ap}</b><span>Apps</span></div><div class="kpi"><b>${p.st.g}</b><span>Goals</span></div><div class="kpi"><b>${p.st.as}</b><span>Assists</span></div><div class="kpi"><b>${p.st.ap ? (p.st.rs / p.st.ap).toFixed(2) : "–"}</b><span>Avg rating</span></div><div class="kpi"><b>${p.st.mom}</b><span>Player of match</span></div><div class="kpi"><b>${p.st.y}/${p.st.r}</b><span>Yellow/red</span></div><div class="kpi"><b>${p.caps || 0} · ${p.ig || 0}</b><span>Caps · intl goals</span></div></div>
  <div class="meter" style="margin-top:12px"><span class="small muted" style="width:56px">Fitness</span><div class="bar"><i style="width:${p.fit}%"></i></div><span class="small">${p.fit}%</span></div><div class="meter"><span class="small muted" style="width:56px">Morale</span><div class="bar"><i style="width:${p.mor}%"></i></div><span class="small">${moraleWord(p.mor)}</span></div></div></div>
  ${actions}
  ${hist.length ? `<div class="panel"><h3>Career</h3><div class="tw"><table class="t"><thead><tr><th>Season</th><th>Club</th><th class="r">Apps</th><th class="r">Gls</th><th class="r">Ast</th><th class="r">Avg</th></tr></thead><tbody>${hist.map((h) => `<tr><td>${h.s}/${(h.s + 1) % 100}</td><td>${esc(h.cn)}</td><td class="r">${h.ap}</td><td class="r">${h.g}</td><td class="r">${h.as}</td><td class="r">${h.r}</td></tr>`).join("")}</tbody></table></div></div>` : ""}
  ${p.tx && p.tx.length ? `<div class="panel"><h3>Transfers</h3>${p.tx.slice().reverse().map((t) => `<div class="small">${fmtDate(t.d)} ${t.s}: ${t.from >= 0 ? esc(club(t.from).name) : "Free agent"} → ${esc(club(t.to).name)} · ${t.fee ? money(t.fee) : "free"}</div>`).join("")}</div>` : ""}
  </div>`, { label: "Player profile" });
};
MODALS.editPlayer = (m) => {
  const p = pl(m.id);
  return modalShell(`<h3>Edit player</h3>`, `<div class="stack"><div class="row">${faceHTML(p, 88)}<div class="stack" style="flex:1;min-width:200px">
  <div class="row"><label class="f" style="flex:1">First name<input type="text" id="epFn" value="${esc(p.fn)}"></label><label class="f" style="flex:1">Last name<input type="text" id="epLn" value="${esc(p.ln)}"></label></div>
  <div class="row"><label class="btn sm" for="epPhoto">Upload photo</label><input type="file" id="epPhoto" accept="image/*" hidden data-c="epPhoto" data-id="${p.id}">${p.ph ? `<button class="btn sm" data-a="epNoPhoto" data-id="${p.id}">Remove photo</button>` : ""}<button class="btn sm" data-a="epNewFace" data-id="${p.id}">New generated face</button></div></div></div>
  <p class="small muted" style="margin:0">Photos are shrunk to a small square and stored inside your save.</p>
  <div class="row" style="justify-content:flex-end"><button class="btn" data-a="player" data-id="${p.id}">Back</button><button class="btn pri" data-a="epSave" data-id="${p.id}">Save changes</button></div></div>`);
};
MODALS.editClub = () => {
  const c = club(G.userClub);
  return modalShell(`<h3>Edit club</h3>`, `<div class="stack"><div class="row">${crest(c, 64)}<div class="stack" style="flex:1;min-width:200px">
  <div class="row"><label class="f" style="flex:2;min-width:160px">Name<input type="text" id="ecName" value="${esc(c.name)}"></label><label class="f" style="width:100px">Short<input type="text" id="ecShort" maxlength="4" value="${esc(c.short)}"></label></div>
  <div class="row"><label class="f">Home<input type="color" id="ecC1" value="${c.c1}"></label><label class="f">Trim<input type="color" id="ecC2" value="${c.c2}"></label></div></div></div>
  <div class="row" style="justify-content:flex-end"><button class="btn pri" data-a="ecSave">Save</button></div></div>`);
};
MODALS.club = (m) => {
  const c = club(m.id);
  const rows = sortRows(squad(c.id), "clubsq", { k: "o", d: -1 });
  const lg = leagueOf(c), pos = sortTable(lg.table, lg.clubs).indexOf(c.id) + 1;
  return modalShell(`${crest(c, 40)}<div><h3>${esc(c.name)}</h3><div class="small muted">${esc(lg.name)} · ${ordinal(pos)} · ${stars(c.rep)}</div></div>`, `<div class="stack">
  <div class="kpis"><div class="kpi"><b>${c.sq.length}</b><span>Squad</span></div><div class="kpi"><b>${money(rows.reduce((s, p) => s + p.val, 0))}</b><span>Squad value</span></div><div class="kpi"><b>${esc(c.form)}</b><span>Formation</span></div><div class="kpi"><b>${c.trophies.length}</b><span>Trophies (save)</span></div></div>
  ${playerTable(rows, "clubsq", 0, 60)}</div>`, { wide: true });
};
MODALS.nation = (m) => {
  const n = club(m.id);
  const sq = n.sq.length ? n.sq.map(pl).filter(Boolean) : Object.values(G.players).filter((p) => p.nat === n.id && !p.ret).sort((a, b) => b.o - a.o).slice(0, 26);
  const trophies = n.trophies.length ? n.trophies.map((t) => `${t.n} (${t.s + 1})`).join(", ") : "None in this save yet";
  return modalShell(`${crest(n, 40)}<div><h3>${esc(n.name)}</h3><div class="small muted">National team · strength ${n.rep} · ${n.pool} players in the game</div></div>`, `<div class="stack"><div class="small"><b>Honours:</b> ${esc(trophies)}</div><h4>${n.sq.length ? "Latest squad" : "Best available players"}</h4>${playerTable(sortRows(sq, "natsq", { k: "o", d: -1 }), "natsq", 0, 30)}</div>`, { wide: true });
};
MODALS.msg = (m) => {
  const msg = G.inbox.find((x) => x.id === m.id);
  if (!msg) return "";
  let act = "";
  const a = msg.act;
  if (a && !msg.done) {
    if (a.kind === "bid") {
      act = `<div class="row"><button class="btn pri" data-a="bidResp" data-id="${msg.id}" data-v="accept">Accept ${money(a.fee)}</button><button class="btn" data-a="bidResp" data-id="${msg.id}" data-v="reject">Reject</button></div>
      <div class="row"><label class="f" style="flex:1">Counter-offer (€)<input type="number" id="ctrFee" value="${Math.round(a.fee * 1.25 / 1e5) * 1e5}" step="100000"></label><button class="btn" data-a="bidResp" data-id="${msg.id}" data-v="counter" style="align-self:end">Send counter</button></div>`;
    } else if (a.kind === "event") {
      act = `<div class="stack" style="gap:8px">${eventOptions(msg).map((l, i) => `<button class="btn ${i === 0 ? "pri" : ""}" style="justify-content:flex-start;white-space:normal;text-align:left" data-a="eventResp" data-id="${msg.id}" data-v="${i}">${esc(l)}</button>`).join("")}</div>`;
    } else if (a.kind === "spons") {
      act = `<div class="row">${brandBadge(a.brand)}<button class="btn pri" data-a="sponsResp" data-id="${msg.id}" data-v="1">Sign the deal</button><button class="btn" data-a="sponsResp" data-id="${msg.id}" data-v="0">Turn it down</button></div>`;
    } else if (a.kind === "coffer") {
      act = `<div class="row"><button class="btn pri" data-a="cofferResp" data-id="${msg.id}" data-v="1">Accept the move</button><button class="btn" data-a="cofferResp" data-id="${msg.id}" data-v="0">Stay where I am</button></div>`;
    } else if (a.kind === "jobs") {
      a.list = a.list || jobOffers().map((c) => c.id);
      act = `<div class="stack">${a.list.map((cid) => { const c = club(cid); return `<div class="savecard">${crest(c, 32)}<div><b>${esc(c.name)}</b><div class="small muted">${esc(leagueOf(c).name)} · ${stars(c.rep)}</div></div><button class="btn pri sm" data-a="takeJob" data-id="${cid}" data-m="${msg.id}">Accept job</button></div>`; }).join("")}</div>`;
    }
  }
  return modalShell(`<div><h3>${esc(msg.t)}</h3><div class="small muted">${fmtDate(msg.d, { wd: true })} ${msg.s}</div></div>`, `<div class="stack"><p style="margin:0">${esc(msg.b)}</p>${act}${m.res ? `<div style="font-weight:600">${esc(m.res)}</div>` : ""}</div>`);
};
MODALS.confirm = (m) => modalShell(`<h3>${esc(m.title)}</h3>`, `<div class="stack"><p style="margin:0">${esc(m.text)}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-a="close">Cancel</button><button class="btn ${m.danger ? "danger" : "pri"}" data-a="confirmYes">${esc(m.yes || "Confirm")}</button></div></div>`);
MODALS.season = (m) => {
  const H = G.hist, last = (arr) => arr && arr[arr.length - 1];
  const prev = G.season - 1;
  const rows = Object.keys(H.lg).map((id) => { const x = last(H.lg[id]); return x && x.s === prev ? `<tr><td>${esc(G.leagues[id].name)} <span class="muted small">${esc(G.leagues[id].country)}</span></td><td><b>${esc(x.n)}</b></td></tr>` : ""; }).join("");
  const cont = ["UCL", "UEL", "CAFCL", "CAFCC"].concat(TOURNEYS).map((k) => { const x = last(H.euro[k]); return x && x.s === prev ? `<tr><td>${esc(COMP_INFO[k].name)}</td><td><b>${esc(x.n)}</b></td></tr>` : ""; }).join("");
  const aw = last(H.awards);
  return modalShell(`<div><h4>Season review</h4><h2>${prev}/${G.season % 100}</h2></div>`, `<div class="stack"><p style="margin:0;font-weight:600">${esc(m.summary || "")}</p>
  ${aw ? `<div class="kpis"><div class="kpi"><b style="font-size:1.1rem">${esc(aw.gb ? aw.gb.n : "—")}</b><span>Golden Ball</span></div><div class="kpi"><b style="font-size:1.1rem">${esc(aw.boot ? aw.boot.n + " (" + aw.boot.g + ")" : "—")}</b><span>Golden Boot</span></div><div class="kpi"><b style="font-size:1.1rem">${esc(aw.ys ? aw.ys.n : "—")}</b><span>Golden Boy</span></div></div>` : ""}
  <div class="grid g2"><div class="tw"><table class="t"><thead><tr><th>League</th><th>Champions</th></tr></thead><tbody>${rows}</tbody></table></div><div class="tw"><table class="t"><thead><tr><th>Competition</th><th>Winner</th></tr></thead><tbody>${cont}</tbody></table></div></div>
  <div class="row" style="justify-content:flex-end"><button class="btn pri" data-a="close">On to the new season</button></div></div>`, { wide: true });
};

// pre-match and match report
MODALS.prematch = (m) => {
  const f = G.fx[m.f], h = club(f.h), a = club(f.a);
  const myId = userTeamOf(f), userSide = f.h === myId ? 0 : 1;
  const uc = club(myId);
  let lu;
  if (G.mode === "manager" && !uc.nt) lu = uc.auto ? autoLineup(uc) : validateUserLineup(uc); else lu = autoLineup(uc);
  const form = FORMATIONS[uc.form];
  const inXI = G.mode === "career" && lu.xi.includes(G.userPlayer);
  const onBench = G.mode === "career" && lu.bench.includes(G.userPlayer);
  const opp = club(userSide ? f.h : f.a), olu = autoLineup(opp);
  const list = (c, l) => FORMATIONS[c.form].map((pos, i) => { const p = l.xi[i] != null ? pl(l.xi[i]) : null; return p ? `<div class="pcell small" style="padding:2px 0">${posTag(pos)}${faceHTML(p, 22)}<span class="nm">${esc(shortName(p))}</span><span class="muted">${p.o}</span></div>` : ""; }).join("");
  return modalShell(`<div><h4>${esc(compName(f.c))} · ${esc(f.s || "")}</h4><h3>${esc(h.name)} v ${esc(a.name)}</h3></div>`, `<div class="stack">
  <div class="nextmatch"><div class="tm">${crest(h, 64)}<span>${esc(h.name)}</span></div><div class="vs">v</div><div class="tm">${crest(a, 64)}<span>${esc(a.name)}</span></div></div>
  ${G.mode === "career" ? `<div class="panel" style="text-align:center;font-weight:600">${inXI ? "You're in the starting XI. Play the match to make the big decisions yourself." : onBench ? "You're on the bench today. If you come on, you'll get your chances to decide." : "You haven't made the squad today."}</div>` : ""}
  <div class="grid g2"><div class="panel"><h4>${esc(uc.name)} · ${esc(uc.form)}</h4>${list(uc, lu)}</div><div class="panel"><h4>${esc(opp.name)} · ${esc(opp.form)}</h4>${list(opp, olu)}</div></div>
  <div class="row" style="justify-content:flex-end">${G.mode === "manager" ? `<button class="btn" data-a="pmTactics">Change team</button>` : ""}<button class="btn" data-a="quickSim" data-id="${f.i}">Quick result</button><button class="btn pri go" data-a="playLive" data-id="${f.i}">${G.mode === "manager" || inXI ? "Play match" : "Watch match"}</button></div></div>`, { wide: true, label: "Pre-match" });
};
MODALS.report = (m) => {
  const f = G.fx[m.id], h = club(f.h), a = club(f.a);
  const r = f.rep;
  const goalsFor = (s) => (f.gl || []).filter((g) => g[1] === s).map((g) => { const p = pl(g[2]), ap = g[3] ? pl(g[3]) : null; return `<div class="small">${g[0]}' ${p ? esc(shortName(p)) : "?"}${ap ? ` <span class="muted">(${esc(shortName(ap))})</span>` : ""}</div>`; }).join("");
  let extra = "";
  if (r) {
    const rt = (s) => r.lu[s].map((pid) => pl(pid)).filter(Boolean).sort((x, y) => r.rt[y.id] - r.rt[x.id]).map((p) => `<tr class="click" data-a="player" data-id="${p.id}"><td><div class="pcell">${faceHTML(p, 22)}<span class="nm">${esc(shortName(p))}</span></div></td><td>${posTag(p.pos)}</td><td class="r"><b style="color:${r.rt[p.id] >= 7.5 ? "var(--win)" : r.rt[p.id] < 6 ? "var(--loss)" : "inherit"}">${r.rt[p.id].toFixed(1)}</b>${f.mom === p.id ? " ★" : ""}</td></tr>`).join("");
    extra = `${statBlock("Possession", r.pos, 100 - r.pos, "%")}${statBlock("Shots", r.sh[0], r.sh[1])}${statBlock("On target", r.sot[0], r.sot[1])}
    <div class="grid g2"><div class="tw"><table class="t"><tbody>${rt(0)}</tbody></table></div><div class="tw"><table class="t"><tbody>${rt(1)}</tbody></table></div></div>`;
  }
  return modalShell(`<div><h4>${esc(compName(f.c))} · ${esc(f.s || "")} · ${fmtDate(f.d, { wd: true })}</h4></div>`, `<div class="stack">
  <div class="score" style="border-radius:12px"><div class="tn">${crest(h, 36)}<span>${esc(h.name)}</span></div><div><div class="sc">${f.hg}–${f.ag}</div><div class="mn">${f.pen ? `${f.pen[0]}–${f.pen[1]} on penalties` : f.et ? "After extra time" : "Full time"}</div></div><div class="tn a"><span>${esc(a.name)}</span>${crest(a, 36)}</div></div>
  <div class="grid g2"><div>${goalsFor(0)}</div><div style="text-align:right">${goalsFor(1)}</div></div>${extra}</div>`, { wide: !!r });
};
function statBlock(label, a, b, unit = "") {
  const tot = a + b || 1;
  return `<div class="statrow"><b class="num">${a}${unit}</b><div><div class="lab">${label}</div><div class="duel"><i style="width:${(a / tot) * 100}%;background:var(--accent)"></i><i style="width:${(b / tot) * 100}%;background:var(--muted)"></i></div></div><b class="num" style="text-align:right">${b}${unit}</b></div>`;
}

// live match
const SPEEDS = [[1, 480], [2, 220], [4, 90], [8, 35]];
function startLive(fi) {
  const f = G.fx[fi];
  const m = createMatch(f, { live: true, inter: G.mode === "career" });
  UI.live = { m, speed: 1, timer: null, paused: false, subOut: "", subIn: "", mom: [] };
  openModal("live");
  runTimer();
}
function runTimer() {
  const L = UI.live; if (!L) return;
  clearInterval(L.timer);
  if (L.paused || L.m.done || L.m.phase === "HT" || L.m.phase === "ETB" || L.m.pending) { renderModal(); return; }
  L.timer = setInterval(() => {
    const m = L.m;
    const evs = stepMatch(m);
    trackerStep(L, evs);
    L.mom.push(0.5 + (m.possShare - 0.5) * 0.8 + (rnd() - 0.5) * 0.55 + evs.reduce((a, e) => a + (["goal", "save", "miss", "block"].includes(e.t) ? (e.s === 0 ? 0.3 : -0.3) : 0), 0));
    if (m.pending) { clearInterval(L.timer); renderLive(true); return; }
    if (m.done || m.phase === "HT" || m.phase === "ETB" || evs.some((e) => e.t === "inj" && m.sides[e.s].user)) { clearInterval(L.timer); if (evs.some((e) => e.t === "inj" && m.sides[e.s].user)) L.paused = true; }
    renderLive();
  }, SPEEDS.find((s) => s[0] === L.speed)[1]);
  renderLive();
}
function evText(e, m) {
  const P = (id) => { const p = pl(id); return p ? esc(shortName(p)) : "?"; };
  const T = (s) => esc(club(m.sides[s].cid).name);
  switch (e.t) {
    case "goal": return `<b>GOAL! ${T(e.s)}.</b> ${P(e.p)} scores${e.a ? `, set up by ${P(e.a)}` : ""}. ${e.sc[0]}–${e.sc[1]}`;
    case "save": return `${P(e.p)} forces a save${e.k ? ` from ${P(e.k)}` : ""}.`;
    case "miss": return `${P(e.p)} shoots wide for ${T(e.s)}.`;
    case "block": return `${P(e.p)}'s shot is blocked.`;
    case "yc": return `Yellow card for ${P(e.p)} (${T(e.s)}).`;
    case "rc": return `<b>Red card!</b> ${P(e.p)} is sent off${e.second ? " for a second booking" : ""}.`;
    case "inj": return `${P(e.p)} is injured and needs treatment.`;
    case "sub": return `Substitution ${T(e.s)}: ${P(e.p)} replaces ${P(e.o)}.`;
    case "note": return NOTES[e.k].replace("{p}", P(e.p)).replace("{t}", T(e.s));
    case "ht": return "Half-time.";
    case "et": return "Extra time.";
    case "pens": return `Penalty shoot-out: ${e.sc[0]}–${e.sc[1]}.`;
    case "ft": return "Full-time.";
    case "mom": return `<b>${P(e.p)}:</b> ${esc(e.txt)}`;
  }
  return "";
}
const NOTES = ["{p} wins a corner for {t}.", "{t} keep the ball well, {p} pulling the strings.", "{p} goes down under a challenge. Free kick to {t}.", "Long ball forward from {p}, but it's overhit.", "{p} tries to find a way through on the edge of the box.", "{t} press high and win it back through {p}.", "Neat one-two involving {p}.", "{p} switches play to the far side.", "Offside flag goes up against {p}.", "{p} clears the danger for {t}."];
const EV_ICON = { mom: "★", goal: "⚽", yc: "🟨", rc: "🟥", inj: "✚", sub: "⇄", save: "🧤", miss: "·", block: "·", ht: "", et: "", ft: "", pens: "" };
function lvParts(L) {
  const m = L.m, f = m.f, h = club(f.h), a = club(f.a);
  const evs = m.ev.slice().reverse();
  const poss = Math.round((m.possA / Math.max(1, m.possN)) * 100);
  const phaseLabel = m.phase === "HT" ? "Half-time" : m.phase === "ETB" ? "End of 90 minutes" : m.phase === "FT" ? "Full-time" : m.phase === "ET" ? `Extra time · ${m.min}'` : `${m.min}'`;
  const lineup = (s) => m.sides[s].on.map((o) => { const p = pl(o.pid); return `<div class="pcell small" style="justify-content:space-between;padding:2px 0"><span class="row" style="gap:6px;flex-wrap:nowrap">${posTag(o.pos)}<span class="nm">${esc(shortName(p))}</span>${m.yel[o.pid] ? "🟨" : ""}${m.goals[o.pid] ? "⚽".repeat(m.goals[o.pid]) : ""}${m.inj.includes(o.pid) ? "✚" : ""}</span><b class="num">${m.rt[o.pid].toFixed(1)}</b></div>`; }).join("");
  const mainBtn = m.done ? `<button class="btn pri go" data-a="lvFinish">Finish</button>` : m.phase === "HT" ? `<button class="btn pri go" data-a="lvResume">Second half</button>` : m.phase === "ETB" ? `<button class="btn pri go" data-a="lvResume">Extra time</button>` : `<button class="btn" data-a="lvPause">${L.paused ? "Resume" : "Pause"}</button>`;
  return {
    score: `<div class="tn">${crest(h, 40)}<span>${esc(h.name)}</span></div><div><div class="sc">${m.g[0]}–${m.g[1]}</div><div class="mn">${phaseLabel}${m.pen ? ` · pens ${m.pen[0]}–${m.pen[1]}` : ""}</div></div><div class="tn a"><span>${esc(a.name)}</span>${crest(a, 40)}</div>`,
    btns: `${mainBtn}<div class="row"><span class="small muted">Speed</span><div class="seg">${SPEEDS.map(([s]) => `<button class="${L.speed === s ? "on" : ""}" data-a="lvSpeed" data-v="${s}">${s}×</button>`).join("")}</div>${m.done ? "" : `<button class="btn sm" data-a="lvSkip">Skip to end</button>`}</div>`,
    mom: L.mom.slice(-60).map((v) => { const d = clamp(v - 0.5, -0.5, 0.5); return `<i style="height:${Math.round(Math.abs(d) * 46 + 2)}px;background:${d >= 0 ? "var(--accent)" : "var(--muted)"};align-self:${d >= 0 ? "flex-end" : "flex-start"}"></i>`; }).join(""),
    feed: evs.map((e) => `<div class="ev ${e.t === "goal" ? "goal" : ""}"><span class="m">${["ht", "ft", "et", "pens"].includes(e.t) ? "" : e.m + "'"}</span><span>${EV_ICON[e.t] || ""}</span><span>${evText(e, m)}</span></div>`).join("") || `<div class="empty">Kick-off.</div>`,
    stats: `${statBlock("Possession", poss, 100 - poss, "%")}${statBlock("Shots", m.shots[0], m.shots[1])}${statBlock("On target", m.sot[0], m.sot[1])}`,
    lu0: `<h4>${esc(h.short)}</h4>${lineup(0)}`, lu1: `<h4>${esc(a.short)}</h4>${lineup(1)}`,
  };
}
function lvControls(L) {
  const m = L.m, us = m.sides.findIndex((s) => s.user);
  if (us < 0 || m.done) return "";
  const side = m.sides[us];
  const onOpts = side.on.map((o) => { const p = pl(o.pid); return `<option value="${o.pid}" ${String(L.subOut) === String(o.pid) ? "selected" : ""}>${o.pos} ${esc(shortName(p))}${m.inj.includes(o.pid) ? " (injured)" : ""} · ${m.rt[o.pid].toFixed(1)}</option>`; }).join("");
  const benchOpts = side.bench.map((id) => { const p = pl(id); return `<option value="${id}" ${String(L.subIn) === String(id) ? "selected" : ""}>${p.pos} ${esc(shortName(p))} (${p.o})</option>`; }).join("");
  return `<div class="panel stack"><h4>Touchline</h4><div class="seg">${["Defensive", "Balanced", "Attacking"].map((l, i) => `<button class="${side.ment === i ? "on" : ""}" data-a="lvMent" data-v="${i}">${l}</button>`).join("")}</div>
    <div class="small muted">Substitutions: ${side.subs}/${side.maxSubs}</div>
    <label class="f">Off<select id="lvOut" data-c="lvOut"><option value="">Choose player</option>${onOpts}</select></label>
    <label class="f">On<select id="lvIn" data-c="lvIn"><option value="">Choose substitute</option>${benchOpts}</select></label>
    <button class="btn" data-a="lvSub" ${side.subs >= side.maxSubs ? "disabled" : ""}>Make substitution</button></div>`;
}
const MOMENT_STAT = { pen: [1, "Finishing"], fk: [1, "Shooting"], oneone: [1, "Finishing"], edge: [1, "Shooting"], counter: [2, "Passing"], tackle: [4, "Defending"], header: [5, "Physical"], gkpen: [6, "Goalkeeping"], gk1v1: [6, "Goalkeeping"] };
function adBoard() {
  const extra = [];
  if (UI.live) { const h = club(UI.live.m.f.h); extra.push({ t: `WELCOME TO ${h.name.toUpperCase()}`, bg: h.c1, fg: lum(h.c1) > 0.6 ? "#111" : "#fff" }); }
  if (G.mode === "career" && G.career && G.career.life && G.career.life.spons) { const b = BRAND_BY[G.career.life.spons.brand]; extra.push({ t: b.n, bg: b.bg, fg: b.fg }); }
  const list = PITCH_ADS.concat(extra);
  const one = list.map((a) => `<span class="adb ${a.cls || ""}" style="background:${a.bg};color:${a.fg}">${a.img ? `<img src="${esc(a.img)}" alt="${esc(a.t)}">` : `${esc(a.t)}${a.ar ? ` <span class="ad-ar" lang="ar">${esc(a.ar)}</span>` : ""}`}</span>`).join("");
  return `<div class="ads"><div class="ads-run">${one}${one}</div></div>`;
}
function trackerStep(L, evs) {
  const m = L.m, T = (L.tr = L.tr || { x: 50, y: 50, s: 0, label: "Kick-off", shots: [] });
  const tn = (s) => club(m.sides[s].cid).short;
  const shot = evs.find((e) => ["goal", "save", "miss", "block"].includes(e.t)) || evs.find((e) => e.t === "mom");
  if (shot && shot.t !== "mom") {
    const s = shot.s, sx = s === 0 ? ri(76, 90) : ri(10, 24), sy = ri(26, 74);
    T.s = s; T.shots.push({ x: sx, y: sy, s, t: shot.t });
    if (T.shots.length > 40) T.shots.shift();
    if (shot.t === "goal") { T.x = s === 0 ? 98.5 : 1.5; T.y = ri(44, 56); T.label = `GOAL! ${tn(s)}`; }
    else { T.x = sx; T.y = sy; T.label = shot.t === "save" ? `Shot saved · ${tn(s)}` : shot.t === "block" ? `Shot blocked · ${tn(s)}` : `Shot wide · ${tn(s)}`; }
    return;
  }
  const other = evs.find((e) => ["yc", "rc", "inj", "sub"].includes(e.t));
  const s = rnd() < m.possShare ? 0 : 1;
  const dir = s === 0 ? 1 : -1;
  if (s !== T.s) { T.x = s === 0 ? ri(30, 50) : ri(50, 70); T.s = s; }
  else T.x = clamp(T.x + dir * ri(4, 16) * (rnd() < 0.25 ? -1 : 1), 6, 94);
  T.y = clamp(T.y + ri(-22, 22), 10, 90);
  const prog = s === 0 ? T.x : 100 - T.x;
  T.label = other ? { yc: "Yellow card", rc: "Red card", inj: "Injury", sub: "Substitution" }[other.t] + ` · ${tn(other.s)}` : prog > 72 ? `Dangerous attack · ${tn(s)}` : prog > 45 ? `Attack · ${tn(s)}` : `Ball safe · ${tn(s)}`;
}
function trackerInner(L) {
  const T = L.tr || { x: 50, y: 50, s: 0, label: "Kick-off", shots: [] }, m = L.m;
  const col = (s) => { const c = club(m.sides[s].cid); return lum(c.c1) > 0.85 ? c.c2 : c.c1; };
  const zone = T.label.startsWith("Dangerous") ? `<div class="tzone" style="${T.s === 0 ? "right" : "left"}:0;background:linear-gradient(${T.s === 0 ? "90deg" : "270deg"}, transparent, ${col(T.s)}66)"></div>` : "";
  const shots = T.shots.map((x) => `<i class="tshot ${x.t}" style="left:${x.x}%;top:${x.y}%;background:${x.t === "goal" ? col(x.s) : "transparent"};border-color:${col(x.s)}"></i>`).join("");
  return `${zone}${shots}<div class="tball" style="left:${T.x}%;top:${T.y}%"></div><div class="tlabel ${T.label.startsWith("GOAL") ? "goal" : ""}">${esc(T.label)}</div>`;
}
function trackerHTML(L) {
  return `<div class="tracker">${adBoard()}<div class="tpitch"><svg class="lines" viewBox="0 0 105 68" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="var(--pitch-line)" stroke-width=".4"><rect x="1" y="1" width="103" height="66"/><line x1="52.5" y1="1" x2="52.5" y2="67"/><circle cx="52.5" cy="34" r="9"/><rect x="1" y="14" width="16" height="40"/><rect x="88" y="14" width="16" height="40"/><rect x="1" y="25" width="5.5" height="18"/><rect x="98.5" y="25" width="5.5" height="18"/></g></svg><div id="lv-track">${trackerInner(L)}</div></div>${adBoard()}</div>`;
}
function lvMoment(L) {
  const m = L.m, mo = m.pending;
  if (mo) {
    const def = MOMENTS[mo.type], me = pl(mo.pid), st = MOMENT_STAT[mo.type];
    return `<div class="moment" role="group" aria-label="Your decision"><div class="row" style="justify-content:space-between"><b class="disp" style="font-size:1.3rem;text-transform:uppercase;letter-spacing:.04em">${mo.min}' · Your moment</b><span class="small">${esc(st[1])} ${Math.round(me.a[st[0]])}</span></div>
    <p style="margin:6px 0 12px;font-size:1.05rem">${esc(def.q(mo))}</p><div class="row">${def.o.map(([v, l]) => `<button class="btn pri" data-a="lvChoice" data-v="${v}">${esc(l)}</button>`).join("")}</div></div>`;
  }
  if (L.lastRes) return `<div class="moment done ${L.lastRes.good ? "good" : "bad"}"><b>${L.lastRes.good ? "Good call." : "Didn't come off."}</b> ${esc(L.lastRes.txt)}</div>`;
  return "";
}
MODALS.live = () => {
  const L = UI.live, P = lvParts(L);
  L.renderedPhase = L.m.phase;
  return `<div class="scrim"><div class="modal wide" role="dialog" aria-modal="true" aria-label="Live match" id="lv-root">
  <div class="score" id="lv-score">${P.score}</div>
  <div class="modal-b stack">
    <div class="row" style="justify-content:space-between" id="lv-btns">${P.btns}</div>
    <div id="lv-moment">${lvMoment(L)}</div>
    ${trackerHTML(L)}
    <div class="momentum" aria-label="Momentum" id="lv-mom">${P.mom}</div>
    <div class="grid g21"><div class="stack"><div class="panel"><div class="feed" id="lv-feed">${P.feed}</div></div>
    <div class="panel" id="lv-stats">${P.stats}</div></div>
    <div class="stack"><div id="lv-ctl">${lvControls(L)}</div><div class="panel" id="lv-lu0">${P.lu0}</div><div class="panel" id="lv-lu1">${P.lu1}</div></div></div>
  </div></div></div>`;
};
function renderLive(full) {
  const L = UI.live; if (!L || !UI.modal || UI.modal.kind !== "live") return;
  const root = document.getElementById("lv-root");
  if (full || !root || L.renderedPhase !== L.m.phase) { renderModal(); return; }
  const P = lvParts(L);
  const tk = document.getElementById("lv-track"); if (tk) tk.innerHTML = trackerInner(L);
  for (const k of ["score", "btns", "mom", "feed", "stats", "lu0", "lu1"]) { const el = document.getElementById("lv-" + k); if (el) el.innerHTML = P[k]; }
  const ctl = document.getElementById("lv-ctl");
  const active = document.activeElement;
  if (ctl && !(active && ctl.contains(active) && active.tagName === "SELECT")) { const nowHtml = lvControls(L); if (ctl.dataset.h !== String(L.m.sides.map((s) => s.subs + ":" + s.ment + ":" + s.on.length).join("|") + L.m.inj.length)) { ctl.innerHTML = nowHtml; ctl.dataset.h = String(L.m.sides.map((s) => s.subs + ":" + s.ment + ":" + s.on.length).join("|") + L.m.inj.length); } }
}

// ---------- actions ----------
const A = {};
A.nav = (el) => { UI.page = el.dataset.p; UI.sel = null; UI.talkRes = null; render(); window.scrollTo(0, 0); };
A.close = () => closeModal();
A.scrim = (el, ev) => { if (ev.target === el && UI.modal && UI.modal.kind !== "live" && UI.modal.kind !== "prematch") closeModal(); };
A.sort = (el) => { const key = el.dataset.key, k = el.dataset.k; const s = UI.sort[key]; UI.sort[key] = s && s.k === k ? { k, d: -s.d } : { k, d: ["name", "pos", "club"].includes(k) ? 1 : -1 }; refresh(); };
A.filt = (el) => { UI.filt[el.dataset.key] = el.dataset.v; render(); };
A.player = (el) => openModal("player", { id: +el.dataset.id });
A.clubView = (el) => { const id = el.dataset.id; openModal(isNaN(+id) ? "nation" : "club", { id: isNaN(+id) ? id : +id }); };
A.report = (el) => openModal("report", { id: +el.dataset.id });
A.openMsg = (el) => { const msg = G.inbox.find((x) => x.id === +el.dataset.id); if (msg) msg.read = true; openModal("msg", { id: +el.dataset.id }); render(); };
A.readAll = () => { G.inbox.forEach((m) => (m.read = true)); render(); };
A.compTab = (el) => { UI.comp.tab = el.dataset.v; render(); };
A.compCont = (el) => { UI.comp.cont = el.dataset.v; render(); };
A.tTab = (el) => { UI.comp.ttab = el.dataset.v; render(); };
A.tsPg = (el) => { UI.ts.pg += +el.dataset.v; render(); };
A.slot = (el) => { const k = el.dataset.k, i = +el.dataset.i; UI.sel = UI.sel && UI.sel.k === k && UI.sel.i === i ? null : { k, i }; render(); };
A.unsel = () => { UI.sel = null; render(); };
A.assign = (el) => {
  const c = club(G.userClub), id = +el.dataset.id, s = UI.sel; if (!s) return;
  c.auto = false;
  const arr = s.k === "xi" ? c.xi : c.bench;
  const cur = arr[s.i];
  const xiIdx = c.xi.indexOf(id), bIdx = c.bench.indexOf(id);
  if (xiIdx >= 0) c.xi[xiIdx] = cur; else if (bIdx >= 0) c.bench[bIdx] = cur;
  arr[s.i] = id;
  c.bench = c.bench.filter((x) => x != null);
  UI.sel = null; render();
};
A.autoXI = () => { const c = club(G.userClub); autoLineup(c); UI.sel = null; render(); toast("Best available XI selected."); };
A.ment = (el) => { club(G.userClub).ment = +el.dataset.v; render(); };
A.shortlist = (el) => { G.shortlist = G.shortlist || []; const id = +el.dataset.id; G.shortlist = G.shortlist.includes(id) ? G.shortlist.filter((x) => x !== id) : G.shortlist.concat(id); renderModal(); };
A.bid = (el) => {
  const id = +el.dataset.id, fee = +(document.getElementById("ofFee") || { value: 0 }).value || 0, wage = +document.getElementById("ofWage").value || 0, years = +document.getElementById("ofYears").value;
  const r = userBid(id, fee, wage, years);
  if (r.ok) { closeModal(); toast(r.msg); render(); autosave(); }
  else openModal("player", { id, msg: r.msg, fee: r.counter || fee, wage: r.wageCounter || wage, years });
};
A.renew = (el) => { const id = +el.dataset.id; const r = renewContract(id, +document.getElementById("rnWage").value, +document.getElementById("rnYears").value); openModal("player", { id, msg: r.msg, wage: r.counter }); if (r.ok) render(); };
A.toggleList = (el) => { const p = pl(+el.dataset.id); p.listed = p.listed ? 0 : 1; openModal("player", { id: p.id, msg: p.listed ? "Transfer-listed. Clubs will be told he's available." : "Removed from the transfer list." }); render(); };
A.releaseAsk = (el) => { const p = pl(+el.dataset.id); const left = Math.max(0, (p.ce || G.season) - G.season + 1); openModal("confirm", { title: `Release ${fullName(p)}?`, text: `You'll pay ${money(Math.round(p.wage * 52 * left * 0.5))} in severance and he becomes a free agent.`, yes: "Release", danger: true, then: () => { toast(releasePlayer(p.id)); render(); } }); };
A.confirmYes = () => { const t = UI.modal.then; closeModal(); t && t(); };
A.editPlayer = (el) => openModal("editPlayer", { id: +el.dataset.id });
A.epNoPhoto = (el) => { delete pl(+el.dataset.id).ph; renderModal(); render(); };
A.epNewFace = (el) => { const p = pl(+el.dataset.id); p.face = genFace(p.nat, age(p)); renderModal(); render(); };
A.epSave = (el) => { const p = pl(+el.dataset.id); const fn = document.getElementById("epFn").value.trim(), ln = document.getElementById("epLn").value.trim(); if (ln) { p.fn = fn; p.ln = ln; } openModal("player", { id: p.id }); render(); toast("Player updated."); };
A.editClub = () => openModal("editClub");
A.ecSave = () => { const c = club(G.userClub); const n = document.getElementById("ecName").value.trim(), s = document.getElementById("ecShort").value.trim(); if (n) c.name = n; if (s) c.short = s.toUpperCase(); c.c1 = document.getElementById("ecC1").value; c.c2 = document.getElementById("ecC2").value; faceCache.clear(); closeModal(); render(); toast("Club updated."); };
A.bidResp = (el) => { const msg = G.inbox.find((x) => x.id === +el.dataset.id); const v = el.dataset.v; const res = respondBid(msg, v === "accept", v === "counter" ? +document.getElementById("ctrFee").value : 0); openModal("msg", { id: msg.id, res }); render(); };
A.cofferResp = (el) => { const msg = G.inbox.find((x) => x.id === +el.dataset.id); const res = careerRespond(msg, el.dataset.v === "1"); openModal("msg", { id: msg.id, res }); faceCache.clear(); render(); };
A.takeJob = (el) => { const msg = G.inbox.find((x) => x.id === +el.dataset.m); if (msg) msg.done = true; takeJob(+el.dataset.id); closeModal(); UI.page = "home"; render(); autosave(); };
A.eventResp = (el) => { const msg = G.inbox.find((x) => x.id === +el.dataset.id); const res = respondEvent(msg, +el.dataset.v); openModal("msg", { id: msg.id, res }); render(); autosave(); };
A.sponsResp = (el) => { const msg = G.inbox.find((x) => x.id === +el.dataset.id); const res = sponsorRespond(msg, el.dataset.v === "1"); openModal("msg", { id: msg.id, res }); render(); autosave(); };
A.mgrTalk = (el) => { const v = el.dataset.k === "position" ? document.getElementById("posReq").value : ""; UI.talkRes = managerTalk(el.dataset.k, v); render(); autosave(); };
A.signAgent = (el) => { toast(signAgent(+el.dataset.v)); render(); autosave(); };
A.agentAct = (el) => { toast(agentAction(el.dataset.k)); render(); autosave(); };
A.copyCode = () => { const t = G.online.code; try { navigator.clipboard.writeText(t).then(() => toast("Code copied."), () => toast(t)); } catch (e) { toast(t); } };
A.phoneRetry = () => { Online.state = "off"; Online.connect(); render(); };
A.phoneAdd = async () => { const v = document.getElementById("friendCode").value; try { toast(await Online.addFriend(v)); } catch (e) { toast("Couldn't add that friend. Try again."); } render(); };
A.phoneOpen = (el) => { Online.open = el.dataset.v; render(); const b = document.getElementById("chatScroll"); if (b) b.scrollTop = b.scrollHeight; const i = document.getElementById("chatInput"); if (i && window.innerWidth > 820) i.focus(); };
A.phoneBack = () => { Online.open = null; render(); };
A.phoneRemove = (el) => { Online.removeFriend(el.dataset.v); render(); };
A.phoneSend = async () => { const i = document.getElementById("chatInput"); const t = i.value; if (!t.trim()) return; i.value = ""; try { await Online.send(Online.open, t); } catch (e) { i.value = t; toast("Message didn't send. Check your connection."); } };
A.phoneQuick = async (el) => {
  const k = el.dataset.v, c = club(G.userClub);
  let t = "";
  if (k === "result") { const f = G.fx.filter((x) => x.p && isUserFx(x)).sort((a, b) => b.d - a.d)[0]; if (!f) { toast("No results yet this season."); return; } t = `FT: ${club(f.h).name} ${f.hg}–${f.ag} ${club(f.a).name} (${compName(f.c)})`; const L = G.career && G.career.last; if (G.mode === "career" && L && L.f === f.i) t += `. I got a ${L.r.toFixed(1)} rating${L.g ? `, ${L.g} goal${L.g > 1 ? "s" : ""}` : ""}${L.a ? `, ${L.a} assist${L.a > 1 ? "s" : ""}` : ""}.`; }
  else if (k === "stats") { if (G.mode === "career") { const p = pl(G.userPlayer); t = `${G.season}/${(G.season + 1) % 100} so far at ${c.name}: ${p.st.ap} games, ${p.st.g} goals, ${p.st.as} assists, ${p.o} overall.`; } else { const lg = leagueOf(c), pos = sortTable(lg.table, lg.clubs).indexOf(c.id) + 1; t = `${c.name} are ${ordinal(pos)} in the ${lg.name}. Board confidence ${Math.round(G.mgr.conf)}.`; } }
  else t = pick(["Bet you can't score more than me this season 😏", "Check the table and weep.", "When are we playing each other?", "Your keeper's still looking for that ball.", "Golden Ball is mine this year."]);
  try { await Online.send(Online.open, t); } catch (e) { toast("Message didn't send."); }
};
A.facUp = (el) => { const r = upgradeFacility(el.dataset.k); toast(r.msg); render(); if (r.ok) autosave(); };
A.life = (el) => { const r = lifeAction(el.dataset.k, el.dataset.v); if (r) toast(r); render(); autosave(); };
A.renameKid = (el) => { const i = +el.dataset.i, v = document.getElementById("kidName" + i).value.trim(); if (v) { G.career.life.kids[i].name = v; toast("Name saved."); render(); } };
A.legacySkip = (el) => {
  const kid = G.career.life.kids[+el.dataset.i], n = seasonsUntil16(kid);
  busy(true, `Skipping ${n} season${n > 1 ? "s" : ""}…`);
  setTimeout(() => { try { for (let k = 0; k < n; k++) fastSeason(); } catch (e) { console.error(e); } busy(false); render(); autosave(); toast(`${kid.name} is now 16.`); }, 40);
};
A.legacyStart = (el) => { startLegacy(+el.dataset.i); faceCache.clear(); UI.page = "career"; render(); autosave(); };
A.goPundit = () => { becomePundit(); render(); autosave(); };
A.goManager = (el) => { openModal("confirm", { title: "Become a manager?", text: "Your save switches to manager mode at this club. Your playing record is kept.", yes: "Take the job", then: () => { switchToManager(+el.dataset.v, false, 0); UI.page = "home"; faceCache.clear(); render(); autosave(); } }); };
A.buyClub = (el) => { const c = club(+el.dataset.v), price = clubPrice(c); openModal("confirm", { title: `Buy ${c.name}?`, text: `It costs ${money(price)}. You'll be the owner and the manager. Your save switches to manager mode.`, yes: "Buy the club", then: () => { switchToManager(c.id, true, price); UI.page = "home"; faceCache.clear(); render(); autosave(); } }); };
A.ownerInvest = (el) => { toast(ownerInvest(+el.dataset.v)); render(); autosave(); };
A.challenge = async (el) => { el.disabled = true; try { const r = await Online.challenge(el.dataset.v); toast(r); } catch (e) { toast("The challenge didn't go through."); } el.disabled = false; };
A.trainInt = (el) => { toast(setIntensity(+el.dataset.v)); render(); autosave(); };
A.trainSess = (el) => { toast(toggleSession(el.dataset.v)); render(); autosave(); };
A.pickTrait = (el) => { G.career.trait = el.dataset.v; toast(`You're a ${TRAITS[el.dataset.v].n.toLowerCase()}.`); render(); autosave(); };
A.train = (el) => { G.career.tf = +el.dataset.v; render(); };
A.creq = (el) => { toast(careerRequest(el.dataset.v)); render(); };
A.retireAsk = () => openModal("confirm", { title: "Retire from football?", text: "Your career ends here. The save stays so you can look back at your record.", yes: "Retire", danger: true, then: () => { retireUser(); render(); autosave(); } });
A.pmTactics = () => { closeModal(); UI.page = "tactics"; render(); };
A.quickSim = (el) => { closeModal(); afterUserMatch(playFixture(G.fx[+el.dataset.id])); };
A.playLive = (el) => { startLive(+el.dataset.id); };
A.lvMent = (el) => { const L = UI.live, s = L.m.sides.find((x) => x.user); s.ment = +el.dataset.v; club(s.cid).ment = s.ment; calcStrength(L.m); renderLive(true); };
A.lvSub = () => { const L = UI.live, m = L.m, s = m.sides.findIndex((x) => x.user); if (!L.subOut || !L.subIn) { toast("Choose who comes off and who goes on."); return; } if (doSub(m, s, +L.subOut, +L.subIn)) { L.subOut = ""; L.subIn = ""; } renderLive(true); };
A.lvPause = () => { const L = UI.live; L.paused = !L.paused; runTimer(); };
A.lvResume = () => { resumeMatch(UI.live.m); UI.live.paused = false; runTimer(); };
A.lvSpeed = (el) => { UI.live.speed = +el.dataset.v; runTimer(); };
A.lvChoice = (el) => { const L = UI.live; if (!L || !L.m.pending) return; L.lastRes = resolveMoment(L.m, el.dataset.v); runTimer(); renderLive(true); };
A.lvSkip = () => { const L = UI.live; clearInterval(L.timer); const m = L.m; if (m.pending) resolveMoment(m, pick(MOMENTS[m.pending.type].o)[0]); m.inter = null; m.sides.forEach((s) => (s.user = false)); m.live = false; let g = 0; while (!m.done && g++ < 400) { if (m.phase === "HT" || m.phase === "ETB") resumeMatch(m); stepMatch(m); } renderLive(); };
A.lvFinish = () => { const m = UI.live.m; clearInterval(UI.live.timer); UI.live = null; UI.modal = null; renderModal(); afterUserMatch(finishMatch(m)); };
A.continue = () => doContinue();
A.saveNow = async () => { await autosave(true); toast("Saved on this device."); };
A.saveCloud = async () => { busy(true, "Saving to cloud…"); try { await Cloud.save(); toast("Saved to the cloud."); } catch (e) { toast(cloudErr(e)); } busy(false); };
A.exportSave = async () => exportSave();
A.toTitle = async () => { await autosave(); Online.stop(); G = null; UI.start = { step: "home" }; UI.page = "home"; await refreshSaves(); render(); };
A.newSlot = async () => { G.id = "s" + Date.now().toString(36); G.name = G.name + " (copy)"; await autosave(true); render(); toast("Saved as a new copy."); };
// start screen
A.startMgr = () => { UI.start = { step: "mgr" }; render(); };
A.startCustom = () => { UI.start = { step: "custom" }; render(); };
A.startCareer = () => { UI.start = { step: "career" }; render(); };
A.startBack = () => { UI.start = { step: "home" }; render(); };
A.pickStartClub = (el) => { UI.start.club = el.dataset.k; render(); };
A.beginMgr = () => {
  const st = UI.start; const [lid, idx] = st.club.split(":");
  const L = LEAGUE_DATA.find((l) => l.id === lid);
  busy(true, "Building the football world…");
  setTimeout(() => {
    let cid = 0; for (const l of LEAGUE_DATA) { if (l.id === lid) { cid += +idx; break; } cid += l.clubs.trim().split("\n").length; }
    const nm = clubsOfLeagueData(lid)[+idx].name;
    newWorld({ mode: "manager", real: st.real !== false, clubId: cid, managerName: st.mgrName || "Manager", saveName: st.saveName || nm + " " + 2026 });
    afterNewGame();
  }, 30);
};
A.cuRandom = () => { const st = UI.start; st.names = null; render(); };
A.beginCustom = () => {
  const st = UI.start, cu = st.cu;
  if (!cu.name.trim()) { toast("Give your club a name first."); return; }
  const L = LEAGUE_DATA.find((l) => l.id === cu.lg);
  const reps = L.clubs.trim().split("\n").map((r) => +r.split("|")[2]);
  const mean = reps.reduce((s, x) => s + x, 0) / reps.length;
  const rep = Math.round(clamp(mean + [-6, 0, 6, 14][cu.str], 45, 90));
  busy(true, "Founding your club…");
  setTimeout(() => {
    newWorld({ mode: "manager", real: st.real !== false, managerName: st.mgrName || "Manager", saveName: st.saveName || cu.name, custom: { name: cu.name.trim(), short: (cu.short || cu.name.replace(/[^A-Za-z]/g, "").slice(0, 3)).toUpperCase(), c1: cu.c1, c2: cu.c2, lg: cu.lg, rep, names: st.names.map((n) => [n[0].trim(), n[1].trim() || "Player", n[2]]) } });
    afterNewGame();
  }, 30);
};
A.cpSet = (el) => { const cp = UI.start.cp, k = el.dataset.k; let v = el.dataset.v; if (k === "age" || k === "tal") v = +v; cp[k] = v; render(); };
A.cpFace = (el) => { const cp = UI.start.cp, i = +el.dataset.i; let v = el.dataset.v; if (i !== 2) v = +v; cp.face[i] = v; render(); };
A.cpCycle = (el) => { const cp = UI.start.cp, i = +el.dataset.i; cp.face[i] = (cp.face[i] + 1) % 3; render(); };
A.cpRandFace = () => { const cp = UI.start.cp; cp.face = genFace(cp.nat, cp.age); render(); };
A.cpNoPhoto = () => { UI.start.cp.ph = null; render(); };
A.cpClub = (el) => { UI.start.cp.club = el.dataset.k; render(); };
A.beginCareer = () => {
  const st = UI.start, cp = st.cp;
  if (!cp.ln.trim()) { toast("Enter your player's name first."); return; }
  const [lid, idx] = cp.club.split(":");
  busy(true, "Signing your first contract…");
  setTimeout(() => {
    let cid = 0; for (const l of LEAGUE_DATA) { if (l.id === lid) { cid += +idx; break; } cid += l.clubs.trim().split("\n").length; }
    const t = TALENTS[cp.tal];
    newWorld({ mode: "career", real: st.real !== false, clubId: cid, saveName: st.saveName || `${cp.fn} ${cp.ln}`.trim(), player: { trait: cp.trait, fn: cp.fn.trim(), ln: cp.ln.trim(), nat: cp.nat, pos: cp.pos, foot: cp.foot, age: cp.age, ovr: t[1] - (18 - cp.age), pot: t[2], face: cp.face.slice(), ph: cp.ph } });
    afterNewGame();
  }, 30);
};
A.loadLocal = async (el) => { busy(true, "Loading save…"); try { await loadLocal(el.dataset.id); UI.page = "home"; render(); } catch (e) { toast("That save couldn't be opened."); } busy(false); };
A.delLocalAsk = (el) => openModal("confirm", { title: "Delete this save?", text: "It will be removed from this device for good.", yes: "Delete", danger: true, then: async () => { await Store.del("saves", el.dataset.id); await Store.del("meta", el.dataset.id); await refreshSaves(); render(); } });
A.loadCloud = async (el) => { busy(true, "Downloading save…"); try { await Cloud.load(el.dataset.id); await autosave(true); UI.page = "home"; render(); } catch (e) { toast(cloudErr(e)); } busy(false); };
A.delCloudAsk = (el) => openModal("confirm", { title: "Delete this cloud save?", text: "It will be removed from the cloud for good. Copies on your devices stay.", yes: "Delete", danger: true, then: async () => { busy(true, "Deleting…"); try { await Cloud.del(el.dataset.id); await refreshCloud(); } catch (e) { toast(cloudErr(e)); } busy(false); render(); } });
A.refreshCloud = async () => { await refreshCloud(); render(); };

function refresh() { if (UI.modal && UI.modal.kind === "club") renderModal(); else render(); }
function afterNewGame() { UI.page = "home"; UI.start = { step: "home" }; busy(false); render(); autosave(true); onlineGameLoaded(); }
function onlineGameLoaded() { if (!Online.available()) return; Online.stop(); if (Online.state === "ready") Online.ensureProfile().catch(() => {}); else Online.connect(); }

// ---------- game flow ----------
function busy(on, text) {
  let el = document.getElementById("busy");
  if (on) { if (!el) { el = document.createElement("div"); el.id = "busy"; el.className = "loading"; document.body.appendChild(el); } el.textContent = text || "Working…"; el.hidden = false; }
  else if (el) el.hidden = true;
}
function doContinue() {
  if (UI.busy || !G || (G.mode === "career" && G.career && G.career.retired && !G.career.pundit)) return;
  if (G.sacked && G.mode === "manager") { const m = G.inbox.find((x) => x.act && x.act.kind === "jobs" && !x.done); if (m) openModal("msg", { id: m.id }); return; }
  const pend = G.inbox.find((x) => x.act && x.act.kind === "event" && !x.done);
  if (pend) { pend.read = true; render(); openModal("msg", { id: pend.id }); return; }
  const today = userFxOn(G.day);
  if (today && !today.p) { openModal("prematch", { f: today.i }); return; }
  const seasonEnd = G.day >= (G.seasonEnd || SEASON_END) - 1 || (!nextUserFx() && G.day > 280);
  UI.busy = true;
  if (seasonEnd) busy(true, "Wrapping up the season…");
  setTimeout(() => {
    let r;
    try { r = advance(60); } catch (e) { console.error(e); UI.busy = false; busy(false); toast("Something went wrong while simulating."); return; }
    UI.busy = false; busy(false);
    UI.sel = null;
    if (r.stop === "match") { render(); openModal("prematch", { f: r.f.i }); }
    else if (r.stop === "season") { render(); openModal("season", { summary: G.inbox[0] ? G.inbox[0].b : "" }); }
    else if (r.stop === "inbox") { const m = G.inbox.find((x) => x.act && !x.done); render(); if (m) { m.read = true; openModal("msg", { id: m.id }); } }
    else if (r.stop === "sacked") { const m = G.inbox.find((x) => x.act && x.act.kind === "jobs" && !x.done); render(); if (m) openModal("msg", { id: m.id }); }
    else render();
    autosave();
  }, seasonEnd ? 40 : 0);
}
function afterUserMatch(m) {
  const f = m.f;
  simDayFixtures(false);
  endDay();
  render();
  autosave();
  if (G.mode === "career" && G.career.last && G.career.last.f === f.i) { const L = G.career.last; toast(`You played: rating ${L.r.toFixed(1)}${L.g ? `, ${L.g} goal${L.g > 1 ? "s" : ""}` : ""}${L.a ? `, ${L.a} assist${L.a > 1 ? "s" : ""}` : ""}.`); }
  openModal("report", { id: f.i });
}

// ---------- storage ----------
const Store = {
  dbp: null,
  idb() {
    if (!this.dbp) this.dbp = new Promise((res, rej) => { try { const r = indexedDB.open("touchline", 1); r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("saves"); d.createObjectStore("meta"); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
    return this.dbp;
  },
  async tx(store, mode, fn) { const d = await this.idb(); return new Promise((res, rej) => { const t = d.transaction(store, mode); const r = fn(t.objectStore(store)); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); },
  put(s, k, v) { return this.tx(s, "readwrite", (o) => o.put(v, k)); },
  get(s, k) { return this.tx(s, "readonly", (o) => o.get(k)); },
  del(s, k) { return this.tx(s, "readwrite", (o) => o.delete(k)); },
  all(s) { return this.tx(s, "readonly", (o) => o.getAll()); },
};
async function gzip(str) {
  if (!window.CompressionStream) return null;
  const s = new Blob([str]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(s).arrayBuffer());
}
async function gunzip(u8) { const s = new Blob([u8]).stream().pipeThrough(new DecompressionStream("gzip")); return new Response(s).text(); }
function metaOf() {
  const c = club(G.userClub);
  return { id: G.id, name: G.name, mode: G.mode, club: c.name, clubId: c.id, c1: c.c1, c2: c.c2, short: c.short, season: G.season, day: G.day, saved: Date.now(), player: G.mode === "career" ? fullName(pl(G.userPlayer)) : G.mgr.name };
}
let saving = null, saveAgain = false;
async function autosave(force) {
  if (!G) return;
  if (saving) { saveAgain = true; return saving; }
  saving = (async () => {
    try {
      const json = JSON.stringify(G);
      const gz = await gzip(json);
      await Store.put("saves", G.id, gz ? { gz } : { json });
      await Store.put("meta", G.id, metaOf());
      UI.lastSaved = Date.now();
      Online.pushProfile();
      const d = document.querySelector(".topbar .date span"); if (d && !/saved/.test(d.textContent)) d.textContent += " · saved";
    } catch (e) { if (force) toast("This browser blocked local storage. Use Save to cloud or Export instead."); }
  })();
  await saving; saving = null;
  if (saveAgain) { saveAgain = false; return autosave(); }
}
function loadJSON(json) {
  const g = JSON.parse(json);
  if (!g || !g.clubs || !g.players || !g.fx) throw new Error("bad save");
  G = g; migrateSave(); rebuildIdx(); faceCache.clear(); UI.sel = null;
  if (typeof onlineGameLoaded === "function") setTimeout(onlineGameLoaded, 0);
}
async function loadLocal(id) { const rec = await Store.get("saves", id); if (!rec) throw new Error("missing"); loadJSON(rec.gz ? await gunzip(rec.gz) : rec.json); }
async function refreshSaves() { try { UI.saves = (await Store.all("meta")) || []; } catch (e) { UI.saves = []; } }
async function exportSave() {
  const json = JSON.stringify(G);
  try {
    const filename = (G.name || "touchline").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") + ".json";
    if (!IN_CLAUDE) {
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast("Save file downloaded."); return;
    }
    const dl = await window.claude.use("downloads");
    if (!dl) { toast("File downloads aren't available in this view."); return; }
    await dl.save({ filename, data: json });
    toast("Save file exported.");
  } catch (e) { if (!e || e.code !== "declined") toast("Export didn't complete."); }
}
async function importFile(file) {
  busy(true, "Importing save…");
  try {
    let text;
    if (/\.gz$/i.test(file.name)) text = await gunzip(new Uint8Array(await file.arrayBuffer())); else text = await file.text();
    loadJSON(text);
    await autosave(true); UI.page = "home"; render(); toast("Save imported.");
  } catch (e) { toast("That file isn't a Touchline save."); }
  busy(false);
}
function b64(u8) { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(s) { const bin = atob(s); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8; }
const CHUNK = 190000;
const Cloud = {
  db: null, uid: null,
  async init() {
    try {
      if (!window.claude || !window.claude.use) return;
      const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
      if (!db || !user) return;
      const uid = await user.id(); if (!uid) return;
      this.db = db; this.uid = uid; UI.cloudOk = true;
      await refreshCloud(); if (!G) render(); else if (UI.page === "saves") render();
    } catch (e) { /* cloud stays off */ }
  },
  base() { return "data/users/" + this.uid; },
  async list() { const s = await this.db.collection(this.base()).get(); return s.docs.map((d) => ({ ...d.data(), id: d.id })).filter((x) => x.n); },
  async save() {
    const json = JSON.stringify(G);
    const gz = await gzip(json);
    const data = gz ? b64(gz) : json;
    const n = Math.ceil(data.length / CHUNK);
    const metaRef = this.db.doc(`${this.base()}/${G.id}`);
    const old = await metaRef.get();
    for (let i = 0; i < n; i++) await this.db.doc(`${this.base()}/${G.id}/c/${i}`).set({ d: data.slice(i * CHUNK, (i + 1) * CHUNK) });
    const oldN = old.exists ? old.data().n || 0 : 0;
    for (let i = n; i < oldN; i++) await this.db.doc(`${this.base()}/${G.id}/c/${i}`).delete();
    await metaRef.set({ ...metaOf(), n, z: gz ? 1 : 0 });
    await refreshCloud();
  },
  async load(id) {
    const meta = await this.db.doc(`${this.base()}/${id}`).get();
    if (!meta.exists) throw { code: "missing" };
    const m = meta.data(); let data = "";
    for (let i = 0; i < m.n; i++) { const d = await this.db.doc(`${this.base()}/${id}/c/${i}`).get(); data += d.data().d; }
    loadJSON(m.z ? await gunzip(unb64(data)) : data);
  },
  async del(id) {
    const meta = await this.db.doc(`${this.base()}/${id}`).get();
    const n = meta.exists ? meta.data().n || 0 : 0;
    for (let i = 0; i < n; i++) await this.db.doc(`${this.base()}/${id}/c/${i}`).delete();
    await this.db.doc(`${this.base()}/${id}`).delete();
  },
};
async function refreshCloud() { if (!UI.cloudOk) return; try { UI.cloud = await Cloud.list(); } catch (e) { UI.cloud = []; } }
function cloudErr(e) {
  const c = e && e.code;
  if (c === "quota_exceeded") return "Cloud storage is full. Delete an old cloud save and try again.";
  if (c === "invalid_argument") return "You need edit access to this page to save to the cloud.";
  if (c === "resource_exhausted") return "Too many requests. Wait a moment and try again.";
  if (c === "missing") return "That cloud save no longer exists.";
  return "The cloud save didn't go through. Try again in a moment.";
}

// photo upload → small square JPEG data URL
function readPhoto(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => { const img = new Image(); img.onload = () => { const S = 160, cv = document.createElement("canvas"); cv.width = S; cv.height = S; const ctx = cv.getContext("2d"); const s = Math.min(img.width, img.height); ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2 * 0.6, s, s, 0, 0, S, S); res(cv.toDataURL("image/jpeg", 0.82)); }; img.onerror = rej; img.src = fr.result; };
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}

// ---------- events ----------
document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-a]");
  if (!el) return;
  const fn = A[el.dataset.a];
  if (!fn) return;
  if (el.dataset.a === "scrim") { fn(el, ev); return; }
  ev.preventDefault();
  fn(el, ev);
});
const CH = {};
CH.startLg = (el) => { UI.start.lg = el.value; UI.start.club = null; render(); };
CH.kidSchool = (el) => { if (!el.value) return; toast(setSchool(+el.dataset.i, el.value)); render(); autosave(); };
CH.kidTrain = (el) => { toast(setTraining(+el.dataset.i, +el.value)); render(); autosave(); };
CH.startReal = (el) => { UI.start.real = el.checked; };
CH.startField = (el) => { UI.start[el.dataset.k] = el.value; };
CH.cuField = (el) => { const cu = UI.start.cu; const k = el.dataset.k; cu[k] = k === "str" ? +el.value : el.value; if (k === "nat") UI.start.names = null; if (k === "lg") { cu.nat = LEAGUE_DATA.find((l) => l.id === cu.lg).nat; UI.start.names = null; } if (k !== "name" && k !== "short") render(); else { const pv = document.querySelector(".start h2"); if (pv && k === "name") pv.textContent = el.value || "Your club"; } };
CH.cuName = (el) => { UI.start.names[+el.dataset.i][+el.dataset.j] = el.value; };
CH.cpField = (el) => { const cp = UI.start.cp; cp[el.dataset.k] = el.value; if (el.dataset.k === "lg") { cp.club = null; render(); } if (el.dataset.k === "nat") { cp.face = genFace(cp.nat, cp.age); render(); } };
CH.cpPhoto = async (el) => { const f = el.files[0]; if (!f) return; try { UI.start.cp.ph = await readPhoto(f); render(); } catch (e) { toast("That image couldn't be read."); } };
CH.epPhoto = async (el) => { const f = el.files[0]; if (!f) return; try { pl(+el.dataset.id).ph = await readPhoto(f); renderModal(); render(); } catch (e) { toast("That image couldn't be read."); } };
CH.import = (el) => { const f = el.files[0]; if (f) importFile(f); };
CH.formation = (el) => { const c = club(G.userClub); c.form = el.value; if (c.auto) autoLineup(c); else validateUserLineup(c); render(); };
CH.autoPick = (el) => { const c = club(G.userClub); c.auto = el.checked; if (c.auto) autoLineup(c); render(); };
CH.compLg = (el) => { UI.comp.lg = el.value; render(); };
CH.compCup = (el) => { UI.comp.cup = el.value; render(); };
CH.ts = (el) => { const k = el.dataset.k; UI.ts[k] = el.type === "checkbox" ? el.checked : el.value; UI.ts.pg = 0; const id = el.id; render(); if (id && el.type !== "checkbox" && el.tagName === "INPUT") { const n = document.getElementById(id); if (n) { n.focus(); try { n.setSelectionRange(n.value.length, n.value.length); } catch (e) {} } } };
CH.gName = (el) => { G.name = el.value.trim() || G.name; autosave(); };
CH.lvOut = (el) => { UI.live.subOut = el.value; };
CH.lvIn = (el) => { UI.live.subIn = el.value; };
document.addEventListener("change", (ev) => { const el = ev.target.closest("[data-c]"); if (el && CH[el.dataset.c] && el.dataset.c !== "ts") CH[el.dataset.c](el); else if (el && el.dataset.c === "ts" && (el.tagName === "SELECT" || el.type === "checkbox")) CH.ts(el); });
let tsTimer = null;
document.addEventListener("input", (ev) => {
  const el = ev.target.closest("[data-c]"); if (!el) return;
  const c = el.dataset.c;
  if (c === "ts" && el.tagName === "INPUT" && el.type !== "checkbox") { clearTimeout(tsTimer); tsTimer = setTimeout(() => CH.ts(el), 280); }
  else if (c === "startField" || c === "cuName" || (c === "cpField" && el.tagName === "INPUT") || (c === "cuField" && (el.dataset.k === "name" || el.dataset.k === "short"))) CH[c](el);
});
document.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && ev.target && ev.target.id === "chatInput") { ev.preventDefault(); A.phoneSend(); return; } if (ev.key === "Enter" && ev.target && ev.target.id === "friendCode") { ev.preventDefault(); A.phoneAdd(); return; } if (ev.key === "Escape" && UI.modal && UI.modal.kind !== "live" && UI.modal.kind !== "prematch") closeModal(); });


// ---------- self-update (hosted site) ----------
const BUILD = "202610141712";
async function checkForUpdate() {
  if (typeof IN_CLAUDE !== "undefined" && IN_CLAUDE) return;
  if (!location.protocol.startsWith("http")) return;
  try {
    const r = await fetch("version.txt?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return;
    const v = (await r.text()).trim();
    if (v && v !== BUILD) showUpdateBanner(v);
  } catch (e) { /* offline */ }
}
function showUpdateBanner(v) {
  if (document.getElementById("updBar")) return;
  const el = document.createElement("div");
  el.id = "updBar"; el.className = "toast"; el.style.cursor = "pointer"; el.style.bottom = "calc(90px + env(safe-area-inset-bottom, 0px))";
  el.textContent = "A new version of Touchline is ready. Tap to update.";
  el.onclick = async () => { el.textContent = "Updating…"; try { await autosave(true); } catch (e) {} location.replace(location.pathname + "?v=" + v); };
  document.body.appendChild(el);
}
setTimeout(checkForUpdate, 1500);
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkForUpdate(); });

// ---------- boot ----------
async function boot(data) {
  await refreshSaves();
  if (data && data.id) { try { await loadLocal(data.id); UI.page = data.page || "home"; } catch (e) { G = null; } }
  render();
  Cloud.init();
}
try { window.claude && window.claude.hot && window.claude.hot.snapshot && window.claude.hot.snapshot(() => ({ id: G ? G.id : null, page: UI.page })); } catch (e) {}
(function start() {
  const go = (d) => boot(d || {});
  try { if (window.claude && window.claude.hot && window.claude.hot.ready) { window.claude.hot.ready(go); return; } go(window.claude && window.claude.hot ? window.claude.hot.data : {}); } catch (e) { go({}); }
})();
