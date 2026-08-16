// GET /api/kick/callback — Kick redirects here after the user approves.
// Exchanges the code, then pairs their Kick account with the Discord account
// already in session. Errors come back as a query string so the page can show
// them, rather than dumping raw JSON at someone mid-flow.
import { redirect, getOrigin, getQuery, parseCookies, setCookie, sendJson } from '../_lib/http.js'
import { readSession } from '../_lib/session.js'
import { exchangeCode, fetchKickUser } from '../_lib/kick.js'
import { createLink } from '../_lib/links.js'
import { OAUTH_COOKIE } from './index.js'

const back = (res, params) =>
  redirect(res, `/giveaways?${new URLSearchParams(params)}`)

export default async function handler(req, res) {
  try {
    const session = readSession(req)
    if (!session) return back(res, { kick: 'error', reason: 'Log in with Discord first' })

    const { code, state, error } = getQuery(req)
    if (error) return back(res, { kick: 'error', reason: 'Kick authorization was cancelled' })

    const cookie = parseCookies(req)[OAUTH_COOKIE] || ''
    const [expectedState, verifier] = cookie.split('.')
    setCookie(res, OAUTH_COOKIE, '', { maxAge: 0 })

    if (!code || !state || !expectedState || state !== expectedState || !verifier) {
      return back(res, { kick: 'error', reason: 'Link request expired — please try again' })
    }

    const token = await exchangeCode(getOrigin(req), code, verifier)
    const kick = await fetchKickUser(token.access_token)

    await createLink({
      discordId: session.id,
      discordName: session.name,
      kickId: kick.id,
      kickName: kick.name,
    })

    return back(res, { kick: 'linked', name: kick.name })
  } catch (err) {
    console.error('api/kick/callback error', err)
    // 409 is the "already linked to someone else" case — worth showing
    if (err.status === 409) return back(res, { kick: 'error', reason: err.message })
    return sendJson(res, err.status || 500, { error: err.message })
  }
}
