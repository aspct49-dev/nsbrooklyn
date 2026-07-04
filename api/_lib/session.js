// Stateless signed sessions: base64url(JSON payload) + "." + HMAC-SHA256.
// No database needed — the cookie itself carries {id, name, avatar, exp},
// tamper-proofed with SESSION_SECRET.
import crypto from 'node:crypto'
import { parseCookies } from './http.js'

export const SESSION_COOKIE = 'nsb_session'
const WEEK_S = 7 * 24 * 3600

function secret() {
  const s = process.env.SESSION_SECRET
  if (!s) throw Object.assign(new Error('SESSION_SECRET not configured'), { status: 500 })
  return s
}

const b64u = (buf) => Buffer.from(buf).toString('base64url')

function hmac(data) {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url')
}

export function createSession(user) {
  const payload = b64u(
    JSON.stringify({
      id: user.id,
      name: user.username,
      avatar: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
        : null,
      exp: Math.floor(Date.now() / 1000) + WEEK_S,
    }),
  )
  return { token: `${payload}.${hmac(payload)}`, maxAge: WEEK_S }
}

export function readSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE]
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  try {
    const expected = hmac(payload)
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (!data.id || data.exp < Date.now() / 1000) return null
    return data
  } catch {
    return null
  }
}

export function isAdmin(session) {
  if (!session) return false
  const ids = (process.env.ADMIN_DISCORD_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return ids.includes(session.id)
}

export function requireAdmin(req) {
  const session = readSession(req)
  if (!session) throw Object.assign(new Error('Not logged in'), { status: 401 })
  if (!isAdmin(session)) throw Object.assign(new Error('Not an admin'), { status: 403 })
  return session
}
