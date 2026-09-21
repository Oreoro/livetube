import { json } from "./_http.js";

const store = (globalThis.__livetubeChat ||= new Map());
const lastSeq = (globalThis.__livetubeChatSeq ||= new Map());
const lastPost = (globalThis.__livetubeChatRate ||= new Map());

const MAX_MESSAGES = 200;
const MAX_TEXT_LEN = 280;
const POST_INTERVAL_MS = 1200;

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

function postMessage(req, channel, name, text) {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "local";
  const now = Date.now();
  if (now - (lastPost.get(ip) ?? 0) < POST_INTERVAL_MS) {
    return json(429, { error: "Too fast. Wait a moment." });
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
  return json(200, { ok: true, message });
}

export async function onRequest({ request }) {
  const method = (request.method || "GET").toUpperCase();

  if (method === "GET") {
    const url = new URL(request.url);
    const channel = sanitize(url.searchParams.get("channel"), 80);
    const after = Number(url.searchParams.get("after") ?? 0) || 0;
    if (!channel) return json(400, { error: "channel required" });

    const all = channelStore(channel);
    const messages = all.filter((m) => m.seq > after).slice(-80);
    return json(200, {
      messages,
      next: all.length ? all[all.length - 1].seq : after,
    });
  }

  if (method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const channel = sanitize(body.channel, 80);
    const name = sanitize(body.name, 32) || "guest";
    const text = sanitize(body.text, MAX_TEXT_LEN);
    if (!channel || !text) {
      return json(400, { error: "channel and text required" });
    }
    return postMessage(request, channel, name, text);
  }

  return json(405, { error: "Method not allowed" });
}