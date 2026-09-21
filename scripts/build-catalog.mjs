#!/usr/bin/env node
/*
 * Builds catalog.json from list2.txt plus a small curated seed of
 * international English-language channels.
 *
 * list2.txt format:
 *   ~~ header line (ignored)
 *   ~~ header line (ignored)
 *   <channel name> | <group> | <logo> | <tvg-id>
 *   <youtube url>
 *
 * Policy (per product decision): English-only everywhere. Regional and
 * non-English groups are dropped; the mixed "News" group keeps only
 * international English outlets.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

/* ── Source parsing ─────────────────────────────────────────── */

const raw = readFileSync(resolve(root, "list2.txt"), "utf8");
const lines = raw.split(/\r?\n/);

function parseList2(text) {
  const rows = [];
  const ls = text.split(/\r?\n/);
  for (let i = 0; i < ls.length; i++) {
    const line = ls[i];
    if (!line.includes("|")) continue;
    if (/^~~/.test(line.trim())) continue;

    let j = i + 1;
    while (j < ls.length && !ls[j].trim()) j++;
    const urlLine = (ls[j] ?? "").trim();
    if (!/^https?:\/\//i.test(urlLine)) continue;

    const parts = line.split("|").map((s) => s.trim());
    const name = parts[0];
    const group = parts[1] ?? "";
    const logo = parts[2] && /^https?:\/\//i.test(parts[2]) ? parts[2] : "";
    if (!name || !group) continue;

    rows.push({ name, group, logo, url: urlLine.replace(/\s+/g, "") });
    i = j;
  }
  return rows;
}

/* ── English-only filtering ─────────────────────────────────── */

const KEEP_GROUPS = new Set([
  "Music",
  "Livecam",
  "Camera",
  "Times Square",
  "webcam",
  "Weather",
  "Documentary",
  "Kids",
  "Entertainment",
  "Wrestling",
  "Political Podcast",
  "International News",
  "Radio",
]);

/* The mixed "News" group is pruned to genuinely international English outlets. */
const NEWS_ALLOW = [/roland martin/i, /abc news australia/i, /(^|\b)rt(\b|$)/i];

/* Known non-English channels that slip past the script heuristic. */
const DROP_NAMES = [/\bsbt\b/i, /ndtv india/i, /cgtn news live/i, /bloomberg global/i];

/* Non-Latin scripts + accented Latin (Türk, România, Český …). */
const NON_LATIN = /[\u0400-\u04ff\u0590-\u05ff\u0600-\u06ff\u0900-\u097f\u0e00-\u0e7f\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af\u00c0-\u024f]/;

const FOREIGN_WORDS =
  /\b(kral|manele|canli|canlı|yayin|yayını|haber|noticias|diretta|televiziune|românia|romania|rozhlas|radiožurnál|radiozurnal|doxologia|trinitas|muz|muz-tv|α|τηλεόραση|molek)\b/i;

function looksEnglish(name) {
  return !NON_LATIN.test(name) && !FOREIGN_WORDS.test(name);
}

function isKept(row) {
  if (DROP_NAMES.some((re) => re.test(row.name))) return false;
  if (row.group === "News") {
    return NEWS_ALLOW.some((re) => re.test(row.name)) && looksEnglish(row.name);
  }
  if (!KEEP_GROUPS.has(row.group)) return false;
  if (!looksEnglish(row.name)) return false;
  if (/\b(CN)\s*$/i.test(row.name)) return false; // foreign-language kids streams
  return true;
}

/* ── URL normalization ──────────────────────────────────────── */

function normalizeUrl(url) {
  let m;
  if ((m = url.match(/[?&]v=([\w-]{11})/))) return { videoId: m[1] };
  if ((m = url.match(/\/channel\/(UC[\w-]{20,})/))) return { id: m[1] };
  if ((m = url.match(/\/@([\w.-]+)/))) return { handle: m[1] };
  if ((m = url.match(/\/(?:c|user)\/([\w.-]+)/))) return { handle: m[1] };
  return { liveUrl: url };
}

/* ── Curated seed (international English) ───────────────────── */

const SEED = [
  { handle: "LofiGirl", name: "Lofi Girl", cat: "lo-fi hip hop radio", group: "Music" },
  { handle: "TheGoodLifeRadio", name: "The Good Life Radio", cat: "24/7 deep house & chill", group: "Music" },
  { handle: "ChillhopMusic", name: "Chillhop Music", cat: "chillhop essentials radio", group: "Music" },
  { handle: "SoothingRelaxation", name: "Soothing Relaxation", cat: "beautiful piano radio", group: "Music" },
  { handle: "CafeMusicBGMChannel", name: "Cafe Music BGM", cat: "coffee shop jazz & bossa", group: "Music" },
  { handle: "RelaxingWhiteNoise", name: "Relaxing White Noise", cat: "white noise for sleeping", group: "Music" },
  { handle: "AmbientRenders", name: "Ambient Renders", cat: "ambient scenes for sleep", group: "Music" },
  { handle: "NASA", name: "NASA", cat: "live views from the ISS", group: "Space & Earth" },
  { handle: "EarthTV", name: "earthTV", cat: "live webcams around the world", group: "Space & Earth" },
  { handle: "ExploreLiveNatureCams", name: "Explore Nature", cat: "live wildlife cams", group: "Space & Earth" },
  { handle: "business", name: "Bloomberg", cat: "global business & markets", group: "Business" },
  { handle: "CNBC", name: "CNBC", cat: "business news & market coverage", group: "Business" },
  { handle: "YahooFinance", name: "Yahoo Finance", cat: "24/7 market coverage", group: "Business" },
  { handle: "SkyNews", name: "Sky News", cat: "24/7 breaking news", group: "International News" },
  { handle: "CNN", name: "CNN", cat: "headlines 24/7", group: "International News" },
  { handle: "CBSNews", name: "CBS News", cat: "breaking news & top stories", group: "International News" },
  { handle: "NBCNews", name: "NBC News NOW", cat: "live news streaming 24/7", group: "International News" },
  { handle: "Reuters", name: "Reuters", cat: "live news & world events", group: "International News" },
  { handle: "euronews", name: "Euronews", cat: "European news in English", group: "International News" },
  { handle: "dwnews", name: "DW News", cat: "international news in English", group: "International News" },
  { handle: "france24", name: "France 24 English", cat: "international news 24/7", group: "International News" },
  { handle: "trtworld", name: "TRT World", cat: "live news & current affairs", group: "International News" },
  { handle: "CGTN", name: "CGTN", cat: "24/7 global news", group: "International News" },
  { handle: "aljazeeraenglish", name: "Al Jazeera English", cat: "live news & current affairs", group: "International News" },
  { handle: "ABCNews", name: "ABC News", cat: "US news live", group: "International News" },
  { handle: "CNAInsider", name: "CNA", cat: "Singapore news & docs", group: "International News" },
  { handle: "Africanews", name: "Africanews", cat: "African news in English", group: "International News" },
  { handle: "AlArabiyaEnglish", name: "Al Arabiya English", cat: "the Arab world in English", group: "International News" },
  { handle: "GBNews", name: "GB News", cat: "UK news & debate", group: "International News" },
  { handle: "WION", name: "WION", cat: "world news live", group: "International News" },
  { handle: "NewsNation", name: "NewsNation", cat: "US news live", group: "International News" },
  /* Sports — English-language leagues and broadcasters (live when broadcasting) */
  { handle: "ESPN", name: "ESPN", cat: "sports news & live events", group: "Sports" },
  { handle: "NBA", name: "NBA", cat: "basketball live & highlights", group: "Sports" },
  { handle: "NFL", name: "NFL", cat: "American football", group: "Sports" },
  { handle: "MLB", name: "MLB", cat: "baseball live & highlights", group: "Sports" },
  { handle: "NHL", name: "NHL", cat: "ice hockey", group: "Sports" },
  { handle: "Formula1", name: "Formula 1", cat: "F1 racing", group: "Sports" },
  { handle: "UFC", name: "UFC", cat: "mixed martial arts", group: "Sports" },
  { handle: "WWE", name: "WWE", cat: "wrestling entertainment", group: "Sports" },
  { handle: "CBSSports", name: "CBS Sports", cat: "US sports coverage", group: "Sports" },
  { handle: "NBCSports", name: "NBC Sports", cat: "US sports coverage", group: "Sports" },
  { handle: "SkySports", name: "Sky Sports", cat: "UK sports coverage", group: "Sports" },
  { handle: "premierleague", name: "Premier League", cat: "English football", group: "Sports" },
  { handle: "Olympics", name: "Olympics", cat: "Olympic sport", group: "Sports" },
  { handle: "PGATOUR", name: "PGA TOUR", cat: "golf", group: "Sports" },
];

/* ── Presets ────────────────────────────────────────────────── */

const PRESETS = [
  {
    slug: "music",
    title: "Music",
    blurb: "Lo-fi, chillhop, jazz and 24/7 radio — always on.",
    groups: ["Music", "Radio"],
  },
  {
    slug: "news",
    title: "News",
    blurb: "International English-language news, live around the clock.",
    groups: ["International News", "News", "English", "UK"],
  },
  {
    slug: "livecams",
    title: "Live Cams",
    blurb: "City skylines, beaches, wildlife and weather cams.",
    groups: ["Livecam", "Camera", "Times Square", "webcam", "Weather"],
  },
  {
    slug: "space",
    title: "Space & Earth",
    blurb: "Views from orbit and planet-watching cams.",
    groups: ["Space & Earth"],
  },
  {
    slug: "documentary",
    title: "Documentary",
    blurb: "Long-form, nature and scenic documentary streams.",
    groups: ["Documentary"],
  },
  {
    slug: "kids",
    title: "Kids",
    blurb: "Family-safe cartoons and kids channels.",
    groups: ["Kids"],
  },
  {
    slug: "entertainment",
    title: "Entertainment",
    blurb: "Music mixes, dance, animals and more.",
    groups: ["Entertainment", "Wrestling", "Political Podcast"],
  },
  {
    slug: "business",
    title: "Business",
    blurb: "Markets and business news, live.",
    groups: ["Business"],
  },
  {
    slug: "sports",
    title: "Sports",
    blurb: "Leagues and broadcasters — live when a game is on.",
    groups: ["Sports"],
  },
];

const HOME_GROUP = "Home";

/* ── Build ──────────────────────────────────────────────────── */

function keyOf(ch) {
  if (ch.handle) return "h:" + ch.handle.toLowerCase();
  if (ch.id) return "c:" + ch.id;
  if (ch.videoId) return "v:" + ch.videoId;
  return "n:" + ch.name.toLowerCase();
}

function dedupeKey(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/(english|hindi|hd|live|tv|247|24x7|now|news)+$/g, "");
}

