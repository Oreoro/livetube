const store = (globalThis.__livetubeCache ||= new Map());

export function getCached(key, ttlMs = 25000) {
  const entry = store.get(key);
  if (entry && Date.now() - entry.t < ttlMs) return entry.v;
  return null;
}

export function setCached(key, value) {
  store.set(key, { t: Date.now(), v: value });
  if (store.size > 500) {
    const now = Date.now();
    for (const [k, e] of store) {
      if (now - e.t > 120000) store.delete(k);
    }
  }
}
