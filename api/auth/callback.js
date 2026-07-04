// GET /api/auth/callback — Discord redirects here; exchange the code,
// mint our signed session cookie, and bounce back to the site.
import { redirect, setCookie, getOrigin, getQuery, parseCookies, sendJson } from '../_lib/http.js'
import { exchangeCode, fetchDiscordUser } from '../_lib/discord.js'
import { createSession, SESSION_COOKIE } from '../_lib/session.js'

export default async function handler(req, res) {
  try {
    const { code, state } = getQuery(req)
    const expected = parseCookies(req).nsb_oauth_state
    if (!code || !state || !expected || state !== expected) {
      throw Object.assign(new Error('OAuth state mismatch — try logging in again'), { status: 400 })
    }
    setCookie(res, 'nsb_oauth_state', '', { maxAge: 0 })

    const origin = getOrigin(req)
    const token = await exchangeCode(origin, code)
    const user = await fetchDiscordUser(token.access_token)

    const { token: session, maxAge } = createSession(user)
    setCookie(res, SESSION_COOKIE, session, { maxAge })
    redirect(res, '/')
  } catch (err) {
    console.error('auth/callback error', err)
    sendJson(res, err.status || 500, { error: err.message })
  }
}
