// Vercel serverless function: GET /api/leaderboard?casino=betbolt&from=ISO&to=ISO
// Proxies the casino APIs so the secret key / password stay server-side.
// Configure env vars in the Vercel dashboard (see .env.example).
import { getLeaderboard } from './_lib/leaderboard.js'

export default async function handler(req, res) {
  const { casino, from, to } = req.query

  try {
    const data = await getLeaderboard({ casino, from, to, env: process.env })
    // Edge-cache for 60s; serve stale for up to 5 min while revalidating.
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.status(200).json(data)
  } catch (err) {
    const status = err.status || 500
    // Don't leak upstream details beyond the message we crafted ourselves.
    res.status(status).json({ error: err.message })
  }
}
