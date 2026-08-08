# NSBROOKLYN — BetBolt Leaderboard, Giveaways & Milestones

A React + Vite affiliate site for code **NSB**: a home page (hero, bonus cards,
leaderboard promo), a live **$5,000 BetBolt leaderboard**, **Discord giveaways**,
a **weekly wager raffle** with provably-fair draws, and a **wager milestone**
ladder.

Giveaways and raffles are two different things, and both are run from `/admin`:

| | Giveaway (`/giveaways`) | Wager raffle (`/raffles`) |
|---|---|---|
| Who can enter | anyone logged in with Discord | anyone wagering under code NSB |
| How you enter | click **Enter**, once | automatically, by wagering |
| Odds | equal for everyone | 1 ticket per $100 wagered |
| Prize | whatever the admin sets | cash split between N winners |

Design ported from the [tegens](https://github.com/aspct49-dev/tegens) site
(sidebar shell, podium, bonus cards, topo texture) recolored to the NSBROOKLYN
maroon/red + gold colorway.

## Tech
- **React 18 + Vite** SPA, **React Router** (`/`, `/leaderboard`, `/giveaways`,
  `/raffles`, `/milestones`, `/winners`, `/admin`, plus legal pages).
- Standings come from the BetBolt affiliate API through `/api/leaderboard`, which
  proxies it server-side (the API key never reaches the browser) and caches
  aggressively with 429 backoff.
- Discord OAuth login with a signed-cookie session; `/admin` is gated on
  `ADMIN_DISCORD_IDS`.

## Getting started
```bash
npm install
cp .env.example .env.local   # fill in the BetBolt + Discord values
npm run dev                  # http://localhost:5173
```
- `npm run build` → production build in `dist/`
- `npm run preview` → preview the build locally

In dev, `vite.config.js` mounts the same `api/*.js` handlers Vercel runs in
production, so `/api/...` works identically locally.

## Editing content
Site copy and prizes live in [`src/data/leaderboard.js`](src/data/leaderboard.js):
- `config.prizePool`, `config.referralCode`, `config.socials`, `config.promo`.
- `casinos[]` — name, affiliate URL, logo, prize ladder (1st → last), and the
  placeholder `players` list used until the API responds.
- `milestones` — the wager reward tiers on `/milestones`.
- `bonuses` — the four home-page bonus cards.
- `pastWinners` — archived leaderboard periods for `/winners`.

Colors live in the `:root` block of [`src/index.css`](src/index.css).

## Giveaways ([`api/_lib/giveaways.js`](api/_lib/giveaways.js))
Posted from `/admin`: a title, a prize (any text — `$50 Cash`, `1x Nitro`, …),
a closing time and a winner count. Anyone logged in with Discord enters with one
click; the entry is keyed by Discord ID so an account can only enter once.
Entrant records live in their own Redis hash per giveaway (`HSET` is atomic, so
simultaneous clicks can't clobber each other). The admin hits **Draw** and the
winner appears on the public page immediately.

## Wager raffle ([`api/_lib/raffles.js`](api/_lib/raffles.js))
Also managed at `/admin`. Every `wagerPerTicket` dollars wagered on BetBolt
inside the raffle window earns one ticket, counted from the same standings API
the leaderboard uses so the numbers always agree. The built-in default raffle
runs until an admin saves their own.

## Provably-fair draws ([`api/_lib/fairdraw.js`](api/_lib/fairdraw.js))
Shared by both. When a giveaway/raffle becomes visible the server generates a
random seed and publishes only its SHA-256 hash, so the outcome is fixed before
entries close and can't be rerolled. Winners are drawn with
`HMAC-SHA256(seed, n)`, weighted by tickets for raffles and uniformly for
giveaways. A per-item cap controls repeat wins: giveaway entrants can win once
(they only hold one entry), while raffle players stay in the pool and may take
up to `MAX_WINS_PER_PLAYER` prizes before dropping out. After the draw the seed
and the exact entrant snapshot are published so anyone can replay it.

## Deploy
Vercel preset: **Vite**. `vercel.json` rewrites non-`/api` routes to
`index.html` for React Router, and `api/*.js` deploy as serverless functions.

Set every variable from `.env.example` in the Vercel dashboard. **Vercel KV /
Upstash Redis is required in production** — the serverless filesystem is
read-only, so without `KV_REST_API_URL` + `KV_REST_API_TOKEN` the admin panel
cannot persist leaderboard periods, and giveaway entries and draw results would
be lost.
