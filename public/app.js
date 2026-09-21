/* LiveTube — YouTube Live viewer on Cloudflare Pages.
 * Catalog is generated from list2.txt (English-only) by scripts/build-catalog.mjs.
 * Live status is quota-free, detected via /api/status (public page pings).
 */

const CATALOG_URL = "/catalog.json";
const FAV_KEY = "lt_favs";
const HISTORY_KEY = "lt_history";
const CUSTOM_KEY = "lt_custom";
const STATUS_KEY = "lt_status";
const THEME_KEY = "lt_theme";
const ACCENT_KEY = "lt_accent";
const STATUS_TTL = 60000;
const BATCH_SIZE = 12;
const MAX_CONCURRENT_BATCHES = 3;

const state = {
  channels: [],
  byKey: new Map(),
  presets: [],
  activePreset: "",
  activeKey: null,
  query: "",
  liveOnly: false,
};

const DEFAULT_CHANNEL = "h:lofigirl";

const $ = (s) => document.querySelector(s);
const sidebarList = $("#sidebarList");
const grid = $("#grid");
const playerFrame = $("#playerFrame");
const playerEmpty = $("#playerEmpty");
const chanInfo = $("#chanInfo");
const chanAvatar = $("#chanAvatar");
const chanLive = $("#chanLive");
const chanName = $("#chanName");
const chanTitle = $("#chanTitle");
const chanCat = $("#chanCat");
const openYt = $("#openYt");
const chatBody = $("#chatBody");
const chatEmpty = $("#chatEmpty");
const toastEl = $("#toast");
const favBtn = $("#favBtn");
const copyBtn = $("#copyBtn");
const presetNav = $("#presetNav");
const discoverTitle = $("#discoverTitle");
const discoverSub = $("#discoverSub");
const filterInput = $("#filterInput");
const liveOnlyBtn = $("#liveOnlyBtn");
const unmuteBtn = $("#unmuteBtn");
const shuffleBtn = $("#shuffleBtn");
const jumpBtn = $("#jumpBtn");
const helpBtn = $("#helpBtn");
const helpModal = $("#helpModal");
const helpClose = $("#helpClose");
const searchSuggest = $("#searchSuggest");
const sleepBtn = $("#sleepBtn");

let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2600);
}

const AVATAR_COLORS = ["#9147ff", "#ff5c5c", "#2db85c", "#e6a116", "#0e8ee9", "#e9198c", "#00c7b0", "#f06d1a"];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initial(name) {
  return String(name).trim().charAt(0).toUpperCase();
}
function fmtViewers(n) {
  if (n == null) return null;
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function loadStore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

/* Failed remote images fall back to the generated avatar/initial. */
document.addEventListener("error", (e) => {
  const t = e.target;
  if (t && t.tagName === "IMG" && t.dataset.fallback === "remove") t.remove();
}, true);

/* ── Channel model ─────────────────────────────────────────── */

function keyOf(entry) {
  if (entry.key) return entry.key;
  if (entry.handle) return "h:" + entry.handle.toLowerCase();
  if (entry.id) return "c:" + entry.id;
  if (entry.videoId) return "v:" + entry.videoId;
  return "n:" + String(entry.name).toLowerCase();
}

function makeChannel(entry) {
  const key = keyOf(entry);
  return {
    ...entry,
    key,
    id: entry.id ?? null,
    handle: entry.handle ?? null,
    videoId: entry.videoId ?? null,
    liveUrl: entry.liveUrl ?? null,
    live: entry.live ?? null,
    viewers: entry.viewers ?? null,
  };
}

function register(ch) {
  if (!state.byKey.has(ch.key)) {
    state.channels.push(ch);
    state.byKey.set(ch.key, ch);
  }
}

const favorites = new Set(loadStore(FAV_KEY, []));
const recentHistory = loadStore(HISTORY_KEY, []);

function toggleFavorite(key) {
  if (favorites.has(key)) favorites.delete(key);
  else favorites.add(key);
  saveStore(FAV_KEY, [...favorites]);
  scheduleRender();
}

function pushHistory(key) {
  const idx = recentHistory.indexOf(key);
  if (idx !== -1) recentHistory.splice(idx, 1);
  recentHistory.unshift(key);
  if (recentHistory.length > 10) recentHistory.pop();
  saveStore(HISTORY_KEY, recentHistory);
}

/* ── Presets & routing ─────────────────────────────────────── */

function presetMeta(slug) {
  if (!slug) return { slug: "", title: "Live channels", blurb: "Popular channels streaming around the clock — music, news, cams and more." };
  if (slug === "favorites") return { slug, title: "Favorites", blurb: "Channels you starred. Press F while watching to pin one here." };
  if (slug === "recent") return { slug, title: "Recently watched", blurb: "Pick up where you left off." };
  if (slug === "community") return { slug, title: "Community", blurb: "Channels added through the admin panel." };
  return state.presets.find((p) => p.slug === slug) || { slug: "", title: "Live channels", blurb: "" };
}

function allPresets() {
  const list = [{ slug: "", title: "Home" }, ...state.presets.map((p) => ({ slug: p.slug, title: p.title }))];
  if (state.channels.some((c) => c.group === "Community")) list.push({ slug: "community", title: "Community" });
  if (recentHistory.length) list.push({ slug: "recent", title: "Recent" });
  list.push({ slug: "favorites", title: "Favorites" });
  return list;
}

function rawChannelsForPreset(slug) {
  if (slug === "favorites") return state.channels.filter((c) => favorites.has(c.key));
  if (slug === "recent") return recentHistory.map((k) => state.byKey.get(k)).filter(Boolean);
  if (slug === "community") return state.channels.filter((c) => c.group === "Community");
  if (!slug) return state.channels;
  const p = state.presets.find((x) => x.slug === slug);
  if (!p) return state.channels;
  const groups = new Set(p.groups);
  return state.channels.filter((c) => groups.has(c.group));
}

function channelsForPreset(slug) {
  let list = rawChannelsForPreset(slug);
  if (state.liveOnly) list = list.filter((c) => c.live === true);
  const q = state.query.trim().toLowerCase();
  if (q) list = list.filter((c) => `${c.name} ${c.cat}`.toLowerCase().includes(q));
  return list;
}

function slugFromPath(pathname) {
  const slug = pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!slug) return "";
  const known = allPresets().some((p) => p.slug === slug);
  return known ? slug : "";
}

