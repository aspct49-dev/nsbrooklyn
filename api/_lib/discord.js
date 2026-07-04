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
