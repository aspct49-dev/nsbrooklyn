# NSBROOKLYN — BetBolt & CaseBattle Leaderboards

A React + Vite affiliate site for code **NSBROOKLYN**: a home page (hero, bonus
cards, leaderboard promo) and a tabbed **leaderboard** page covering both
partner casinos — BetBolt and CaseBattle — with prize pools ($2,500 BetBolt + $500 CaseBattle).

Design ported from the [tegens](https://github.com/aspct49-dev/tegens) site
(sidebar shell, podium, bonus cards, topo texture) recolored to the NSBROOKLYN
maroon/red + gold colorway.

## Tech
- **React 18 + Vite** SPA, **React Router** (`/` home, `/leaderboard`,
  `/winners`, plus legal pages).
- Standings are **static placeholder data** for now — no API wired. Swap the
  player lists for live data later; the ranking/masking pipeline stays the same.

## Getting started
```bash
npm install
npm run dev       # http://localhost:5173
```
- `npm run build` → production build in `dist/`
- `npm run preview` → preview the build locally

## Editing content
Almost everything is in [`src/data/leaderboard.js`](src/data/leaderboard.js):
- `config.leaderboard.{startAt,endAt}` — the period + countdown target.
- `config.referralCode`, `config.socials`, `config.promo`.
- `casinos[]` — per-casino name, affiliate URL, logo, prize ladder, and the
  placeholder `players` list (names are masked on render).
- `bonuses` — the three home-page bonus cards.
- `pastWinners` — archived periods for the `/winners` page.

Colors live in the `:root` block of [`src/index.css`](src/index.css).

## Deploy
Static SPA — any host works (Vercel preset: **Vite**). `vercel.json` already
rewrites all routes to `index.html` for React Router.

## TODO before going live
- Replace the affiliate links in `src/data/leaderboard.js` (marked `← replace`).
- Replace the social URLs (Discord/Instagram/Kick) with real ones.
- Set a real support email in `config.contactEmail`.
