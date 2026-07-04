// GET /api/leaderboard?casino=betbolt&from=ISO&to=ISO
// Proxies the casino APIs so the secret key / password stay server-side.
// Caching/429 backoff lives in _lib/leaderboard.js: fresh cache is served
// without polling upstream, and stale data is served through failures.
// Configure env vars in the Vercel dashboard (see .env.example).
import { getQuery, sendJson } from './_lib/http.js'
import { getLeaderboard } from './_lib/leaderboard.js'

export default async function handler(req, res) {
  const { casino, from, to } = getQuery(req)

  try {
    const data = await getLeaderboard({ casino, from, to, env: process.env })
    // Edge-cache 2 min; serve stale for up to 10 min while revalidating.
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600')
    sendJson(res, 200, data)
  } catch (err) {
    console.error('api/leaderboard error', err)
    // Don't leak upstream details beyond the message we crafted ourselves.
    sendJson(res, err.status || 500, { error: err.message })
  }
}
