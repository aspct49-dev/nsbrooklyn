// GET  /api/kick/link          — link status for the logged-in Discord user
// GET  /api/kick/link?start=1  — begin the Kick OAuth flow (302 to Kick)
// POST /api/kick/link          — { action: 'unlink' }
import crypto from 'node:crypto'
import { sendJson, redirect, getQuery, getOrigin, setCookie, readBody } from '../_lib/http.js'
import { readSession } from '../_lib/session.js'
import { authorizeUrl, makePkce } from '../_lib/kick.js'
import { linkForDiscord, removeLink } from '../_lib/links.js'
import { hasRequiredRole, roleGateConfigured } from '../_lib/discord.js'

export const OAUTH_COOKIE = 'nsb_kick_oauth'

export default async function handler(req, res) {
  try {
    const session = readSession(req)
    if (!session) {
      throw Object.assign(new Error('Log in with Discord first'), { status: 401 })
    }

    if (req.method === 'GET') {
      // start the flow
      if (getQuery(req).start) {
        const state = crypto.randomBytes(16).toString('hex')
        const { verifier, challenge } = makePkce()
        // state + verifier travel in one short-lived cookie; the callback
        // needs both and neither is a secret worth persisting server-side
        setCookie(res, OAUTH_COOKIE, `${state}.${verifier}`, { maxAge: 600 })
        return redirect(res, authorizeUrl(getOrigin(req), { state, challenge }))
      }

      const link = await linkForDiscord(session.id)
      const role = roleGateConfigured() ? await hasRequiredRole(session.id) : null

      res.setHeader('Cache-Control', 'private, no-store')
      return sendJson(res, 200, {
        linked: Boolean(link),
        kickName: link?.kickName ?? null,
        linkedAt: link?.at ?? null,
        roleGate: roleGateConfigured(),
        hasRole: role ? role.ok : null,
        roleReason: role && !role.ok ? role.reason : null,
      })
    }

    if (req.method === 'POST') {
      const body = await readBody(req)
      if (body?.action !== 'unlink') {
        throw Object.assign(new Error(`Unknown action "${body?.action}"`), { status: 400 })
      }
      const removed = await removeLink(session.id)
      return sendJson(res, 200, { linked: false, unlinked: removed?.kickName ?? null })
    }

    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    console.error('api/kick/link error', err)
    sendJson(res, err.status || 500, { error: err.message })
  }
}
