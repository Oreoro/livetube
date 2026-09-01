const SEED_CHANNELS = [
  { handle: "LofiGirl", name: "Lofi Girl", cat: "lo-fi hip hop radio", group: "Music" },
  { handle: "TheGoodLifeRadio", name: "The Good Life Radio", cat: "24/7 deep house & chill radio", group: "Music" },
  { handle: "ChillhopMusic", name: "Chillhop Music", cat: "chillhop essentials radio", group: "Music" },
  { handle: "SoothingRelaxation", name: "Soothing Relaxation", cat: "beautiful piano radio", group: "Music" },
  { handle: "CafeMusicBGMChannel", name: "Cafe Music BGM", cat: "coffee shop jazz & bossa", group: "Music" },
  { handle: "RelaxingWhiteNoise", name: "Relaxing White Noise", cat: "white noise for sleeping", group: "Music" },
  { handle: "AmbientRenders", name: "Ambient Renders", cat: "ambient scenes for sleep", group: "Music" },
  { handle: "TheSilentWatchers", name: "The Silent Watchers", cat: "calm live broadcasts", group: "Music" },
  { handle: "NASA", name: "NASA", cat: "live views from the ISS", group: "Space & Earth" },
  { handle: "EarthTV", name: "earthTV", cat: "live webcams around the world", group: "Space & Earth" },
  { handle: "ExploreLiveNatureCams", name: "Explore Nature", cat: "live wildlife cams", group: "Space & Earth" },
  { handle: "business", name: "Bloomberg", cat: "global business & markets", group: "Business" },
  { handle: "CNBC", name: "CNBC", cat: "business news & market coverage", group: "Business" },
  { handle: "YahooFinance", name: "Yahoo Finance", cat: "24/7 market coverage", group: "Business" },
  { handle: "SkyNews", name: "Sky News", cat: "24/7 breaking news", group: "News" },
  { handle: "CNN", name: "CNN", cat: "headlines 24/7", group: "News" },
  { handle: "CBSNews", name: "CBS News", cat: "breaking news & top stories", group: "News" },
  { handle: "NBCNews", name: "NBC News NOW", cat: "live news streaming 24/7", group: "News" },
  { handle: "euronews", name: "Euronews", cat: "European news", group: "News" },
  { handle: "TalkTV", name: "TalkTV", cat: "live UK news & debate", group: "News" },
  { handle: "dwnews", name: "DW News", cat: "international news", group: "News" },
  { handle: "france24", name: "France 24", cat: "international news 24/7", group: "News" },
  { handle: "trtworld", name: "TRT World", cat: "live news & current affairs", group: "News" },
  { handle: "CGTN", name: "CGTN", cat: "24/7 global news", group: "News" },
  { handle: "aljazeeraenglish", name: "Al Jazeera English", cat: "live news & current affairs", group: "News" },
  { handle: "AlArabiya", name: "Al Arabiya", cat: "live Arabic news", group: "News" },
  { handle: "AlArabiyaEnglish", name: "Al Arabiya English", cat: "Arab world in English", group: "News" },
  { handle: "SkyNewsArabia", name: "Sky News Arabia", cat: "live Arabic news", group: "News" },
  { handle: "AsharqNews", name: "Asharq News", cat: "live Arabic business & news", group: "News" },
  { handle: "AlHadath", name: "Al Hadath", cat: "live Arabic breaking news", group: "News" },
  { handle: "TimesNow", name: "Times Now", cat: "24/7 breaking news", group: "News" },
  { handle: "TimesNowNavbharat", name: "Times Now Navbharat", cat: "Hindi news 24/7", group: "News" },
  { handle: "RepublicWorld", name: "Republic World", cat: "live news & debate", group: "News" },
  { handle: "RepublicBharat", name: "Republic Bharat", cat: "Hindi news & debate", group: "News" },
  { handle: "MirrorNow", name: "Mirror Now", cat: "live news India", group: "News" },
  { handle: "NDTVIndia", name: "NDTV India", cat: "Hindi news live", group: "News" },
  { handle: "NewsXLive", name: "NewsX", cat: "live English news India", group: "News" },
  { handle: "TimesNowWorld", name: "Times Now World", cat: "world news live", group: "News" },
  { handle: "RepublicBangla", name: "Republic Bangla", cat: "Bengali news live", group: "News" },
  { handle: "ABCNews", name: "ABC News", cat: "US news live", group: "News" },
  { handle: "ndtv", name: "NDTV", cat: "India news live 24x7", group: "News" },
  { handle: "WION", name: "WION", cat: "world news live", group: "News" },
  { handle: "IndiaToday", name: "India Today", cat: "English news live TV", group: "News" },
  { handle: "aajtak", name: "Aaj Tak", cat: "हिंदी न्यूज़ लाइव", group: "News" },
  { handle: "ZeeNews", name: "Zee News", cat: "Hindi news live", group: "News" },
  { handle: "ABPNews", name: "ABP News", cat: "Hindi news live", group: "News" },
  { handle: "TV9Bharatvarsh", name: "TV9 Bharatvarsh", cat: "Hindi news live", group: "News" },
  { handle: "IndiaTV", name: "India TV", cat: "Hindi news live", group: "News" },
  { handle: "News18India", name: "News18 India", cat: "Hindi news live", group: "News" },
  { handle: "News18Urdu", name: "News18 Urdu", cat: "Urdu news live", group: "News" },
  { handle: "News18Kerala", name: "News18 Kerala", cat: "Malayalam news live", group: "News" },
  { handle: "News18Kannada", name: "News18 Kannada", cat: "Kannada news live", group: "News" },
  { handle: "News18TamilNadu", name: "News18 Tamil Nadu", cat: "Tamil news live", group: "News" },
  { handle: "News18Rajasthan", name: "News18 Rajasthan", cat: "Rajasthan news live", group: "News" },
  { handle: "News18BiharJharkhand", name: "News18 Bihar Jharkhand", cat: "regional news live", group: "News" },
  { handle: "TV9Kannada", name: "TV9 Kannada", cat: "Kannada news live", group: "News" },
  { handle: "ThanthiTV", name: "Thanthi TV", cat: "Tamil news live", group: "News" },
  { handle: "PolimerNews", name: "Polimer News", cat: "Tamil news live", group: "News" },
  { handle: "NTVTelugu", name: "NTV Telugu", cat: "Telugu news live", group: "News" },
  { handle: "99TVTelugu", name: "99 TV Telugu", cat: "Telugu news live", group: "News" },
  { handle: "SakshiTV", name: "Sakshi TV", cat: "Telugu news live", group: "News" },
  { handle: "TV5News", name: "TV5 News", cat: "Telugu news live", group: "News" },
  { handle: "ETVAndhraPradesh", name: "ETV Andhra Pradesh", cat: "Telugu news live", group: "News" },
  { handle: "ManoramaNews", name: "Manorama News", cat: "Malayalam news live", group: "News" },
  { handle: "AsianetNews", name: "Asianet News", cat: "Malayalam news live", group: "News" },
  { handle: "KairaliNews", name: "Kairali News", cat: "Malayalam news live", group: "News" },
  { handle: "MediaOneTVLIVE", name: "MediaOne TV", cat: "Malayalam news live", group: "News" },
  { handle: "ReporterLive", name: "Reporter Live", cat: "Malayalam news live", group: "News" },
  { handle: "SamayaNews", name: "Samaya News", cat: "Kannada news live", group: "News" },
  { handle: "NandighoshaTV", name: "Nandighosha TV", cat: "Odia news live", group: "News" },
  { handle: "JantaTVNews", name: "Janta TV", cat: "Hindi news live", group: "News" },
  { handle: "SamaaTV", name: "SAMAA TV", cat: "Pakistani news live", group: "News" },
  { handle: "HaberturkTV", name: "Habertürk", cat: "Türkçe canlı haber", group: "News" },
  { handle: "TRTHaber", name: "TRT Haber", cat: "Türkçe canlı haber", group: "News" },
  { handle: "CNNturk", name: "CNN Türk", cat: "Türkçe canlı haber", group: "News" },
  { handle: "TVNET", name: "TVNET", cat: "Türkçe canlı haber", group: "News" },
  { handle: "BloombergHT", name: "Bloomberg HT", cat: "Türkçe canlı borsa", group: "News" },
  { handle: "AkitTV", name: "Akit TV", cat: "Türkçe canlı haber", group: "News" },
  { handle: "ShowTV", name: "Show TV", cat: "Türkçe canlı yayın", group: "News" },
  { handle: "KanalD", name: "Kanal D", cat: "Türkçe canlı yayın", group: "News" },
  { handle: "HaberGlobal", name: "Haber Global", cat: "Türkçe canlı haber", group: "News" },
  { handle: "TV100", name: "TV100", cat: "Türkçe canlı haber", group: "News" },
  { handle: "NTVBD", name: "NTV Bangladesh", cat: "Bangla news live", group: "News" },
  { handle: "IndependentTelevision", name: "Independent TV", cat: "Bangla news live", group: "News" },
  { handle: "TV5MondeInfo", name: "TV5MONDE Info", cat: "French news live", group: "News" },
  { handle: "ChannelsTelevision", name: "Channels TV", cat: "Nigerian news live", group: "News" },
  { handle: "TVCNewsNigeria", name: "TVC News", cat: "Nigerian news live", group: "News" },
  { handle: "Africanews", name: "Africanews", cat: "African news live", group: "News" },
  { handle: "CNAInsider", name: "CNA", cat: "Singapore news & docs", group: "News" },
  { handle: "NewsmaxTV", name: "Newsmax", cat: "US news live", group: "News" },
  { handle: "NewsNation", name: "NewsNation", cat: "US news live", group: "News" },
  { handle: "FoxWeather", name: "FOX Weather", cat: "24/7 weather news", group: "News" },
  { handle: "OANN", name: "OAN", cat: "US news live", group: "News" },
  { handle: "RealAmericasVoice", name: "Real America's Voice", cat: "US news live", group: "News" },
  { handle: "TRTWorldNow", name: "TRT World Now", cat: "live world news", group: "News" },
  { handle: "AlJazeeraMubasher", name: "Al Jazeera Mubasher", cat: "live Arabic news", group: "News" },
  { handle: "5News", name: "5 News Weather", cat: "24/7 weather live", group: "News" },
];