function navigate(slug, { replace = false } = {}) {
  const path = slug ? `/${slug}` : "/";
  if (replace) history.replaceState({ slug }, "", path);
  else history.pushState({ slug }, "", path);
  state.activePreset = slug;
  state.query = "";
  if (filterInput) filterInput.value = "";
  renderPresetNav();
  renderGrid();
  renderSidebar();
  refreshVisible();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ── Live status: batched, cached, lazy ────────────────────── */

const statusCache = new Map();
(function hydrateStatus() {
  const saved = loadStore(STATUS_KEY, {});
  const now = Date.now();
  for (const [key, entry] of Object.entries(saved)) {
    if (entry && now - entry.t < STATUS_TTL) statusCache.set(key, entry);
  }
})();
function persistStatus() {
  const out = {};
  for (const [k, v] of statusCache) out[k] = v;
  saveStore(STATUS_KEY, out);
}

const pending = new Set();
let flushTimer = null;
let inFlightBatches = 0;
let renderScheduled = false;

function scheduleRender() {
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => {
    renderScheduled = false;
    renderPresetNav();
    renderGrid();
    renderSidebar();
    renderChanInfo();
  });
}

function cachedStatus(key) {
  const entry = statusCache.get(key);
  if (entry && Date.now() - entry.t < STATUS_TTL) return entry.v;
  return null;
}

function applyStatus(key, s) {
  const ch = state.byKey.get(key);
  if (!ch || !s) return;
  ch.live = s.live === true ? true : s.live === false ? false : null;
  if (s.videoId) ch.videoId = s.videoId;
  if (s.viewers != null) ch.viewers = s.viewers;
  if (s.channelId && !ch.id) ch.id = s.channelId;
  statusCache.set(key, {
    t: Date.now(),
    v: { live: ch.live, videoId: ch.videoId, viewers: ch.viewers, id: ch.id },
  });
}

function requestStatus(ch) {
  if (!ch) return;
  const cached = cachedStatus(ch.key);
  if (cached) {
    applyStatus(ch.key, { live: cached.live, videoId: cached.videoId, viewers: cached.viewers, channelId: cached.id });
    return;
  }
  pending.add(ch.key);
  if (!flushTimer) flushTimer = setTimeout(flushStatus, 60);
}

async function flushStatus() {
  flushTimer = null;
  if (inFlightBatches >= MAX_CONCURRENT_BATCHES) {
    flushTimer = setTimeout(flushStatus, 120);
    return;
  }
  const keys = [...pending].slice(0, BATCH_SIZE);
  keys.forEach((k) => pending.delete(k));
  const chans = keys.map((k) => state.byKey.get(k)).filter(Boolean);
  if (!chans.length) return;

  inFlightBatches++;
  try {
    const payload = {
      channels: chans.map((c) => ({ key: c.key, handle: c.handle, id: c.id, videoId: c.videoId, liveUrl: c.liveUrl })),
    };
    const r = await fetch("/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(String(r.status));
    const data = await r.json();
    for (const [key, s] of Object.entries(data.statuses ?? {})) applyStatus(key, s);
    persistStatus();
  } catch {
    for (const c of chans) {
      if (!statusCache.has(c.key)) statusCache.set(c.key, { t: Date.now(), v: { live: null, videoId: c.videoId, viewers: null, id: c.id } });
    }
  } finally {
    inFlightBatches--;
    scheduleRender();
    if (pending.size) {
      if (!flushTimer) flushTimer = setTimeout(flushStatus, 40);
    }
  }
}

/* Lazily check cards as they scroll into view. */
const cardObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const key = entry.target.dataset.key;
    if (key) requestStatus(state.byKey.get(key));
    cardObserver.unobserve(entry.target);
  }
}, { rootMargin: "200px 0px" });

function observeCards() {
  cardObserver.disconnect();
  grid.querySelectorAll(".card[data-key]").forEach((el) => cardObserver.observe(el));
}

