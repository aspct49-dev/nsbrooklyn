// Shared server-side leaderboard fetchers WITH caching.
// Used by the Vercel function (api/leaderboard.js), the giveaway ticket
// counts (api/giveaways.js) and the Vite dev middleware (vite.config.js).
// Secrets come from environment variables — they must NEVER be imported by
// client code in src/.
//
// Caching model (protects against the upstream affiliate API's rate limits):
//   - fresh cache (< TTL)          → served directly, upstream never called
//   - stale cache + upstream OK    → cache refreshed, new data served
//   - stale cache + upstream fails → stale data served (marked `stale`)
//   - after a 429, a cooldown stops upstream retries for a while;
//     stale data keeps being served during the cooldown
//   - concurrent requests for the same key share one upstream call

const CACHE_TTL_MS = 2 * 60_000        // serve cached data without re-polling
const RATE_LIMIT_COOLDOWN_MS = 10 * 60_000 // after a 429, back off this long
const ERROR_COOLDOWN_MS = 60_000       // after other upstream errors

const cache = new Map()    // key -> { data, fetchedAt }
const cooldownUntil = new Map() // key -> timestamp
const inflight = new Map() // key -> Promise

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/

export function assertIso(value, name) {
  if (!ISO_RE.test(value || '')) {
    const err = new Error(`Invalid or missing "${name}" (expect ISO UTC datetime)`)
    err.status = 400
    throw err
  }
}

function upstreamError(name, res) {
  // preserve 429 so callers can back off; everything else is a 502
  const status = res.status === 429 ? 429 : 502
  return Object.assign(new Error(`${name} API ${res.status}`), { status })
}

/**
 * Roobet affiliate standings.
 *
 * GET https://roobetconnect.com/affiliate/v2/stats
 *   ?userId=<affiliate uid>&startDate=<ISO>&endDate=<ISO>
 *   Authorization: Bearer <affiliateStats token>
 *
 * Returns a bare JSON array (one row per referred player who wagered in the
 * window), newest token docs call the fields `username`, `wagered` and
 * `weightedWagered`. Unlike BetBolt there is no limit/sort parameter — the
 * whole referred list comes back and we rank it ourselves.
 */
async function fetchRoobet({ from, to, env }) {
  const token = env.ROOBET_API_TOKEN
  const userId = env.ROOBET_USER_ID
  if (!token) throw Object.assign(new Error('ROOBET_API_TOKEN not configured'), { status: 500 })
  if (!userId) throw Object.assign(new Error('ROOBET_USER_ID not configured'), { status: 500 })

  const url = new URL('https://roobetconnect.com/affiliate/v2/stats')
  url.searchParams.set('userId', userId)
  url.searchParams.set('startDate', from)
  url.searchParams.set('endDate', to)

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw upstreamError('Roobet', res)
  const body = await res.json()
  const rows = Array.isArray(body) ? body : body?.data || []

  const players = rows
    .map((u) => ({
      name: u.username ?? u.name ?? '',
      // Roobet weights wager by game (table games and low-house-edge slots
      // count for less), and the board pays on the weighted figure — that is
      // the number players are told counts. `wagered` is only a fallback in
      // case a response ever omits the weighted one.
      wagered: Number(u.weightedWagered ?? u.wagered) || 0,
    }))
    .filter((p) => p.name)

  // Rows came back but none of them mapped — that means the field names moved,
  // not that nobody wagered. Without this the board just renders empty and
  // looks like a quiet week.
  if (rows.length && !players.length) {
    console.error('Roobet: %d rows but no usable names; sample keys: %j',
      rows.length, Object.keys(rows[0] || {}))
  }

  return players
}

// Legacy — kept ONLY so a finished BetBolt period can still be fetched and
// published to /winners from /admin. Nothing on the public site points at
// BetBolt any more; remove this (and BETBOLT_API_KEY) once the final BetBolt
// board has been archived.
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
  if (!res.ok) throw upstreamError('BetBolt', res)
  const body = await res.json()

  return (body.data || []).map((u) => ({
    name: u.username,
    wagered: Number(u.wagered) || 0,
  }))
}

const FETCHERS = { roobet: fetchRoobet, betbolt: fetchBetbolt }

async function fetchFresh({ casino, from, to, env, key }) {
  try {
    const players = await FETCHERS[casino]({ from, to, env })
    players.sort((a, b) => b.wagered - a.wagered)
    const data = { players, updatedAt: new Date().toISOString() }
    cache.set(key, { data, fetchedAt: Date.now() })
    cooldownUntil.delete(key)
    return data
  } catch (err) {
    cooldownUntil.set(
      key,
      Date.now() + (err.status === 429 ? RATE_LIMIT_COOLDOWN_MS : ERROR_COOLDOWN_MS),
    )
    const stale = cache.get(key)
    if (stale) return { ...stale.data, stale: true }
    throw err
  } finally {
    inflight.delete(key)
  }
}

/**
 * Cached fetch + normalize of one casino's standings.
 * @returns {{ players: {name, wagered}[], updatedAt: string, stale?: boolean, cached?: boolean }}
 */
export async function getLeaderboard({ casino, from, to, env }) {
  if (!FETCHERS[casino]) throw Object.assign(new Error(`Unknown casino "${casino}"`), { status: 400 })
  assertIso(from, 'from')
  assertIso(to, 'to')

  const key = `${casino}:${from}:${to}`
  const hit = cache.get(key)
  const now = Date.now()

  // fresh enough — don't touch the upstream API at all
  if (hit && now - hit.fetchedAt < CACHE_TTL_MS) {
    return { ...hit.data, cached: true }
  }

  // recently rate-limited/errored — don't retry upstream yet:
  // serve stale if we have it, otherwise fail fast without a call
  if ((cooldownUntil.get(key) || 0) > now) {
    if (hit) return { ...hit.data, stale: true }
    throw Object.assign(new Error('Upstream rate-limited — retrying later'), { status: 429 })
  }

  // coalesce concurrent requests into a single upstream call
  if (inflight.has(key)) return inflight.get(key)
  const p = fetchFresh({ casino, from, to, env, key })
  inflight.set(key, p)
  return p
}
