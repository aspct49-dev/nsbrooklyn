import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Serves /api/leaderboard during `npm run dev` using the same handler logic
// as the Vercel function, with secrets loaded from .env.local (gitignored).
// In production, Vercel serves api/leaderboard.js instead.
function devApi(env) {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/leaderboard', async (req, res) => {
        const { getLeaderboard } = await import('./api/_lib/leaderboard.js')
        const url = new URL(req.url, 'http://localhost')
        try {
          const data = await getLeaderboard({
            casino: url.searchParams.get('casino'),
            from: url.searchParams.get('from'),
            to: url.searchParams.get('to'),
            env,
          })
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        } catch (err) {
          res.statusCode = err.status || 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') // '' = include non-VITE_ vars (server-side only)
  return {
    plugins: [react(), devApi(env)],
    server: {
      port: 5173,
      open: true,
    },
  }
})