function refreshVisible() {
  const chans = channelsForPreset(state.activePreset);
  const limit = state.activePreset ? chans.length : Math.min(chans.length, 36);
  chans.slice(0, limit).forEach(requestStatus);
}

/* ── Rendering ─────────────────────────────────────────────── */

function renderPresetNav() {
  const presets = allPresets();
  presetNav.innerHTML = "";
  for (const p of presets) {
    const count = rawChannelsForPreset(p.slug).filter((c) => c.live === true).length;
    const btn = document.createElement("a");
    btn.className = "tab" + (p.slug === state.activePreset ? " tab-active" : "");
    btn.href = p.slug ? `/${p.slug}` : "/";
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", p.slug === state.activePreset ? "true" : "false");
    btn.innerHTML = `${esc(p.title)}${count ? `<span class="tab-count">${count}</span>` : ""}`;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(p.slug);
    });
    presetNav.appendChild(btn);
  }

  const meta = presetMeta(state.activePreset);
  if (discoverTitle) discoverTitle.textContent = meta.title;
  if (discoverSub) discoverSub.textContent = meta.blurb;
  if (liveOnlyBtn) liveOnlyBtn.setAttribute("aria-checked", state.liveOnly ? "true" : "false");
}

function statusText(ch) {
  const v = fmtViewers(ch.viewers);
  return ch.live === true
    ? `Live now${v ? ` · ${v} watching` : ""}`
    : ch.live === false ? "Offline" : "Checking status…";
}

function renderSidebar() {
  const visible = channelsForPreset(state.activePreset);
  const sorted = [...visible].sort((a, b) => {
    if (a.live !== b.live) return (b.live === true) - (a.live === true);
    return (b.viewers ?? 0) - (a.viewers ?? 0);
  });
  sidebarList.innerHTML = "";
  if (!sorted.length) {
    sidebarList.innerHTML = `<p class="sidebar-empty">Nothing here yet.</p>`;
    return;
  }
  for (const ch of sorted) {
    const btn = document.createElement("button");
    btn.className = "sidebar-item" + (ch.key === state.activeKey ? " active" : "");
    const v = fmtViewers(ch.viewers);
    const status = statusText(ch);
    btn.innerHTML = `
      <span class="side-avatar" style="background:${avatarColor(ch.name)}">
        <span class="avatar-initial">${initial(ch.name)}</span>
        ${ch.logo ? `<img class="avatar-img" data-fallback="remove" src="${esc(ch.logo)}" alt="" loading="lazy" />` : ""}
        ${ch.live ? '<span class="live-dot"></span>' : ""}
      </span>
      <span class="side-main">
        <span class="side-name">${esc(ch.name)}</span>
        <span class="side-cat">${esc(ch.cat)}</span>
        <span class="hovercard" role="tooltip">
          <p class="hovercard-title">${esc(ch.name)}</p>
          <p class="hovercard-sub">${esc(ch.cat)}</p>
          <p class="hovercard-sub">${status}</p>
        </span>
      </span>
      <span class="side-right">${ch.live && v ? `<span class="live-dot"></span>${v}` : ""}</span>`;
    btn.addEventListener("click", () => selectChannel(ch.key));
    sidebarList.appendChild(btn);
  }
}

function cardThumb(ch) {
  if (ch.videoId) {
    return `<img class="thumb-img" data-fallback="remove" src="https://i.ytimg.com/vi/${esc(ch.videoId)}/mqdefault.jpg" alt="" loading="lazy" />`;
  }
  if (ch.logo) {
    return `<img class="thumb-logo" data-fallback="remove" src="${esc(ch.logo)}" alt="" loading="lazy" />`;
  }
  return `<span class="card-initial">${initial(ch.name)}</span>`;
}

function createCard(ch, i) {
  const card = document.createElement("button");
  card.className = "card" + (ch.key === state.activeKey ? " active" : "");
  card.dataset.key = ch.key;
  card.style.animationDelay = `${Math.min(i * 30, 360)}ms`;

  const badge = ch.live === true
    ? `<span class="card-live-tag">LIVE</span>`
    : ch.live === false
      ? `<span class="card-offline-tag">OFFLINE</span>`
      : `<span class="card-offline-tag skeleton" style="width:44px;height:18px;border-radius:4px;"></span>`;
  const v = fmtViewers(ch.viewers);
  const viewers = ch.live && v
    ? `<span class="card-viewers-tag"><span class="live-dot"></span>${v}</span>`
    : "";

  card.innerHTML = `
    <span class="card-thumb">${cardThumb(ch)}<span class="card-badges">${badge}${viewers}</span></span>
    <span class="card-body">
      <span class="card-avatar" style="background:${avatarColor(ch.name)}">
        <span class="avatar-initial">${initial(ch.name)}</span>
        ${ch.logo ? `<img class="avatar-img" data-fallback="remove" src="${esc(ch.logo)}" alt="" loading="lazy" />` : ""}
      </span>
      <span class="card-main">
        <span class="card-name">${esc(ch.name)}</span>
        <span class="card-cat">${esc(ch.cat)}</span>
      </span>
    </span>`;
  card.addEventListener("click", () => selectChannel(ch.key));
  return card;
}

