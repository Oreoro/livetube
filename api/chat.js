const store = (globalThis.__livetubeChat ||= new Map());
const lastSeq = (globalThis.__livetubeChatSeq ||= new Map());
const lastPost = (globalThis.__livetubeChatRate ||= new Map());

const MAX_MESSAGES = 200;
const MAX_TEXT_LEN = 280;
const POST_INTERVAL_MS = 1200;

function json(res, status, body) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function sanitize(value, max) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}

function channelStore(channel) {
  if (!store.has(channel)) {
    const seq = (lastSeq.get(channel) ?? 0) + 1;
    lastSeq.set(channel, seq);
    store.set(channel, [
      {
        seq,
        name: "LiveTube",
        text: "Welcome to the stream chat. Be kind.",
        ts: Date.now(),
        sys: true,
      },
    ]);
  }
  return store.get(channel);
}

async function readBody(req) {
  let body = "";
  req.on("data", (c) => {
    body += c;
    if (body.length > 4096) req.destroy();
  });
  await new Promise((resolve) => req.on("end", resolve));
  try {
    return JSON.parse(body || "{}");
  } catch {
    return {};
  }
}

function postMessage(req, res, channel, name, text) {
  const ip = req.headers["x-forwarded-for"] || "local";
  const now = Date.now();
  if (now - (lastPost.get(ip) ?? 0) < POST_INTERVAL_MS) {
    return json(res, 429, { error: "Too fast. Wait a moment." });
  }
  lastPost.set(ip, now);

  const seq = (lastSeq.get(channel) ?? 0) + 1;
  lastSeq.set(channel, seq);
  const message = { seq, name, text, ts: now, sys: false };
  const messages = channelStore(channel);
  messages.push(message);
  if (messages.length > MAX_MESSAGES) {
    messages.splice(0, messages.length - MAX_MESSAGES);
  }
  return json(res, 200, { ok: true, message });
}

export default async function handler(req, res) {
  const method = (req.method || "GET").toUpperCase();

  if (method === "GET") {
    const url = new URL(req.url, "http://localhost");
    const channel = sanitize(url.searchParams.get("channel"), 80);
    const after = Number(url.searchParams.get("after") ?? 0) || 0;
    if (!channel) return json(res, 400, { error: "channel required" });

    const messages = channelStore(channel).filter((m) => m.seq > after).slice(-80);
    const all = channelStore(channel);
    return json(res, 200, {
      messages,
      next: all.length ? all[all.length - 1].seq : after,
    });
  }

  if (method === "POST") {
    const body = await readBody(req);
    const channel = sanitize(body.channel, 80);
    const name = sanitize(body.name, 32) || "guest";
    const text = sanitize(body.text, MAX_TEXT_LEN);
    if (!channel || !text) {
      return json(res, 400, { error: "channel and text required" });
    }
    return postMessage(req, res, channel, name, text);
  }

  return json(res, 405, { error: "Method not allowed" });
}
