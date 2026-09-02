import { getCached, setCached } from "./_cache.js";

const HANDLES = [
  "LofiGirl",
  "TheGoodLifeRadio",
  "ChillhopMusic",
  "SoothingRelaxation",
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
  "TalkTV",
  "dwnews",
  "france24",
  "trtworld",
  "CGTN",
  "aljazeeraenglish",
  "AlArabiya",
  "TimesNow",
  "ABCNews",
  "ndtv",
  "WION",
  "IndiaToday",
  "aajtak",
];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function probe(handle) {
  const cached = getCached(`live:h:${handle}`);
  if (cached) return { handle, cached: true, ...cached };
  try {
    const r = await fetch(`https://www.youtube.com/@${handle}/live?hl=en`, {
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        "Accept-Language": "en-US,en;q=0.9",
        Cookie: "CONSENT=YES+cb; SOCS=CAI",
      },
    });
    const html = await r.text();
    const videoId = html.match(/"videoDetails":\{"videoId":"([\w-]{11})"/)?.[1] ?? null;
    const channelId = html.match(/"channelId":"(UC[\w-]{20,})"/)?.[1] ?? null;
    const viewers = html.match(/"originalViewCount":"(\d+)"/)?.[1] ?? null;
    const live = Boolean(videoId) || /"isLive":true/.test(html);
    const value = {
      live,
      videoId: live ? videoId : null,
      channelId,
      viewers: viewers ? Number(viewers) : null,
    };
    setCached(`live:h:${handle}`, value);
    return { handle, ...value };
  } catch {
    return { handle, live: null, videoId: null, channelId: null, viewers: null };
  }
}

export default async function handler(req, res) {
  const results = await Promise.allSettled(HANDLES.map(probe));
  const channels = results.map((r) =>
    r.status === "fulfilled" ? r.value : { handle: "?", live: null }
  );
  res.status(200);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({ ok: true, at: new Date().toISOString(), channels }));
}
