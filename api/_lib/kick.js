// Kick OAuth 2.1 (PKCE is mandatory) + webhook signature verification.
//
// Create the app at https://kick.com/settings/developer and add
// <site>/api/kick/callback as a redirect URI. Scopes we use:
//   user:read        — the linking flow, to learn who authorized
//   events:subscribe — required on the app for chat webhooks to be delivered
//
// Docs: https://github.com/KickEngineering/KickDevDocs
import crypto from 'node:crypto'

const AUTHORIZE_URL = 'https://id.kick.com/oauth/authorize'
const TOKEN_URL = 'https://id.kick.com/oauth/token'
const API = 'https://api.kick.com/public/v1'

function creds() {
  const id = process.env.KICK_CLIENT_ID
  const secret = process.env.KICK_CLIENT_SECRET
  if (!id || !secret) {
    throw Object.assign(
      new Error('KICK_CLIENT_ID / KICK_CLIENT_SECRET not configured'),
      { status: 500 },
    )
  }
  return { id, secret }
}

export const redirectUri = (origin) => `${origin}/api/kick/callback`

// --------------------------------------------------------------- PKCE

const b64u = (buf) => Buffer.from(buf).toString('base64url')

/** A fresh PKCE pair. The verifier is kept client-side in a cookie until callback. */
export function makePkce() {
  const verifier = b64u(crypto.randomBytes(48)) // 64 chars, inside the 43–128 limit
  const challenge = b64u(crypto.createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

export function authorizeUrl(origin, { state, challenge }) {
  const { id } = creds()
  const u = new URL(AUTHORIZE_URL)
  u.searchParams.set('client_id', id)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('redirect_uri', redirectUri(origin))
  u.searchParams.set('scope', 'user:read')
  u.searchParams.set('state', state)
  u.searchParams.set('code_challenge', challenge)
  u.searchParams.set('code_challenge_method', 'S256')
  return u.toString()
}

export async function exchangeCode(origin, code, verifier) {
  const { id, secret } = creds()
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: id,
      client_secret: secret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(origin),
      code_verifier: verifier,
    }),
  })
  if (!res.ok) {
    throw Object.assign(new Error(`Kick token exchange failed (${res.status})`), { status: 502 })
  }
  return res.json()
}

/** The authorizing user: { user_id, name, ... } from GET /users. */
export async function fetchKickUser(accessToken) {
  const res = await fetch(`${API}/users`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw Object.assign(new Error(`Kick user fetch failed (${res.status})`), { status: 502 })
  const body = await res.json()
  // the endpoint returns the token's own user as a single-element list
  const me = Array.isArray(body?.data) ? body.data[0] : body?.data
  if (!me?.user_id) throw Object.assign(new Error('Kick returned no user'), { status: 502 })
  return { id: String(me.user_id), name: me.name || me.username || `kick-${me.user_id}` }
}

// ------------------------------------------------- webhook verification

// Kick's signing key. Fetched once per instance and cached; the value is
// public, so caching it is safe.
let cachedKey = null
async function publicKey() {
  if (cachedKey) return cachedKey
  if (process.env.KICK_PUBLIC_KEY) {
    cachedKey = process.env.KICK_PUBLIC_KEY.replace(/\\n/g, '\n')
    return cachedKey
  }
  const res = await fetch(`${API}/public-key`)
  if (!res.ok) throw Object.assign(new Error(`Kick public key fetch failed (${res.status})`), { status: 502 })
  const body = await res.json()
  const key = body?.data?.public_key || body?.public_key
  if (!key) throw Object.assign(new Error('Kick returned no public key'), { status: 502 })
  cachedKey = key
  return cachedKey
}

const TIMESTAMP_TOLERANCE_MS = 5 * 60_000

/**
 * Verify a Kick webhook. Without this anyone who learns the URL could POST
 * fake chat messages and stuff a giveaway, so a failure here must reject the
 * request rather than fall through.
 *
 * Kick signs `messageId.timestamp.rawBody` with RSA-SHA256 (PKCS#1 v1.5).
 * The timestamp window is what stops an intercepted webhook being replayed.
 */
export async function verifyWebhook({ headers, rawBody }) {
  const messageId = headers['kick-event-message-id']
  const timestamp = headers['kick-event-message-timestamp']
  const signature = headers['kick-event-signature']

  if (!messageId || !timestamp || !signature) {
    throw Object.assign(new Error('Missing Kick signature headers'), { status: 401 })
  }

  const age = Date.now() - new Date(timestamp).getTime()
  if (!Number.isFinite(age) || Math.abs(age) > TIMESTAMP_TOLERANCE_MS) {
    throw Object.assign(new Error('Webhook timestamp outside tolerance'), { status: 401 })
  }

  const signed = Buffer.concat([
    Buffer.from(`${messageId}.${timestamp}.`, 'utf8'),
    rawBody,
  ])

  let valid = false
  try {
    valid = crypto.verify(
      'sha256',
      signed,
      { key: await publicKey(), padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(signature, 'base64'),
    )
  } catch {
    valid = false
  }
  if (!valid) throw Object.assign(new Error('Invalid Kick webhook signature'), { status: 401 })

  return { messageId, timestamp }
}
