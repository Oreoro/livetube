# ▲ LiveTube

Twitch-style frontend for YouTube Live with a shadcn-inspired dark UI.
Embedded players, a channel rail, live chat, and **quota-free** live status
checks with concurrent viewer counts.

## How live detection works (no API quota)

The serverless function in `api/live.js` pings YouTube's **public** pages
server-side — zero Data API calls, zero quota:

- **Primary (reliable):** `GET https://www.youtube.com/@{handle}/live`
  - Live pages return full HTML containing `"isLive":true` plus the current
    `videoId` (from `videoDetails` / canonical URL).
- **Fallback:** `GET https://www.youtube.com/channel/{ID}/live`
  - If live, YouTube redirects to the active watch URL (`/watch?v=…`).
  - ⚠️ From some networks this endpoint serves a data-less JS shell, so a
    negative result here means **unknown**, not offline. Prefer handles.

The client polls `/api/live?handle=…` every 60s and stores the `channelId`
returned by the proxy (used for embeds + "Open on YouTube" links).

## Run locally

```bash
npx vercel dev
# → http://localhost:3000
```

(The live checker is a serverless function, so a static server alone won't expose
`/api/live` — use `vercel dev` or deploy.)

## Deploy

```bash
npx vercel --prod
```

No environment variables needed.

## Features

- **Twitch-style layout, shadcn/ui polish** — zinc dark palette, skeleton
  loaders, focus rings, CSS tooltips, staggered fade-ins, custom scrollbars.
- **Channel rail + discover grid** — verified 24/7 channels (Lofi Girl,
  The Good Life Radio, NASA ISS, earthTV, Sky News, Bloomberg, CNBC, Times Now,
  Yahoo Finance, DW, France 24, TRT, CGTN, Al Jazeera, Al Arabiya, ABC News,
  NDTV, WION, India Today, Aaj Tak) with LIVE badges and concurrent viewer counts.
- **Embedded playback** — distraction-free 16:9 player, theater mode (`T`).
- **Live chat embed** — mounted automatically when a `videoId` is detected
  (`/live_chat?embed_domain=` — works once deployed to a real domain).
- **Universal search** — paste a channel URL, `@handle`, `c/name`, video link,
  channel id (`UC…`) or 11-char video id. Handles are resolved server-side.
- **`/`** focuses search · **`T`** toggles theater · statuses auto-refresh every 60s.

## API

| Endpoint | Params | Returns |
|---|---|---|
| `GET /api/live` | `handle=name` (preferred) \| `channel=UC…` \| `url=…` | `{ live, videoId, channelId }` |

`live` is `true` / `false` / `null` (unknown — checker couldn't determine).

Programmatic quota-free check for any channel:

```
curl "https://your-app.vercel.app/api/live?handle=LofiGirl"
# → {"live":true,"videoId":"rFZHOHl-L8A","channelId":"UCSJ4gkVC6NrvII8umztf0Ow"}
```