const GROUPS = ["All", "News", "Music", "Business", "Space & Earth", "Community", "Favorites"];

const state = {
  channels: [],
  activeKey: null,
  activeGroup: "All",
};

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
const chanViewers = $("#chanViewers");
const chanViewersText = $("#chanViewersText");
const openYt = $("#openYt");
const favBtn = $("#favBtn");
const copyBtn = $("#copyBtn");
const chatBody = $("#chatBody");
const chatEmpty = $("#chatEmpty");
const toastEl = $("#toast");

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
  return name.trim().charAt(0).toUpperCase();
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
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const favorites = new Set(loadStore("lt_favs", []));
const history = loadStore("lt_history", []);

function toggleFavorite(key) {
  if (favorites.has(key)) favorites.delete(key);
  else favorites.add(key);
  saveStore("lt_favs", [...favorites]);
  renderSidebar();
  renderGrid();
  renderChanInfo();
}

function pushHistory(key) {
  const idx = history.indexOf(key);
  if (idx !== -1) history.splice(idx, 1);
  history.unshift(key);
  if (history.length > 10) history.pop();
  saveStore("lt_history", history);
}

function makeChannel(entry) {
  return {
    ...entry,
    key: entry.handle ? "h:" + entry.handle : "c:" + entry.id,
    id: entry.id ?? null,
    handle: entry.handle ?? null,
    live: entry.live ?? null,
    videoId: entry.videoId ?? null,
    viewers: entry.viewers ?? null,
  };
}

