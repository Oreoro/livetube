import { createStorage } from "./_storage.js";
import { json } from "./_http.js";

const CUSTOM_KEY = "livetube:custom_channels";
const memory = [];
const HANDLE_RE = /^[A-Za-z0-9._-]{2,64}$/;

function isAuthorized(req, env) {
  const token = env.ADMIN_TOKEN;
  if (!token) return true;
  return req.headers.get("x-admin-token") === token;
}

function validChannel(body) {
  return (
    body &&
    HANDLE_RE.test(body.handle || "") &&
    typeof body.name === "string" &&
    body.name.length <= 64 &&
    typeof body.cat === "string" &&
    body.cat.length <= 128
  );
}

function sanitizeHandle(raw) {
  const h = String(raw ?? "").replace(/^@/, "");
  return HANDLE_RE.test(h) ? h : null;
}

export async function onRequest({ request, env }) {
  if (!isAuthorized(request, env)) {
    return json(401, { error: "Invalid admin token" });
  }

  const storage = createStorage(env);
  const listChannels = async () => (await storage.get(CUSTOM_KEY)) ?? memory;

  if (request.method === "GET") {
    const channels = await listChannels();
    return json(200, { channels, persistent: storage.enabled });
  }

  if (request.method === "POST") {
    let parsed;
    try {
      parsed = await request.json();
    } catch {
      parsed = {};
    }
    if (!validChannel(parsed)) {
      return json(400, { error: "Invalid channel payload" });
    }
    const entry = {
      handle: parsed.handle,
      name: parsed.name,
      cat: parsed.cat || "community channel",
      group: parsed.group || "Community",
      addedAt: Date.now(),
    };
    const channels = await listChannels();
    if (channels.some((c) => c.handle === entry.handle)) {
      return json(409, { error: "Channel already exists" });
    }
    channels.push(entry);
    await storage.set(CUSTOM_KEY, channels);
    return json(201, { ok: true, channel: entry });
  }

  if (request.method === "DELETE") {
    const handle = sanitizeHandle(new URL(request.url).searchParams.get("handle"));
    if (!handle) return json(400, { error: "handle query param required" });
    const channels = await listChannels();
    const idx = channels.findIndex((c) => c.handle === handle);
    if (idx === -1) return json(404, { error: "Channel not found" });
    channels.splice(idx, 1);
    await storage.set(CUSTOM_KEY, channels);
    return json(200, { ok: true });
  }

  return json(405, { error: "Method not allowed" });
}