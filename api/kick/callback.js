// GET /api/kick/callback — Kick redirects here after the user approves.
// Exchanges the code, then pairs their Kick account with the Discord account
// already in session. Errors come back as a query string so the page can show
// them, rather than dumping raw JSON at someone mid-flow.
import { redirect, getOrigin, getQuery, parseCookies, setCookie, sendJson } from '../_lib/http.js'
import { readSession, isAdmin } from '../_lib/session.js'
import { exchangeCode, fetchKickUser, subscribeToChat, resolveChannelId } from '../_lib/kick.js'
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
    const [expectedState, verifier, mode] = cookie.split('.')
    setCookie(res, OAUTH_COOKIE, '', { maxAge: 0 })

    if (!code || !state || !expectedState || state !== expectedState || !verifier) {
      return back(res, { kick: 'error', reason: 'Link request expired — please try again' })
    }

    const token = await exchangeCode(getOrigin(req), code, verifier)
    const kick = await fetchKickUser(token.access_token)

    // Broadcaster flow: switch on chat delivery for OUR channel. No personal
    // link is created — this is about the channel, not about who is entering.
    if (mode === 'b' && isAdmin(session)) {
      const slug = process.env.KICK_CHANNEL_SLUG
      if (slug) {
        let wanted
        try {
          wanted = await resolveChannelId(slug)
        } catch (err) {
          return back(res, { kick: 'error', reason: `Could not look up channel "${slug}": ${err.message}` })
        }
        // Authorising with the wrong account is the failure that looks like
        // success, so it is refused outright rather than silently subscribing
        // someone else's chat.
        if (String(kick.id) !== String(wanted)) {
          return back(res, {
            kick: 'error',
            reason: `You authorised as "${kick.name}", but chat delivery has to be granted by the ${slug} account itself. Log out of Kick, sign in as ${slug}, and try again.`,
          })
        }
      }
      const sub = await subscribeToChat(token.access_token, kick.id)
      if (!sub.ok) {
        console.error('kick chat subscription failed', sub)
        return back(res, { kick: 'error', reason: `Could not switch on chat delivery (${sub.status || 'error'}).` })
      }
      return back(res, { kick: 'chat-on', name: kick.name })
    }

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
