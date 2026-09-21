import { getCached, setCached } from "./_cache.js";

export const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export function extractVideoId(url) {
  const m = String(url).match(/[?&]v=([\w-]{11})/);
  return m ? m[1] : null;
}

export function extractPlayerResponse(html) {
  const key = "ytInitialPlayerResponse";
  let i = html.indexOf(key);
  while (i !== -1) {
    const eq = html.indexOf("=", i + key.length);
    if (eq === -1) return null;
    let j = eq + 1;
    while (j < html.length && html[j] !== "{") j++;
    if (j >= html.length) return null;
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let k = j; k < html.length; k++) {
      const c = html[k];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(html.slice(j, k + 1));
          } catch {
            break;
          }
        }
      }
    }
    i = html.indexOf(key, i + key.length);
  }
  return null;
}

export function extractChannelId(html) {
  const m =
    html.match(/"channelId":"(UC[\w-]{20,})"/) ||
    html.match(/"externalId":"(UC[\w-]{20,})"/);
  return m ? m[1] : null;
}

export function extractViewers(html) {
  const m =
    html.match(/"originalViewCount":"(\d+)"/) ||
    html.match(/"viewCount":\s*"(\d+)"/) ||
    html.match(/"viewCount":\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

export function collectVideoIdCandidates(finalUrl, html) {
  const pr = extractPlayerResponse(html);
  const out = [];
  const push = (v) => {
    if (v && /^[\w-]{11}$/.test(v) && !out.includes(v)) out.push(v);
  };
  push(extractVideoId(finalUrl));
  push(pr?.videoDetails?.videoId);
  const endpoint = html.match(/"currentVideoEndpoint":\{.{0,300}?"videoId":"([\w-]{11})"/s);
  push(endpoint?.[1]);
  const canon = html.match(
    /(?:rel="canonical" href=|property="og:url" content=)"(https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11})"/
  );
  push(canon && extractVideoId(canon[1]));
  push(html.match(/"videoRenderer":\{"videoId":"([\w-]{11})"/)?.[1]);
  push(html.match(/"gridVideoRenderer":\{"videoId":"([\w-]{11})"/)?.[1]);
  push(html.match(/"videoId":"([\w-]{11})"/)?.[1]);
  return out;
}

export async function ping(url) {
  const r = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": UA,
      "Accept-Language": "en-US,en;q=0.9",
      Cookie: "CONSENT=YES+cb; SOCS=CAI",
    },
  });
  return { finalUrl: r.url, html: await r.text() };
}

export async function verifyLiveVideo(videoId, channelId) {
  try {
    const { html } = await ping(`https://www.youtube.com/watch?v=${videoId}&hl=en`);
    const pr = extractPlayerResponse(html);
    const isLive =
      /"isLive":true/.test(html) ||
      pr?.microformat?.playerMicroformatRenderer?.liveBroadcastDetails?.isLiveNow === true;
    if (!isLive) return false;
    const owner = pr?.videoDetails?.channelId ?? extractChannelId(html);
    return !channelId || !owner || owner === channelId;
  } catch {
    return false;
  }
}

export async function checkHandle(handle) {
  const cacheKey = `live:h:${handle}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { finalUrl, html } = await ping(
    `https://www.youtube.com/@${encodeURIComponent(handle)}/live?hl=en`
  );
  const channelId = extractChannelId(html);
  const live = Boolean(extractVideoId(finalUrl)) || /"isLive":true/.test(html);
  if (!channelId && !live) {
    return { live: null, videoId: null, channelId: null, viewers: null, notFound: true };
  }

  const candidates = collectVideoIdCandidates(finalUrl, html);
  let videoId = null;
  for (const cand of candidates.slice(0, 3)) {
    if (await verifyLiveVideo(cand, channelId)) {
      videoId = cand;
      break;
    }
  }
  if (!videoId && live) videoId = candidates[0] ?? null;

  const result = {
    live,
    videoId: live ? videoId : null,
    channelId,
    viewers: extractViewers(html),
  };
  setCached(cacheKey, result);
  return result;
}

export async function checkChannelId(channelId) {
  const cacheKey = `live:c:${channelId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { finalUrl, html } = await ping(
    `https://www.youtube.com/channel/${channelId}/live?hl=en`
  );
  const videoId = extractVideoId(finalUrl);
  const live = Boolean(videoId) || /"isLive":true/.test(html);
  const result = { live: live ? true : null, videoId, channelId, viewers: extractViewers(html) };
  setCached(cacheKey, result);
  return result;
}

export async function checkVideo(videoId) {
  const cacheKey = `live:v:${videoId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { html } = await ping(`https://www.youtube.com/watch?v=${videoId}&hl=en`);
  const result = {
    live: /"isLive":true/.test(html),
    videoId,
    channelId: extractChannelId(html),
    viewers: extractViewers(html),
  };
  setCached(cacheKey, result);
  return result;
}

/* Handles /c/Name, /user/Name and any other youtube URL by pinging it directly. */
export async function checkLiveUrl(url) {
  const cacheKey = `live:u:${url}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { finalUrl, html } = await ping(`${url}${url.includes("?") ? "&" : "?"}hl=en`);
  const channelId = extractChannelId(html);
  const candidates = collectVideoIdCandidates(finalUrl, html);
  const live = Boolean(extractVideoId(finalUrl)) || /"isLive":true/.test(html);
  let videoId = null;
  for (const cand of candidates.slice(0, 2)) {
    if (await verifyLiveVideo(cand, channelId)) {
      videoId = cand;
      break;
    }
  }
  if (!videoId && live) videoId = candidates[0] ?? null;
  const result = {
    live: live ? true : null,
    videoId: live ? videoId : null,
    channelId,
    viewers: extractViewers(html),
  };
  setCached(cacheKey, result);
  return result;
}

export function youtubePath(url) {
  try {
    return new URL(url).pathname + new URL(url).search;
  } catch {
    return String(url);
  }
}

export async function checkDescriptor(ch) {
  try {
    if (ch.handle) return await checkHandle(String(ch.handle).replace(/^@/, ""));
    if (ch.id) return await checkChannelId(ch.id);
    if (ch.videoId) return await checkVideo(ch.videoId);
    if (ch.liveUrl) {
      const url = String(ch.liveUrl);
      if (/[?&]v=[\w-]{11}/.test(url)) return await checkVideo(extractVideoId(url));
      const mChan = url.match(/\/channel\/(UC[\w-]{20,})/);
      if (mChan) return await checkChannelId(mChan[1]);
      return await checkLiveUrl(url);
    }
    return { live: null, videoId: null, channelId: null, viewers: null };
  } catch {
    return { live: null, videoId: null, channelId: null, viewers: null };
  }
}