const GROUP_ORDER = [
  "International News", "News", "Music", "Radio", "Livecam", "Camera",
  "Times Square", "webcam", "Weather", "Space & Earth", "Documentary",
  "Kids", "Entertainment", "Wrestling", "Political Podcast", "Business",
  "Sports", "Community",
];

function groupedList(list) {
  const map = new Map();
  for (const ch of list) {
    if (!map.has(ch.group)) map.set(ch.group, []);
    map.get(ch.group).push(ch);
  }
  const rank = (g) => {
    const i = GROUP_ORDER.indexOf(g);
    return i === -1 ? 999 : i;
  };
  return [...map.keys()]
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((g) => [g, map.get(g)]);
}

function renderGrid() {
  const visible = channelsForPreset(state.activePreset);
  grid.innerHTML = "";

  if (!visible.length) {
    const filtered = Boolean(state.query.trim()) || state.liveOnly;
    const isFav = state.activePreset === "favorites";
    const title = filtered ? "No matches" : isFav ? "No favorites yet" : "No channels here";
    const desc = filtered
      ? "Try a different filter, or turn off “Live only”."
      : isFav
        ? "Star channels with the ☆ button or press F while watching to pin them here."
        : "This preset has no channels yet.";
    grid.classList.remove("grid--grouped");
    grid.innerHTML = `
      <div class="empty">
        <span class="empty-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
        </span>
        <p class="empty-title">${title}</p>
        <p class="empty-desc">${desc}</p>
      </div>`;
    return;
  }

  const isFiltered = Boolean(state.query.trim()) || state.liveOnly;
  const canGroup = !isFiltered && state.activePreset !== "favorites" && state.activePreset !== "recent";

  if (canGroup) {
    grid.classList.add("grid--grouped");
    let i = 0;
    for (const [groupName, chans] of groupedList(visible)) {
      const section = document.createElement("section");
      section.className = "grid-section";
      const liveCount = chans.filter((c) => c.live === true).length;
      const head = document.createElement("h3");
      head.className = "grid-section-title";
      head.innerHTML = `${esc(groupName)}<span class="grid-section-count">${chans.length}${liveCount ? ` · ${liveCount} live` : ""}</span>`;
      const inner = document.createElement("div");
      inner.className = "grid";
      for (const ch of chans) inner.appendChild(createCard(ch, i++));
      section.appendChild(head);
      section.appendChild(inner);
      grid.appendChild(section);
    }
  } else {
    grid.classList.remove("grid--grouped");
    visible.forEach((ch, i) => grid.appendChild(createCard(ch, i)));
  }
  observeCards();
}

function renderChanInfo() {
  const ch = state.byKey.get(state.activeKey);
  if (!ch || chanInfo.hidden) return;
  chanLive.hidden = !ch.live;
  chanAvatar.textContent = initial(ch.name);
  chanAvatar.style.background = avatarColor(ch.name);
  chanAvatar.classList.toggle("is-live", Boolean(ch.live));
  chanName.textContent = ch.name;
  chanTitle.textContent = ch.live === true
    ? (ch.viewers != null ? `${fmtViewers(ch.viewers)} watching now` : "Live now")
    : ch.live === false
      ? "Offline — showing the latest stream embed."
      : "Live status unknown.";
  chanCat.textContent = ch.cat;
  openYt.href = ch.videoId
    ? `https://www.youtube.com/watch?v=${ch.videoId}`
    : ch.id
      ? `https://www.youtube.com/channel/${ch.id}`
      : ch.handle
        ? `https://www.youtube.com/@${ch.handle}`
        : ch.liveUrl || "#";
}

/* ── Playback ──────────────────────────────────────────────── */

function embedUrl(ch, { autoplay = true, muted = false } = {}) {
  if (!ch.videoId && !ch.id) return null;
  const base = ch.videoId
    ? `https://www.youtube.com/embed/${ch.videoId}`
    : `https://www.youtube.com/embed/live_stream?channel=${ch.id}`;
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    rel: "0",
    playsinline: "1",
    enablejsapi: "1",
  });
  if (muted) params.set("mute", "1");
  return `${base}?${params}`;
}

const playerState = { muted: false };

function ytCommand(func, args = []) {
  const frame = playerFrame.querySelector("iframe");
  if (!frame) return;
  try {
    frame.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  } catch { /* cross-origin guard */ }
}

function unmute() {
  if (!playerState.muted) return;
  ytCommand("unMute");
  ytCommand("setVolume", [100]);
  playerState.muted = false;
  unmuteBtn.hidden = true;
}

unmuteBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  unmute();
});
document.addEventListener("pointerdown", unmute);
document.addEventListener("keydown", unmute);

