// GET /api/auth/me — current session (or {user: null}).
import { sendJson } from '../_lib/http.js'
import { readSession, isAdmin } from '../_lib/session.js'

export default async function handler(req, res) {
  try {
    const session = readSession(req)
    res.setHeader('Cache-Control', 'no-store')
    if (!session) return sendJson(res, 200, { user: null, isAdmin: false })
    sendJson(res, 200, {
      user: { id: session.id, name: session.name, avatar: session.avatar },
      isAdmin: isAdmin(session),
    })
  } catch (err) {
    sendJson(res, err.status || 500, { error: err.message })
  }
}