const seenKeys = new Set();
const seenNames = new Set();
const channels = [];

function add(entry) {
  const ch = {
    name: entry.name,
    cat: entry.cat || entry.group,
    group: entry.group,
    logo: entry.logo || "",
    ...(entry.handle ? { handle: entry.handle } : {}),
    ...(entry.id ? { id: entry.id } : {}),
    ...(entry.videoId ? { videoId: entry.videoId } : {}),
    ...(entry.liveUrl ? { liveUrl: entry.liveUrl } : {}),
  };
  const key = keyOf(ch);
  const nk = dedupeKey(ch.name);
  if (seenKeys.has(key) || seenNames.has(nk)) return false;
  seenKeys.add(key);
  seenNames.add(nk);
  channels.push(ch);
  return true;
}

for (const s of SEED) add(s);

const source = parseList2(raw);
let dropped = 0;
for (const row of source) {
  if (!isKept(row)) {
    dropped++;
    continue;
  }
  const norm = normalizeUrl(row.url);
  add({
    name: row.name,
    cat: row.group,
    group: row.group,
    logo: row.logo,
    ...norm,
  });
}

const groupsPresent = [...new Set(channels.map((c) => c.group))];
const presets = PRESETS.filter((p) => p.groups.some((g) => groupsPresent.includes(g)));

const catalog = {
  generatedAt: new Date().toISOString(),
  source: "list2.txt + curated international English seed",
  home: HOME_GROUP,
  presets,
  channels,
};

writeFileSync(resolve(root, "public", "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");

console.log(`Parsed ${source.length} list2 entries, dropped ${dropped} (non-English/regional).`);
console.log(`Catalog: ${channels.length} channels across ${groupsPresent.length} groups.`);
console.log(`Presets: ${presets.map((p) => p.slug).join(", ")}`);
const counts = {};
for (const c of channels) counts[c.group] = (counts[c.group] || 0) + 1;
console.log(counts);