async function selectChannel(key, { autoplay = true, muted = false } = {}) {
  const ch = state.byKey.get(key);
  if (!ch) return;
  state.activeKey = key;

  if (!ch.videoId && !ch.id) {
    toast("Resolving channel…");
    const cached = cachedStatus(ch.key);
    if (cached) {
      applyStatus(ch.key, { live: cached.live, videoId: cached.videoId, viewers: cached.viewers, channelId: cached.id });
    } else {
      pending.add(ch.key);
      flushStatus();
      await new Promise((resolve) => {
        let tries = 0;
        const iv = setInterval(() => {
          tries++;
          if (ch.videoId || ch.id || tries > 40) {
            clearInterval(iv);
            resolve();
          }
        }, 250);
      });
    }
    scheduleRender();
  }

  const url = embedUrl(ch, { autoplay, muted });
  if (!url) {
    toast("Could not resolve this channel — try Refresh");
    return;
  }

  playerEmpty.hidden = true;
  playerFrame.querySelectorAll("iframe").forEach((f) => f.remove());
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.title = ch.name;
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";
  iframe.setAttribute("allowfullscreen", "");
  playerFrame.classList.remove("switching");
  void playerFrame.offsetWidth;
  playerFrame.classList.add("switching");
  playerFrame.appendChild(iframe);

  playerState.muted = muted;
  unmuteBtn.hidden = !muted;

  chanInfo.hidden = false;
  renderChanInfo();
  mountChat(ch);
  pushHistory(key);
  scheduleRender();
  if (window.matchMedia("(max-width: 820px)").matches) document.body.classList.add("sidebar-collapsed");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ── Search / add channel ──────────────────────────────────── */

function parseInput(raw) {
  const input = raw.trim();
  if (!input) return null;
  if (/youtu\.?be|youtube\.com/i.test(input)) {
    try {
      const u = new URL(input.startsWith("http") ? input : `https://${input}`);
      const v = u.searchParams.get("v");
      if (v) return { kind: "video", value: v };
      const mChannel = u.pathname.match(/\/channel\/(UC[\w-]{20,})/);
      if (mChannel) return { kind: "channel", value: mChannel[1] };
      const mHandle = u.pathname.match(/\/@([\w.-]+)/);
      if (mHandle) return { kind: "handle", value: mHandle[1] };
      const mUser = u.pathname.match(/^\/(?:c|user)\/([\w.-]+)/);
      if (mUser) return { kind: "handle", value: mUser[1] };
      const mShort = u.pathname.match(/\/live\/([\w-]{6,})/);
      if (mShort) return { kind: "video", value: mShort[1] };
    } catch { /* fall through */ }
  }
  if (/^UC[\w-]{20,}$/.test(input)) return { kind: "channel", value: input };
  if (/^@/.test(input)) return { kind: "handle", value: input.slice(1) };
  if (/^[\w-]{11}$/.test(input)) return { kind: "video", value: input };
  return { kind: "handle", value: input.replace(/^@/, "") };
}

async function loadFromInput(raw) {
  const parsed = parseInput(raw);
  if (!parsed) return toast("Could not parse that — try a channel URL or @handle");

  if (parsed.kind === "video") {
    const key = "v:" + parsed.value;
    let ch = state.byKey.get(key);
    if (!ch) {
      ch = makeChannel({ key, name: "Custom video", cat: parsed.value, videoId: parsed.value, live: true });
      register(ch);
    }
    return selectChannel(key);
  }

  if (parsed.kind === "channel") {
    return addOrSelectChannel({ id: parsed.value, name: "Custom channel", cat: "added via search", group: "Community" });
  }

  toast("Resolving channel…");
  try {
    const r = await fetch(`/api/live?handle=${encodeURIComponent(parsed.value)}`);
    const data = await r.json();
    if (data.channelId || data.videoId) {
      addOrSelectChannel({
        id: data.channelId || null,
        handle: parsed.value,
        name: "@" + parsed.value,
        cat: data.live ? "live now" : "resolved via search",
        group: "Community",
        live: data.live === true ? true : data.live === false ? false : null,
        videoId: data.videoId || null,
        viewers: data.viewers ?? null,
      });
    } else {
      toast(data.error || "Channel not found");
    }
  } catch {
    toast("Resolver unavailable — is the API deployed?");
  }
}

function addOrSelectChannel(partial) {
  const key = keyOf(partial);
  let ch = state.byKey.get(key);
  if (!ch) {
    ch = makeChannel(partial);
    register(ch);
  } else {
    Object.assign(ch, partial);
  }
  scheduleRender();
  selectChannel(key);
  if (ch.live === null) {
    requestStatus(ch);
    setTimeout(scheduleRender, 1500);
  }
}

/* ── Chat ──────────────────────────────────────────────────── */

const chatState = {
  channel: null, after: 0, timer: null, name: null, busy: false,
  inFlight: false, autoscroll: true, seen: new Set(), pending: [],
};

const autoscrollSwitch = $("#autoscrollSwitch");
autoscrollSwitch.addEventListener("click", () => {
  const next = autoscrollSwitch.getAttribute("aria-checked") !== "true";
  autoscrollSwitch.setAttribute("aria-checked", next ? "true" : "false");
  chatState.autoscroll = next;
  if (next) chatBody.scrollTop = chatBody.scrollHeight;
});

function chatName() {
  if (!chatState.name) {
    chatState.name = localStorage.getItem("lt_name") || ("guest-" + Math.random().toString(36).slice(2, 5));
    $("#chatNameLabel").textContent = chatState.name;
  }
  return chatState.name;
}
function nearBottom(el) {
  return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
}
function chatMsgEl(m) {
  const row = document.createElement("div");
  row.dataset.seq = m.seq;
  const mine = chatState.name && m.name === chatState.name;
  row.className = "chat-msg" + (m.sys ? " chat-msg-sys" : mine ? " chat-msg-mine" : "");
  const time = new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (m.sys) {
    row.textContent = m.text;
  } else {
    row.innerHTML = `<span class="chat-msg-head"><span class="chat-msg-name" style="color:${avatarColor(m.name)}">${esc(m.name)}</span><span class="chat-msg-time">${time}</span></span><span class="chat-msg-text">${esc(m.text)}</span>`;
  }
  return row;
}
function chatAppend(m) {
  if (chatState.seen.has(m.seq)) return;
  chatState.seen.add(m.seq);
  const stick = chatState.autoscroll && nearBottom(chatBody);
  chatEmpty.hidden = true;
  chatBody.appendChild(chatMsgEl(m));
  if (stick) chatBody.scrollTop = chatBody.scrollHeight;
}
function chatClear() {
  chatState.seen.clear();
  chatState.pending = [];
  chatBody.querySelectorAll(".chat-msg").forEach((n) => n.remove());
}
async function chatPoll() {
  if (!chatState.channel || chatState.inFlight) return;
  chatState.inFlight = true;
  try {
    const r = await fetch(`/api/chat?channel=${encodeURIComponent(chatState.channel)}&after=${chatState.after}`);
    if (r.ok) {
      const data = await r.json();
      for (const m of data.messages ?? []) {
        chatState.after = Math.max(chatState.after, m.seq);
        chatAppend(m);
        chatState.pending = chatState.pending.filter((p) => !(p.name === m.name && p.text === m.text));
      }
      for (const p of chatState.pending) {
        if (!chatState.seen.has(p.localSeq)) chatAppend({ ...p, seq: p.localSeq });
      }
    }
  } catch { /* transient */ }
  chatState.inFlight = false;
}
function chatStart(channelKey) {
  if (chatState.channel === channelKey) return;
  chatState.channel = channelKey;
  chatState.after = 0;
  chatClear();
  chatEmpty.hidden = false;
  clearInterval(chatState.timer);
  chatPoll();
  chatState.timer = setInterval(chatPoll, 2000);
}
function mountChat(ch) {
  chatEmpty.hidden = false;
  chatEmpty.textContent = ch.live
    ? `Welcome to ${ch.name}'s chat — say hello!`
    : "Chat opens once the stream is live.";
  chatStart(ch.key);
}

$("#chatNameEdit").addEventListener("click", () => {
  const next = prompt("Your display name:", chatName());
  if (next && next.trim()) {
    chatState.name = next.trim().slice(0, 32);
    localStorage.setItem("lt_name", chatState.name);
    $("#chatNameLabel").textContent = chatState.name;
  }
});

$("#chatForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("#chatInput");
  const text = input.value.trim();
  if (!text || !chatState.channel || chatState.busy) return;
  chatState.busy = true;
  input.value = "";

  const localSeq = -Date.now();
  const msg = { localSeq, name: chatName(), text, ts: Date.now() };
  chatState.pending.push(msg);
  chatAppend({ ...msg, seq: localSeq });

  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: chatState.channel, name: chatName(), text }),
    });
    if (!r.ok) {
      chatState.pending = chatState.pending.filter((p) => p.localSeq !== localSeq);
      chatBody.querySelectorAll(`[data-seq="${localSeq}"]`).forEach((n) => n.remove());
      toast("Chat: " + ((await r.json().catch(() => ({}))).error ?? "error"));
    }
  } catch {
    chatState.pending = chatState.pending.filter((p) => p.localSeq !== localSeq);
    toast("Chat unreachable");
  }
  chatState.busy = false;
  input.focus();
});

