const BASE_URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const enabled = Boolean(BASE_URL && TOKEN);

async function command(...args) {
  const url = `${BASE_URL}/${args.map(encodeURIComponent).join("/")}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  const data = await r.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

export const storage = {
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
