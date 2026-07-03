// Shared server-side leaderboard fetchers.
// Used by the Vercel function (api/leaderboard.js) and the Vite dev
// middleware (vite.config.js). Secrets come from environment variables —
// they must NEVER be imported by client code in src/.

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/

export function assertIso(value, name) {
  if (!ISO_RE.test(value || '')) {
    const err = new Error(`Invalid or missing "${name}" (expect ISO UTC datetime)`)
    err.status = 400
    throw err
  }
}

async function fetchBetbolt({ from, to, env }) {
  const key = env.BETBOLT_API_KEY
  if (!key) throw Object.assign(new Error('BETBOLT_API_KEY not configured'), { status: 500 })

  const url = new URL('https://openapi.betbolt.com/v1/referral/leaderboard')
  url.searchParams.set('start_date', from)
  url.searchParams.set('end_date', to)
  url.searchParams.set('limit', '50')
  url.searchParams.set('sort_by', 'wager')
  url.searchParams.set('sort_order', 'desc')

  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } })
  if (!res.ok) throw Object.assign(new Error(`BetBolt API ${res.status}`), { status: 502 })
  const body = await res.json()

  return (body.data || []).map((u) => ({
    name: u.username,
    wagered: Number(u.wagered) || 0,
  }))
}

async function fetchCasebattle({ from, to, env }) {
  const dealId = env.CASEBATTLE_DEAL_ID
  const password = env.CASEBATTLE_PASSWORD
  if (!dealId || !password) {
    throw Object.assign(new Error('CASEBATTLE_DEAL_ID / CASEBATTLE_PASSWORD not configured'), { status: 500 })
  }

  const url = new URL(`https://api.casebattle.com/deals/${dealId}/leaderboard`)
  url.searchParams.set('password', password)
  url.searchParams.set('from', from)
  url.searchParams.set('to', to)
  url.searchParams.set('limit', '50')

  const res = await fetch(url)
  if (!res.ok) throw Object.assign(new Error(`CaseBattle API ${res.status}`), { status: 502 })
  const body = await res.json()

  return (Array.isArray(body) ? body : []).map((row) => ({
    name: row.user?.username ?? 'anonymous',
    wagered: Number(row.amount) || 0,
  }))
}

const FETCHERS = { betbolt: fetchBetbolt, casebattle: fetchCasebattle }

/**
 * Fetch + normalize one casino's standings.
 * @returns {{ players: {name: string, wagered: number}[], updatedAt: string }}
 */
export async function getLeaderboard({ casino, from, to, env }) {
  const fetcher = FETCHERS[casino]
  if (!fetcher) throw Object.assign(new Error(`Unknown casino "${casino}"`), { status: 400 })
  assertIso(from, 'from')
  assertIso(to, 'to')

  const players = await fetcher({ from, to, env })
  players.sort((a, b) => b.wagered - a.wagered)
  return { players, updatedAt: new Date().toISOString() }
}