/* ── Actions ───────────────────────────────────────────────── */

favBtn.addEventListener("click", () => {
  if (state.activeKey) toggleFavorite(state.activeKey);
});

copyBtn.addEventListener("click", async () => {
  const ch = state.byKey.get(state.activeKey);
  if (!ch) return;
  const link = `${location.origin}${location.pathname}?channel=${ch.handle ? "@" + ch.handle : ch.id || ch.videoId}`;
  try {
    await navigator.clipboard.writeText(link);
    toast("Link copied to clipboard");
  } catch {
    toast("Copy failed");
  }
});

function looksLikeRef(input) {
  return (
    /youtu\.?be|youtube\.com/i.test(input) ||
    /^@/.test(input) ||
    /^UC[\w-]{20,}$/.test(input) ||
    /^[\w-]{11}$/.test(input)
  );
}

function closeSuggest() {
  searchSuggest.hidden = true;
  searchSuggest.innerHTML = "";
}

function updateSearchSuggest() {
  const raw = $("#searchInput").value.trim();
  if (!raw || looksLikeRef(raw)) return closeSuggest();
  const q = raw.toLowerCase();
  const matches = state.channels
    .filter((c) => `${c.name} ${c.cat}`.toLowerCase().includes(q))
    .slice(0, 8);
  if (!matches.length) return closeSuggest();
  searchSuggest.innerHTML = matches
    .map(
      (c) => `
    <button type="button" class="suggest-item" data-key="${esc(c.key)}" role="option">
      <span class="suggest-avatar" style="background:${avatarColor(c.name)}">${initial(c.name)}</span>
      <span class="suggest-main">
        <span class="suggest-name">${esc(c.name)}</span>
        <span class="suggest-cat">${esc(c.cat)}</span>
      </span>
      ${c.live === true ? '<span class="live-dot"></span>' : ""}
    </button>`
    )
    .join("");
  searchSuggest.hidden = false;
}