function buildState() {
  const seed = SEED_CHANNELS.map(makeChannel);
  const custom = loadStore("lt_custom", []).map(makeChannel);
  const seen = new Set(seed.map((c) => c.key));
  const merged = [...seed, ...custom.filter((c) => !seen.has(c.key))];
  state.channels = merged;
}

async function loadCommunityChannels() {
  try {
    const r = await fetch("/api/channels");
    if (!r.ok) return;
    const data = await r.json();
    const community = data.channels.map((c) =>
      makeChannel({ handle: c.handle, name: c.name, cat: c.cat, group: "Community" })
    );
    const seen = new Set(state.channels.map((c) => c.key));
    state.channels.push(...community.filter((c) => !seen.has(c.key)));
    localStorage.setItem("lt_custom", JSON.stringify(community));
  } catch {
    /* offline or API missing */
  }
}

async function checkLive(ch) {
  try {
    const q = ch.handle
      ? `handle=${encodeURIComponent(ch.handle)}`
      : `channel=${encodeURIComponent(ch.id)}`;
    const r = await fetch(`/api/live?${q}`);
    if (!r.ok) throw new Error(String(r.status));
    const data = await r.json();
    ch.live = data.live === true ? true : data.live === false ? false : null;
    ch.videoId = data.videoId || null;
    ch.viewers = data.viewers ?? null;
    if (data.channelId) ch.id = data.channelId;
  } catch {
    ch.live = null;
  }
}

async function refreshAll({ silent = false } = {}) {
  if (!silent) $("#refreshBtn").classList.add("spin");
  await Promise.allSettled(state.channels.map(checkLive));
  renderSidebar();
  renderGrid();
  renderChanInfo();
  $("#refreshBtn").classList.remove("spin");
  if (!state.activeKey) {
    const top = [...state.channels]
      .filter((c) => c.live)
      .sort((a, b) => (b.viewers ?? 0) - (a.viewers ?? 0))[0];
    if (top) selectChannel(top.key);
  }
  if (!silent) toast("Live statuses refreshed");
}

