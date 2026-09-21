/*
 * Optional durable storage backed by Upstash Redis REST.
 * Configure UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN as Pages
 * environment variables/secrets. Without them the API falls back to
 * per-isolate memory.
 */

export function createStorage(env = {}) {
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