$("#searchInput").addEventListener("input", updateSearchSuggest);
$("#searchInput").addEventListener("focus", updateSearchSuggest);
searchSuggest.addEventListener("mousedown", (e) => {
  const item = e.target.closest(".suggest-item");
  if (!item) return;
  e.preventDefault();
  selectChannel(item.dataset.key);
  $("#searchInput").value = "";
  closeSuggest();
  $("#searchInput").blur();
});

$("#searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#searchInput");
  const value = input.value.trim();
  if (!value) return;
  if (looksLikeRef(value)) {
    loadFromInput(value);
  } else {
    const first = searchSuggest.querySelector(".suggest-item");
    if (!searchSuggest.hidden && first) selectChannel(first.dataset.key);
    else toast("No matching channel — paste a channel URL or @handle");
  }
  input.value = "";
  closeSuggest();
  input.blur();
});

/* Client-side filter within the active preset */
let filterTimer = null;
function applyFilter() {
  state.query = filterInput.value;
  clearTimeout(filterTimer);
  filterTimer = setTimeout(() => {
    renderGrid();
    renderSidebar();
  }, 110);
}
if (filterInput) {
  filterInput.addEventListener("input", applyFilter);
  filterInput.addEventListener("search", () => {
    state.query = filterInput.value;
    renderGrid();
    renderSidebar();
  });
}

liveOnlyBtn.addEventListener("click", () => {
  state.liveOnly = !state.liveOnly;
  liveOnlyBtn.setAttribute("aria-checked", state.liveOnly ? "true" : "false");
  renderGrid();
  renderSidebar();
  refreshVisible();
});

/* Shuffle to a live channel in the current preset */
function shuffleChannel() {
  const pool = channelsForPreset(state.activePreset);
  if (!pool.length) return toast("No channels to shuffle");
  let candidates = pool.filter((c) => c.live === true);
  if (!candidates.length) candidates = pool;
  const others = candidates.filter((c) => c.key !== state.activeKey);
  const pick = (others.length ? others : candidates)[Math.floor(Math.random() * (others.length || candidates.length))];
  if (!pick) return;
  selectChannel(pick.key);
  toast(`Shuffled to ${pick.name}`);
}
shuffleBtn.addEventListener("click", shuffleChannel);

