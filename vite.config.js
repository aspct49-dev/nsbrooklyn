import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-only /api router: mounts the SAME handler modules Vercel runs in
// production (they're written as plain Node handlers). Secrets come from
// .env.local (gitignored) and are injected into process.env for parity.
const API_ROUTES = {
  '/api/leaderboard': './api/leaderboard.js',
  '/api/settings': './api/settings.js',
  '/api/auth/login': './api/auth/login.js',
  '/api/auth/callback': './api/auth/callback.js',
  '/api/auth/me': './api/auth/me.js',
  '/api/auth/logout': './api/auth/logout.js',
}

function devApi(env) {
  return {
    name: 'dev-api',
    configureServer(server) {
      // make .env.local vars visible to handlers via process.env (dev only)
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v
      }
      process.env.VITE_DEV = '1' // so cookies skip the Secure flag on http

      for (const [route, file] of Object.entries(API_ROUTES)) {
        server.middlewares.use(route, async (req, res) => {
          try {
            const mod = await import(file)
            await mod.default(req, res)
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      }
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
