// Vercel serverless function: GET /api/leaderboard?casino=betbolt&from=ISO&to=ISO
// Proxies the casino APIs so the secret key / password stay server-side.
// Caching/429 backoff lives in _lib/leaderboard.js: fresh cache is served
// without polling upstream, and stale data is served through failures.
// Configure env vars in the Vercel dashboard (see .env.example).
import { getLeaderboard } from './_lib/leaderboard.js'

export default async function handler(req, res) {
  const { casino, from, to } = req.query

  try {
    const data = await getLeaderboard({ casino, from, to, env: process.env })
    // Edge-cache 2 min; serve stale for up to 10 min while revalidating.
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600')
    res.status(200).json(data)
  } catch (err) {
    console.error('api/leaderboard error', err)
    const status = err.status || 500
    // Don't leak upstream details beyond the message we crafted ourselves.
    res.status(status).json({ error: err.message })
  }
}
