// Discord OAuth2 helpers (authorization-code flow, `identify` scope only).
// Create the application at https://discord.com/developers/applications and
// add <site>/api/auth/callback as an OAuth2 redirect URI.

function creds() {
  const id = process.env.DISCORD_CLIENT_ID
  const secret = process.env.DISCORD_CLIENT_SECRET
  if (!id || !secret) {
    throw Object.assign(
      new Error('DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET not configured'),
      { status: 500 },
    )
  }
  return { id, secret }
}

export function authorizeUrl(origin, state) {
  const { id } = creds()
  const u = new URL('https://discord.com/oauth2/authorize')
  u.searchParams.set('client_id', id)
  u.searchParams.set('redirect_uri', `${origin}/api/auth/callback`)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('scope', 'identify')
  u.searchParams.set('state', state)
  u.searchParams.set('prompt', 'none')
  return u.toString()
}

export async function exchangeCode(origin, code) {
  const { id, secret } = creds()
  const res = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: id,
      client_secret: secret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${origin}/api/auth/callback`,
    }),
  })
  if (!res.ok) throw Object.assign(new Error(`Discord token exchange failed (${res.status})`), { status: 502 })
  return res.json()
}

export async function fetchDiscordUser(accessToken) {
  const res = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw Object.assign(new Error(`Discord user fetch failed (${res.status})`), { status: 502 })
  return res.json()
}

// ------------------------------------------------------- server roles
// Role checks go through a BOT token, not the user's OAuth token, because
// the Kick chat webhook arrives with no user session attached — there is no
// user token available at that moment. A bot token also reads roles as they
// are *now*, so someone who loses the role can't keep entering on a stale
// grant.
//
// Setup: invite the bot to the server and enable the Server Members Intent
// in the Discord developer portal, or this endpoint returns 403.

export const roleGateConfigured = () =>
  Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID && requiredRoleIds().length)

/** Role IDs that satisfy the gate — any one of them is enough. */
export function requiredRoleIds() {
  return (process.env.DISCORD_REQUIRED_ROLE_IDS || process.env.DISCORD_REQUIRED_ROLE_ID || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// A busy chat can fire many messages a second, and each would otherwise be a
// Discord API call. Cache per instance for a short while — short enough that
// removing someone's role takes effect quickly.
//
// The MEMBER'S ROLES are cached, not a yes/no answer. Different giveaways can
// now require different roles, and a cached boolean would answer the wrong
// question: someone checked against Certified would have that verdict reused
// for a Swoobz-gated giveaway.
const ROLE_TTL_MS = 60_000
const roleCache = new Map() // discordId -> { roles | reason, at }

/**
 * The roles this Discord user holds in the server.
 * Returns { ok: true, roles: string[] } or { ok: false, reason } — never
 * throws for the ordinary "not a member" case, so callers can treat it as a
 * plain refusal.
 */
export async function memberRoles(discordId, { force = false } = {}) {
  const token = process.env.DISCORD_BOT_TOKEN
  const guild = process.env.DISCORD_GUILD_ID
  if (!token || !guild) return { ok: false, reason: 'role-gate-not-configured' }

  const hit = roleCache.get(discordId)
  if (!force && hit && Date.now() - hit.at < ROLE_TTL_MS) {
    return { ...hit.value, cached: true }
  }

  const res = await fetch(
    `https://discord.com/api/v10/guilds/${guild}/members/${discordId}`,
    { headers: { Authorization: `Bot ${token}` } },
  )

  let value
  if (res.status === 404) {
    value = { ok: false, reason: 'not-in-server' }
  } else if (res.status === 403) {
    // almost always the Server Members Intent being switched off
    console.error('Discord role check forbidden — is the Server Members Intent enabled?')
    value = { ok: false, reason: 'bot-forbidden' }
  } else if (!res.ok) {
    console.error('Discord role check failed', res.status)
    value = { ok: false, reason: `discord-${res.status}` }
  } else {
    const member = await res.json()
    value = { ok: true, roles: (Array.isArray(member?.roles) ? member.roles : []).map(String) }
  }

  roleCache.set(discordId, { value, at: Date.now() })
  return value
}

/**
 * Does this Discord user hold one of the roles that satisfy a gate?
 *
 * `roleIds` names the roles for THIS gate — a giveaway may choose its own.
 * Falling back to the env list keeps every caller that predates per-giveaway
 * roles (the Kick picker, older stored giveaways) working unchanged.
 */
export async function hasRequiredRole(discordId, { force = false, roleIds } = {}) {
  const wanted = (roleIds?.length ? roleIds : requiredRoleIds()).map(String)
  if (!wanted.length) return { ok: false, reason: 'role-gate-not-configured' }

  const member = await memberRoles(discordId, { force })
  if (!member.ok) return { ok: false, reason: member.reason, cached: member.cached }

  return member.roles.some((r) => wanted.includes(r))
    ? { ok: true, cached: member.cached }
    : { ok: false, reason: 'missing-role', cached: member.cached }
}
