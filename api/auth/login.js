// GET /api/auth/login — redirect to Discord's consent screen.
import crypto from 'node:crypto'
import { redirect, setCookie, getOrigin, sendJson } from '../_lib/http.js'
import { authorizeUrl } from '../_lib/discord.js'

export default async function handler(req, res) {
  try {
    const state = crypto.randomBytes(16).toString('base64url')
    setCookie(res, 'nsb_oauth_state', state, { maxAge: 300 })
    redirect(res, authorizeUrl(getOrigin(req), state))
  } catch (err) {
    sendJson(res, err.status || 500, { error: err.message })
  }
}
