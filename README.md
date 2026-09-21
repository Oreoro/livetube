# ▲ LiveTube

Twitch-style frontend for YouTube Live, hosted on **Cloudflare Pages**.
Embedded players, a channel rail, live chat, and **quota-free** live status
checks with concurrent viewer counts. Channels come from `list2.txt`, filtered
to English-language international streams and grouped into presets.

## Presets

Deep-linkable routes select a slice of the catalog:

| Route | Contents |
|---|---|
| `/` | Home — the full catalog |
| `/music` | Lo-fi, chillhop, jazz, radio |
| `/news` | International English-language news |
| `/livecams` | City, beach, wildlife and weather cams |
| `/space` | NASA / Earth views |
| `/documentary` | Long-form and scenic streams |
| `/kids` | Family-safe channels |
| `/entertainment` | Music mixes, dance, wrestling, podcasts |
| `/business` | Markets and business news |
| `/sports` | Leagues and broadcasters, live when a game is on |
| `/favorites` | Channels you starred (☆ / `F`) |

`public/_redirects` rewrites these paths to the SPA; the client reads the
pathname and renders the matching preset.

## Project layout

```
functions/api/        Cloudflare Pages Functions (the API)
public/               Static site (index.html, app.js, styles.css, catalog.json)
scripts/build-catalog.mjs   Regenerates public/catalog.json from list2.txt
list2.txt             Source channel list
wrangler.jsonc        Pages config
```

## Catalog

`public/catalog.json` is generated from `list2.txt` plus a small curated seed
of international English channels. Regional / non-English groups are dropped;
the mixed `News` group keeps only international English outlets.

```bash
npm run build:catalog   # after editing list2.txt
```

## Run locally

```bash
npx wrangler pages dev public
# → http://localhost:8788
```

(The live checker is a Pages Function, so a static server alone won't expose
`/api/*` — use `wrangler pages dev`.)

## Deploy to Cloudflare Pages

```bash
npx wrangler pages deploy public
```

Or connect the Git repo in the Cloudflare dashboard:

- **Build command:** `npm run build:catalog` (or leave empty)
- **Build output directory:** `public`

Community-channel storage uses the native **Cloudflare KV** binding
`LIVETUBE_KV` declared in `wrangler.jsonc` (create it with
`wrangler kv namespace create LIVETUBE_KV`). Upstash Redis REST is supported as
a fallback, and per-isolate memory is the last resort.

Optional environment variables:

| Variable | Purpose |
|---|---|
| `ADMIN_TOKEN` | Protects `/api/channels` (admin panel) |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Alternate durable storage if KV is not bound |

### Cache warmer

Cloudflare Pages has no scheduled triggers, so a tiny companion Worker
(`worker/`) runs on a **Cron Trigger** and pings the Pages `/api/cron`
endpoint daily at 12:00 to pre-warm the live-status cache.

```bash
cd worker
npx wrangler deploy      # deploys livetube-cron with the daily schedule
curl https://livetube-cron.<your-subdomain>.workers.dev/   # manual trigger
```

Update `CRON_URL` in `worker/wrangler.jsonc` if you deploy the Pages app under
a different domain.

## API

| Endpoint | Params | Returns |
|---|---|---|
| `GET /api/live` | `handle=name` \| `channel=UC…` \| `url=…` | `{ live, videoId, channelId, viewers }` |
| `POST /api/status` | `{ channels: [{ key, handle?\|id?\|videoId?\|liveUrl? }] }` | `{ statuses: { key: {…} } }` |
| `GET /api/channels` | admin token header | `{ channels, persistent }` |
| `GET/POST/DELETE /api/channels` | admin | manage community channels |
| `GET/POST /api/chat` | `channel`, `after` | per-channel chat |
| `GET /api/cron` | `limit?` | warm the live-status cache |

`live` is `true` / `false` / `null` (unknown — checker couldn't determine).

Programmatic quota-free check:

```
curl "https://your-project.pages.dev/api/live?handle=LofiGirl"
# → {"live":true,"videoId":"rFZHOHl-L8A","channelId":"UCSJ4gkVC6NrvII8umztf0Ow"}
```

## How live detection works (no API quota)

Pages Functions ping YouTube's **public** pages server-side — zero Data API
calls, zero quota:

- **Primary:** `GET https://www.youtube.com/@{handle}/live` returns full HTML
  containing `"isLive":true` plus the current `videoId`.
- **Channel ids:** `GET https://www.youtube.com/channel/{ID}/live` redirects to
  the active watch URL when live.
- **Videos:** `GET https://www.youtube.com/watch?v=…` is inspected for
  `"isLive":true`.

Results are cached in-isolate for 25s, and the client batches status checks
(`/api/status`, 12 channels per request) with a 60s client cache.