function renderTabs() {
  const tabs = $("#groupTabs");
  tabs.innerHTML = "";
  for (const g of GROUPS) {
    const btn = document.createElement("button");
    btn.className = "tab" + (g === state.activeGroup ? " tab-active" : "");
    btn.textContent = g;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", g === state.activeGroup ? "true" : "false");
    btn.addEventListener("click", () => {
      state.activeGroup = g;
      renderTabs();
      renderGrid();
    });
    tabs.appendChild(btn);
  }
}

function renderSidebar() {
  const sorted = [...state.channels].sort((a, b) => (b.viewers ?? 0) - (a.viewers ?? 0));
  sidebarList.innerHTML = "";
  for (const ch of sorted) {
    const btn = document.createElement("button");
    btn.className = "sidebar-item" + (ch.key === state.activeKey ? " active" : "");
    const v = fmtViewers(ch.viewers);
    btn.innerHTML = `
      <span class="side-avatar" style="background:${avatarColor(ch.name)}">${initial(ch.name)}${ch.live ? '<span class="live-dot"></span>' : ""}</span>
      <span class="side-main">
        <span class="side-name">${esc(ch.name)}</span>
        <span class="side-cat">${esc(ch.cat)}</span>
      </span>
      <span class="side-right">${ch.live && v ? `<span class="live-dot"></span>${v}` : ""}</span>`;
    btn.addEventListener("click", () => selectChannel(ch.key));
    sidebarList.appendChild(btn);
  }
}

