import { checkDescriptor, extractVideoId, isYouTubeUrl } from "./_live.js";
import { json, rateLimited } from "./_http.js";

const CACHE = { "Access-Control-Allow-Origin": "*", "Cache-Control": "s-maxage=30, stale-while-revalidate=60" };

export async function onRequest({ request }) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel");
  const handle = searchParams.get("handle");
  const url = searchParams.get("url");

  if (rateLimited(request, 120)) {
    return json(429, { error: "Too many requests" }, { "Retry-After": "30" });
  }

  try {
    if (url) {
      if (!isYouTubeUrl(url) && !/^[\w-]{11}$/.test(url)) {
        return json(400, { error: "url must be a YouTube URL" });
      }
      const id = extractVideoId(url) || (String(url).match(/^([\w-]{11})$/) || [])[1];
      const result = id ? await checkDescriptor({ videoId: id }) : await checkDescriptor({ liveUrl: url });
      return json(200, result, CACHE);
    }

    if (channel) {
      if (!/^UC[\w-]{20,}$/.test(channel)) {
        return json(400, { error: "Invalid channel id" });
      }
      return json(200, await checkDescriptor({ id: channel }), CACHE);
    }

    if (handle) {
      const result = await checkDescriptor({ handle: String(handle).replace(/^@/, "") });
      if (result.notFound) {
        return json(404, { error: "Channel not found or not resolvable" });
      }
      return json(200, result, CACHE);
    }

    return json(400, { error: "Pass ?channel=UC…, ?handle=name or ?url=…" });
  } catch (err) {
    return json(502, { error: "Upstream fetch failed", detail: String(err?.message) });
  }
}