import { checkDescriptor } from "./_live.js";
import { json, mapLimit, rateLimited } from "./_http.js";

const MAX_CHANNELS = 24;
const CONCURRENCY = 6;

/*
 * Batch live-status endpoint.
 * POST { channels: [{ key, handle?|id?|videoId?|liveUrl? }] }
 * →    { statuses: { [key]: { live, videoId, channelId, viewers } } }
 */
export async function onRequest({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }
  if (rateLimited(request, 180)) {
    return json(429, { error: "Too many requests" }, { "Retry-After": "30" });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const list = Array.isArray(body?.channels) ? body.channels.slice(0, MAX_CHANNELS) : [];
  if (!list.length) return json(400, { error: "channels array required" });

  const results = await mapLimit(list, CONCURRENCY, async (ch) => [
    String(ch.key ?? ""),
    await checkDescriptor(ch),
  ]);

  return json(200, { statuses: Object.fromEntries(results) }, {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
}