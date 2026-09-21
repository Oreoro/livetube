import { checkHandle } from "./_live.js";
import { json, mapLimit } from "./_http.js";

/*
 * Cache warmer. Cloudflare Pages has no scheduled triggers, so ping this
 * endpoint from an external cron (cron-job.org, GitHub Actions, a scheduled
 * Worker, etc.) — e.g. daily at 12:00.
 */
const HANDLES = [
  "LofiGirl",
  "TheGoodLifeRadio",
  "ChillhopMusic",
  "SoothingRelaxation",
  "CafeMusicBGMChannel",
  "NASA",
  "EarthTV",
  "ExploreLiveNatureCams",
  "business",
  "CNBC",
  "YahooFinance",
  "SkyNews",
  "CNN",
  "CBSNews",
  "NBCNews",
  "Reuters",
  "euronews",
  "dwnews",
  "france24",
  "trtworld",
  "CGTN",
  "aljazeeraenglish",
  "ABCNews",
  "WION",
  "AlArabiyaEnglish",
  "GBNews",
  "NewsNation",
];

export async function onRequest({ request }) {
  const limit = Math.min(Number(new URL(request.url).searchParams.get("limit") ?? 0) || HANDLES.length, HANDLES.length);
  const handles = HANDLES.slice(0, limit);
  const channels = await mapLimit(handles, 6, async (handle) => {
    const result = await checkHandle(handle);
    return { handle, ...result };
  });
  return json(200, { ok: true, at: new Date().toISOString(), channels });
}