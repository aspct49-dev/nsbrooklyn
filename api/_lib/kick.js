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

/**
 * @param scopes only the broadcaster needs `events:subscribe` — viewers are
 * asked for `user:read` alone, so they aren't prompted to grant something
 * that has nothing to do with linking their account.
 */
export function authorizeUrl(origin, { state, challenge, scopes = 'user:read' }) {
  const { id } = creds()
  const u = new URL(AUTHORIZE_URL)
  u.searchParams.set('client_id', id)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('redirect_uri', redirectUri(origin))
  u.searchParams.set('scope', scopes)
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

// ------------------------------------------------ event subscriptions
//
// Setting a webhook URL on the Kick app is not enough on its own: Kick only
// delivers events you have explicitly subscribed to, and the subscription is
// created through the API rather than the dashboard. Chat belongs to the
// broadcaster, so it has to be created with THEIR user token — an app token
// is anonymous and has no channel to subscribe to.

const SUBSCRIPTIONS = `${API}/events/subscriptions`
export const CHAT_EVENT = 'chat.message.sent'

/** App-level token (client_credentials) — enough to read subscriptions. */
async function appToken() {
  const { id, secret } = creds()
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: id,
      client_secret: secret,
    }),
  })
  if (!res.ok) throw Object.assign(new Error(`Kick app token failed (${res.status})`), { status: 502 })
  return (await res.json()).access_token
}

export async function listSubscriptions(token) {
  const res = await fetch(SUBSCRIPTIONS, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw Object.assign(new Error(`Kick subscriptions read failed (${res.status})`), { status: 502 })
  const body = await res.json()
  return Array.isArray(body?.data) ? body.data : []
}

/** Resolve a channel slug to its broadcaster user id. */
export async function resolveChannelId(slug, token) {
  const t = token || (await appToken())
  const res = await fetch(`${API}/channels?slug=${encodeURIComponent(slug)}`, {
    headers: { Authorization: `Bearer ${t}` },
  })
  if (!res.ok) throw Object.assign(new Error(`Kick channel lookup failed (${res.status})`), { status: 502 })
  const body = await res.json()
  const ch = Array.isArray(body?.data) ? body.data[0] : null
  if (!ch?.broadcaster_user_id) throw Object.assign(new Error(`No Kick channel "${slug}"`), { status: 404 })
  return String(ch.broadcaster_user_id)
}

export async function deleteSubscription(id, token) {
  const t = token || (await appToken())
  const res = await fetch(`${SUBSCRIPTIONS}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${t}` },
  })
  return { ok: res.ok || res.status === 204, status: res.status }
}

/**
 * Is chat delivery on FOR OUR CHANNEL?
 *
 * Checking only that some chat subscription exists is not enough: a
 * subscription belongs to whichever account authorised, so linking a personal
 * account happily produces a healthy-looking subscription that delivers a
 * completely different channel's chat. The broadcaster id is compared against
 * the configured slug so that shows up as wrong rather than green.
 */
export async function chatSubscriptionStatus() {
  const slug = process.env.KICK_CHANNEL_SLUG
  try {
    const token = await appToken()
    const subs = await listSubscriptions(token)
    const chat = subs.filter((s) => s.event === CHAT_EVENT)

    if (!chat.length) return { ok: false, reason: 'none', count: 0 }
    if (!slug) return { ok: true, count: chat.length, warn: 'KICK_CHANNEL_SLUG not set — cannot confirm the channel' }

    const wanted = await resolveChannelId(slug, token)
    const mine = chat.filter((s) => String(s.broadcaster_user_id) === wanted)
    if (mine.length) return { ok: true, count: mine.length, channel: slug, broadcasterId: wanted }

    return {
      ok: false,
      reason: 'wrong-channel',
      count: chat.length,
      channel: slug,
      broadcasterId: wanted,
      subscribedTo: chat.map((s) => String(s.broadcaster_user_id)),
      stale: chat.map((s) => s.id),
    }
  } catch (err) {
    return { ok: false, reason: 'error', error: err.message }
  }
}

/** Subscribe this channel's chat to our webhook. Needs the broadcaster's own token. */
export async function subscribeToChat(userToken, broadcasterUserId) {
  const res = await fetch(SUBSCRIPTIONS, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: [{ name: CHAT_EVENT, version: 1 }],
      method: 'webhook',
      broadcaster_user_id: Number(broadcasterUserId),
    }),
  })
  // 204 on success; 409-ish responses mean it already exists, which is fine
  if (res.status === 204 || res.ok) return { ok: true }
  const text = await res.text()
  return { ok: false, status: res.status, error: text.slice(0, 200) }
}

// --------------------------------------------------------- chat room id
//
// The picker reads chat straight from Kick's public socket, which is keyed by
// CHATROOM id — a different number from the broadcaster id, and one the
// official API does not expose. It comes from the public v2 endpoint, which
// sits behind Cloudflare and often refuses datacenter IPs, so the value can be
// pinned with KICK_CHATROOM_ID instead. It never changes for a channel.

let cachedRoom = null

export async function resolveChatroomId(slug) {
  if (process.env.KICK_CHATROOM_ID) return String(process.env.KICK_CHATROOM_ID)
  if (cachedRoom) return cachedRoom

  const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    throw Object.assign(
      new Error(`Could not look up the chatroom for "${slug}" (HTTP ${res.status}). Set KICK_CHATROOM_ID to pin it.`),
      { status: 502 },
    )
  }
  const body = await res.json()
  const id = body?.chatroom?.id
  if (!id) throw Object.assign(new Error(`No chatroom on channel "${slug}"`), { status: 404 })
  cachedRoom = String(id)
  return cachedRoom
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
