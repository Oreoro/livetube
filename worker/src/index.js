/*
 * LiveTube cache warmer.
 *
 * Cloudflare Pages has no scheduled triggers, so this tiny Worker runs on a
 * Cron Trigger and pings the Pages app's /api/cron endpoint to pre-warm the
 * live-status cache. It can also be hit manually via its fetch handler.
 */

async function warm(env) {
  const url = env.CRON_URL || "https://livetube-bys.pages.dev/api/cron";
  const started = Date.now();
  try {
    const r = await fetch(url, { cf: { cacheTtl: 0 } });
    return { ok: r.ok, status: r.status, url, ms: Date.now() - started, at: new Date().toISOString() };
  } catch (err) {
    return { ok: false, url, error: String(err?.message || err), at: new Date().toISOString() };
  }
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(warm(env));
  },
  async fetch(_request, env) {
    return Response.json(await warm(env));
  },
};