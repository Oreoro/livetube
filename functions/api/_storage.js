/*
 * Durable storage for community channels.
 *
 * Prefers a native Cloudflare KV binding (`LIVETUBE_KV`), configured in
 * wrangler.jsonc. Falls back to Upstash Redis REST if that binding is absent
 * but UPSTASH_REDIS_REST_URL/TOKEN are set. Without either, the API uses
 * per-isolate memory (not durable).
 */

export function createStorage(env = {}) {
  const kv = env.LIVETUBE_KV;
  if (kv && typeof kv.get === "function") {
    return {
      enabled: true,
      backend: "kv",
      async get(key) {
        const raw = await kv.get(key, "json");
        return raw ?? null;
      },
      async set(key, value) {
        await kv.put(key, JSON.stringify(value));
      },
      async del(key) {
        await kv.delete(key);
      },
    };
  }

  const baseUrl = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  const enabled = Boolean(baseUrl && token);

  async function command(...args) {
    const url = `${baseUrl}/${args.map(encodeURIComponent).join("/")}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`redis ${r.status}`);
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  }

  return {
    enabled,
    backend: enabled ? "upstash" : "memory",
    async get(key) {
      if (!enabled) return null;
      const raw = await command("GET", key);
      return raw ? JSON.parse(raw) : null;
    },
    async set(key, value) {
      if (!enabled) return;
      await command("SET", key, JSON.stringify(value));
    },
    async del(key) {
      if (!enabled) return;
      await command("DEL", key);
    },
  };
}