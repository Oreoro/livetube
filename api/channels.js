import { storage } from "./_storage.js";

const CUSTOM_KEY = "livetube:custom_channels";
const memory = [];

const HANDLE_RE = /^[A-Za-z0-9._-]{2,64}$/;

function json(res, status, body) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function isAuthorized(req) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return true;
  return req.headers["x-admin-token"] === token;
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

async function readBody(req) {
  let body = "";
  req.on("data", (c) => {
    body += c;
    if (body.length > 8192) req.destroy();
  });
  await new Promise((resolve) => req.on("end", resolve));
  try {
    return JSON.parse(body || "{}");
  } catch {
    return {};
  }
}

async function listChannels() {
  return (await storage.get(CUSTOM_KEY)) ?? memory;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return json(res, 401, { error: "Invalid admin token" });
  }

  if (req.method === "GET") {
    const channels = await listChannels();
    return json(res, 200, { channels, persistent: storage.enabled });
  }

  if (req.method === "POST") {
    const parsed = await readBody(req);
    if (!validChannel(parsed)) {
      return json(res, 400, { error: "Invalid channel payload" });
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
      return json(res, 409, { error: "Channel already exists" });
    }
    channels.push(entry);
    await storage.set(CUSTOM_KEY, channels);
    return json(res, 201, { ok: true, channel: entry });
  }

  if (req.method === "DELETE") {
    const handle = sanitizeHandle(req.query.handle);
    if (!handle) return json(res, 400, { error: "handle query param required" });
    const channels = await listChannels();
    const idx = channels.findIndex((c) => c.handle === handle);
    if (idx === -1) return json(res, 404, { error: "Channel not found" });
    channels.splice(idx, 1);
    await storage.set(CUSTOM_KEY, channels);
    return json(res, 200, { ok: true });
  }

  return json(res, 405, { error: "Method not allowed" });
}