function renderGrid() {
  grid.innerHTML = "";
  const visible = state.channels.filter((ch) => {
    if (state.activeGroup === "All") return true;
    if (state.activeGroup === "Favorites") return favorites.has(ch.key);
    return ch.group === state.activeGroup;
  });
  if (!visible.length) {
    grid.innerHTML = `<p class="grid-empty">Nothing here yet — star channels to add them to Favorites.</p>`;
    return;
  }
  let i = 0;
  for (const ch of visible) {
    const card = document.createElement("button");
    card.className = "card" + (ch.key === state.activeKey ? " active" : "");
    card.style.animationDelay = `${Math.min(i * 40, 400)}ms`;
    i++;

    const thumb = ch.videoId
      ? `<img src="https://i.ytimg.com/vi/${esc(ch.videoId)}/mqdefault.jpg" alt="" loading="lazy" />`
      : "";
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
      <span class="card-thumb">${thumb}<span class="card-initial" ${ch.videoId ? "hidden" : ""}>${initial(ch.name)}</span><span class="card-badges">${badge}${viewers}</span></span>
      <span class="card-body">
        <span class="card-avatar" style="background:${avatarColor(ch.name)}">${initial(ch.name)}</span>
        <span class="card-main">
          <span class="card-name">${esc(ch.name)}</span>
          <span class="card-cat">${esc(ch.cat)}</span>
        </span>
      </span>`;
    card.addEventListener("click", () => selectChannel(ch.key));
    grid.appendChild(card);
  }
}

function renderChanInfo() {
  const ch = state.channels.find((c) => c.key === state.activeKey);
  if (!ch) return;
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
  if (ch.live && ch.viewers != null) {
    chanViewersText.textContent = fmtViewers(ch.viewers) + " watching";
    chanViewers.hidden = false;
  } else {
    chanViewers.hidden = true;
  }
  favBtn.classList.toggle("fav-active", favorites.has(ch.key));
  openYt.href = ch.videoId
    ? `https://www.youtube.com/watch?v=${ch.videoId}`
    : ch.id
      ? `https://www.youtube.com/channel/${ch.id}`
      : `https://www.youtube.com/@${ch.handle ?? ""}`;
}

function embedUrl(ch, autoplay = true) {
  if (!ch.videoId && !ch.id) return null;
  const base = ch.videoId
    ? `https://www.youtube.com/embed/${ch.videoId}`
    : `https://www.youtube.com/embed/live_stream?channel=${ch.id}`;
  const params = new URLSearchParams({ autoplay: autoplay ? "1" : "0", rel: "0" });
  return `${base}?${params}`;
}

async function selectChannel(key, { autoplay = true } = {}) {
  const ch = state.channels.find((c) => c.key === key);
  if (!ch) return;
  state.activeKey = key;

  if (!ch.videoId && !ch.id) {
    toast("Resolving channel…");
    await checkLive(ch);
    renderSidebar();
    renderGrid();
  }

  const url = embedUrl(ch, autoplay);
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

  chanInfo.hidden = false;
  renderChanInfo();
  mountChat(ch);
  pushHistory(key);
  renderSidebar();
  renderGrid();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

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
      const mUser = u.pathname.match(/\/(?:c|user)\/([\w.-]+)/);
      if (mUser) return { kind: "handle", value: mUser[1] };
      const mShort = u.pathname.match(/\/live\/([\w-]{6,})/);
      if (mShort) return { kind: "video", value: mShort[1] };
    } catch {
      /* fall through */
    }
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
    let ch = state.channels.find((c) => c.key === key);
    if (!ch) {
      ch = makeChannel({ key, name: "Custom video", cat: parsed.value, videoId: parsed.value, live: true });
      state.channels.unshift(ch);
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
    if (data.channelId) {
      addOrSelectChannel({
        id: data.channelId,
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
  const key = partial.handle ? "h:" + partial.handle : "c:" + partial.id;
  let ch = state.channels.find((c) => c.key === key);
  if (!ch) {
    ch = makeChannel(partial);
    state.channels.unshift(ch);
  } else {
    Object.assign(ch, partial);
  }
  renderSidebar();
  renderGrid();
  selectChannel(key);
  if (ch.live === null) {
    checkLive(ch).then(() => {
      renderSidebar();
      renderGrid();
      renderChanInfo();
    });
  }
}

const chatState = {
  channel: null,
  after: 0,
  timer: null,
  name: null,
  busy: false,
  inFlight: false,
  seen: new Set(),
  pending: [],
};

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
  const wasAtBottom = nearBottom(chatBody);
  chatEmpty.hidden = true;
  chatBody.appendChild(chatMsgEl(m));
  if (wasAtBottom) chatBody.scrollTop = chatBody.scrollHeight;
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
  } catch {
    /* transient */
  }
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

favBtn.addEventListener("click", () => {
  if (state.activeKey) toggleFavorite(state.activeKey);
});

copyBtn.addEventListener("click", async () => {
  const ch = state.channels.find((c) => c.key === state.activeKey);
  if (!ch) return;
  const link = `${location.origin}/?channel=${ch.handle ? "@" + ch.handle : ch.id}`;
  try {
    await navigator.clipboard.writeText(link);
    toast("Link copied to clipboard");
  } catch {
    toast("Copy failed");
  }
});

$("#searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  loadFromInput($("#searchInput").value);
  $("#searchInput").blur();
});

/* ── Theme manager (light/dark/system, shadcn pattern) ───────────── */

const THEME_KEY = "lt_theme";
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

function initTheme() {
  const pref = localStorage.getItem(THEME_KEY) ?? "dark";
  applyTheme(pref);
  themeMedia.addEventListener("change", () => {
    if ((localStorage.getItem(THEME_KEY) ?? "dark") === "system") applyTheme("system");
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
}

$("#refreshBtn").addEventListener("click", () => refreshAll());

$("#theaterBtn").addEventListener("click", () => document.body.classList.toggle("theater"));

$("#burgerBtn").addEventListener("click", () => document.body.classList.toggle("sidebar-collapsed"));

document.addEventListener("keydown", (e) => {
  const typing = document.activeElement.tagName === "INPUT";
  if (typing) return;
  if (e.key.toLowerCase() === "t") document.body.classList.toggle("theater");
  if (e.key === "/") {
    e.preventDefault();
    $("#searchInput").focus();
  }
  if (e.key.toLowerCase() === "f" && state.activeKey) toggleFavorite(state.activeKey);
});

$("#brand").addEventListener("click", (e) => {
  e.preventDefault();
  document.body.classList.remove("theater");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const style = document.createElement("style");
style.textContent = "#refreshBtn.spin svg { animation: rot 0.8s linear infinite; } @keyframes rot { to { transform: rotate(360deg); } }";
document.head.appendChild(style);

const urlChannel = new URLSearchParams(location.search).get("channel");

async function boot() {
  initTheme();
  buildState();
  renderTabs();
  renderSidebar();
  renderGrid();
  await loadCommunityChannels();
  renderSidebar();
  renderGrid();
  await refreshAll({ silent: true });
  if (urlChannel) {
    const key = urlChannel.startsWith("@") ? "h:" + urlChannel.slice(1) : "c:" + urlChannel;
    if (state.channels.some((c) => c.key === key)) selectChannel(key);
    else loadFromInput(urlChannel);
  }
  setInterval(() => refreshAll({ silent: true }), 60000);
}

boot();