/* Floating "back to player" button once the player scrolls out of view */
const playerObserver = new IntersectionObserver(
  ([entry]) => {
    jumpBtn.hidden = entry.isIntersecting || !state.activeKey;
  },
  { threshold: 0.1 }
);
playerObserver.observe(playerFrame);
jumpBtn.addEventListener("click", () => {
  playerFrame.scrollIntoView({ behavior: "smooth", block: "start" });
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* Keyboard shortcuts help */
function openHelp() {
  helpModal.hidden = false;
}
function closeHelp() {
  helpModal.hidden = true;
}
helpBtn.addEventListener("click", openHelp);
helpClose.addEventListener("click", closeHelp);
helpModal.addEventListener("click", (e) => {
  if (e.target === helpModal) closeHelp();
});

/* Sleep timer: cycles Off → 15 → 30 → 60 → 120 minutes */
const sleepState = { minutes: 0, timer: null };
const SLEEP_STEPS = [0, 15, 30, 60, 120];
function setSleep(minutes) {
  clearTimeout(sleepState.timer);
  sleepState.minutes = minutes;
  sleepBtn.classList.toggle("active", minutes > 0);
  if (!minutes) {
    toast("Sleep timer off");
    return;
  }
  sleepState.timer = setTimeout(() => {
    ytCommand("pauseVideo");
    sleepState.minutes = 0;
    sleepBtn.classList.remove("active");
    toast("Sleep timer — playback paused");
  }, minutes * 60000);
  toast(`Sleep timer set for ${minutes} min`);
}
sleepBtn.addEventListener("click", () => {
  const idx = SLEEP_STEPS.indexOf(sleepState.minutes);
  setSleep(SLEEP_STEPS[(idx + 1) % SLEEP_STEPS.length]);
});

/* Dismiss search suggestions on outside click */
document.addEventListener("click", (e) => {
  if (!searchSuggest.hidden && !e.target.closest(".search")) closeSuggest();
});

$("#refreshBtn").addEventListener("click", () => {
  statusCache.clear();
  saveStore(STATUS_KEY, {});
  for (const ch of channelsForPreset(state.activePreset)) {
    ch.live = null;
    ch.viewers = null;
  }
  $("#refreshBtn").classList.add("spin");
  refreshVisible();
  setTimeout(() => {
    $("#refreshBtn").classList.remove("spin");
    toast("Live statuses refreshed");
    scheduleRender();
  }, 1200);
});

$("#theaterBtn").addEventListener("click", () => document.body.classList.toggle("theater"));
$("#burgerBtn").addEventListener("click", () => document.body.classList.toggle("sidebar-collapsed"));

if (window.matchMedia("(max-width: 820px)").matches) document.body.classList.add("sidebar-collapsed");
document.addEventListener("click", (e) => {
  if (window.innerWidth <= 820 && !document.body.classList.contains("sidebar-collapsed") && e.target === document.body) {
    document.body.classList.add("sidebar-collapsed");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !helpModal.hidden) {
    closeHelp();
    return;
  }
  if (e.key === "Escape" && !searchSuggest.hidden) {
    closeSuggest();
    return;
  }
  const typing = document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA");
  if (typing) return;
  if (e.key.toLowerCase() === "t") document.body.classList.toggle("theater");
  if (e.key === "/") {
    e.preventDefault();
    $("#searchInput").focus();
  }
  if (e.key.toLowerCase() === "f" && state.activeKey) toggleFavorite(state.activeKey);
  if (e.key.toLowerCase() === "s") shuffleChannel();
  if (e.key === "?") openHelp();
});

$("#brand").addEventListener("click", (e) => {
  e.preventDefault();
  document.body.classList.remove("theater");
  navigate("");
});

window.addEventListener("popstate", () => {
  state.activePreset = slugFromPath(location.pathname);
  renderPresetNav();
  renderGrid();
  renderSidebar();
  refreshVisible();
});

/* ── Theme manager ─────────────────────────────────────────── */

const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(pref) {
  const resolved = pref === "system" ? (themeMedia.matches ? "dark" : "light") : pref;
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.style.colorScheme = resolved;
  $("#themeBtn").setAttribute("aria-expanded", "false");
  $("#themeMenu").querySelectorAll("[data-theme-choice]").forEach((b) => {
    b.setAttribute("aria-checked", b.dataset.themeChoice === pref ? "true" : "false");
  });
}
function applyAccent(accent) {
  document.documentElement.setAttribute("data-accent", accent);
  $("#themeMenu").querySelectorAll("[data-accent-choice]").forEach((b) => {
    b.setAttribute("aria-checked", b.dataset.accentChoice === accent ? "true" : "false");
  });
}
function initTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) ?? "light");
  applyAccent(localStorage.getItem(ACCENT_KEY) ?? "red");
  themeMedia.addEventListener("change", () => {
    if ((localStorage.getItem(THEME_KEY) ?? "light") === "system") applyTheme("system");
  });

  const btn = $("#themeBtn");
  const menu = $("#themeMenu");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = menu.hidden;
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("click", (e) => {
    if (!menu.hidden && !$("#themeDropdown").contains(e.target)) {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }
  });
  menu.querySelectorAll("[data-theme-choice]").forEach((item) => {
    item.addEventListener("click", () => {
      const pref = item.dataset.themeChoice;
      localStorage.setItem(THEME_KEY, pref);
      applyTheme(pref);
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    });
  });
  menu.querySelectorAll("[data-accent-choice]").forEach((item) => {
    item.addEventListener("click", () => {
      const accent = item.dataset.accentChoice;
      localStorage.setItem(ACCENT_KEY, accent);
      applyAccent(accent);
    });
  });
}

/* ── Boot ──────────────────────────────────────────────────── */

async function loadCatalog() {
  try {
    const r = await fetch(CATALOG_URL, { cache: "no-cache" });
    if (!r.ok) throw new Error(String(r.status));
    const data = await r.json();
    state.presets = data.presets ?? [];
    for (const c of data.channels ?? []) register(makeChannel(c));
  } catch {
    toast("Catalog unavailable — showing community channels only");
  }
}

async function loadCommunityChannels() {
  try {
    const r = await fetch("/api/channels");
    if (!r.ok) return;
    const data = await r.json();
    const community = (data.channels ?? []).map((c) =>
      makeChannel({ handle: c.handle, name: c.name, cat: c.cat, group: "Community" })
    );
    for (const c of community) register(c);
    saveStore(CUSTOM_KEY, community);
  } catch { /* offline or API missing */ }
}

function applySavedChannel() {
  const urlChannel = new URLSearchParams(location.search).get("channel");
  if (!urlChannel) return false;
  const key = urlChannel.startsWith("@") ? "h:" + urlChannel.slice(1).toLowerCase() : "c:" + urlChannel;
  if (state.byKey.has(key)) selectChannel(key);
  else loadFromInput(urlChannel);
  return true;
}

/* Always start on Lofi Girl unless a specific channel was requested. */
function applyDefaultChannel() {
  const lofi = state.byKey.get(DEFAULT_CHANNEL);
  if (lofi) selectChannel(lofi.key, { autoplay: true, muted: true });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

async function boot() {
  initTheme();
  await loadCatalog();
  state.activePreset = slugFromPath(location.pathname);
  renderPresetNav();
  renderGrid();
  renderSidebar();

  await loadCommunityChannels();
  renderPresetNav();
  renderGrid();
  renderSidebar();

  refreshVisible();
  setInterval(() => {
    for (const ch of channelsForPreset(state.activePreset)) {
      const entry = statusCache.get(ch.key);
      if (!entry || Date.now() - entry.t >= STATUS_TTL) requestStatus(ch);
    }
  }, STATUS_TTL);

  if (!applySavedChannel()) applyDefaultChannel();
  registerServiceWorker();
}

boot();