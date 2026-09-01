import { getCached, setCached } from "./_cache.js";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function json(res, status, body) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(body));
}

function extractVideoId(url) {
  const m = String(url).match(/[?&]v=([\w-]{6,})/);
  return m ? m[1] : null;
}

function extractPlayerResponse(html) {
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

function extractChannelId(html) {
  const m =
    html.match(/"channelId":"(UC[\w-]{20,})"/) ||
    html.match(/"externalId":"(UC[\w-]{20,})"/);
  return m ? m[1] : null;
}

function extractViewers(html) {
  const m =
    html.match(/"originalViewCount":"(\d+)"/) ||
    html.match(/"viewCount":\s*"(\d+)"/) ||
    html.match(/"viewCount":\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

function collectVideoIdCandidates(finalUrl, html) {
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

async function ping(url) {
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

async function verifyLiveVideo(videoId, channelId) {
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

async function checkHandle(handle) {
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

async function checkChannelId(channelId) {
  const { finalUrl, html } = await ping(
    `https://www.youtube.com/channel/${channelId}/live?hl=en`
  );
  const videoId = extractVideoId(finalUrl);
  if (videoId || /"isLive":true/.test(html)) {
    return { live: true, videoId, channelId };
  }
  return { live: null, videoId: null, channelId };
}

async function checkVideo(videoId) {
  const { html } = await ping(`https://www.youtube.com/watch?v=${videoId}&hl=en`);
  return {
    live: /"isLive":true/.test(html),
    videoId,
    channelId: extractChannelId(html),
  };
}

export default async function handler(req, res) {
  const { channel, handle, url } = req.query;

  try {
    if (url) {
      const id = extractVideoId(url) || (String(url).match(/^([\w-]{11})$/) || [])[1];
      if (!id) return json(res, 400, { error: "Could not extract a video id" });
      return json(res, 200, await checkVideo(id));
    }

    if (channel) {
      if (!/^UC[\w-]{20,}$/.test(channel)) {
        return json(res, 400, { error: "Invalid channel id" });
      }
      return json(res, 200, await checkChannelId(channel));
    }

    if (handle) {
      const clean = String(handle).replace(/^@/, "");
      const result = await checkHandle(clean);
      if (result.notFound) {
        return json(res, 404, { error: "Channel not found or not resolvable" });
      }
      return json(res, 200, result);
    }

    return json(res, 400, { error: "Pass ?channel=UC…, ?handle=name or ?url=…" });
  } catch (err) {
    return json(res, 502, { error: "Upstream fetch failed", detail: String(err?.message) });
  }
}
