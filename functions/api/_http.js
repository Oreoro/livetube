export function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

/* Best-effort per-isolate rate limit (Cloudflare may also rate-limit upstream). */
const buckets = (globalThis.__livetubeRate ||= new Map());

export function rateLimited(req, limit = 120, windowMs = 60000) {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "local";
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now - bucket.t > windowMs) {
    buckets.set(ip, { t: now, n: 1 });
    return false;
  }
  bucket.n += 1;
  if (buckets.size > 5000) {
    for (const [key, value] of buckets) {
      if (now - value.t > windowMs) buckets.delete(key);
    }
  }
  return bucket.n > limit;
}

export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}