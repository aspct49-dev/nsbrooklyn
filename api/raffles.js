// GET  /api/raffles — public: the current raffle (with live ticket
//                       standings) plus past raffles and their winners.
//                       Admins additionally get `all` (drafts included).
// POST /api/raffles — admin-only: { action: 'save' | 'status' | 'draw' | 'delete' }
//
// Entries are derived from the BetBolt standings for the raffle's own
// window, so the ticket counts always match what the casino reports.
import { sendJson, readBody } from './_lib/http.js'
import { readSession, isAdmin as sessionIsAdmin, requireAdmin } from './_lib/session.js'
import { getLeaderboard } from './_lib/leaderboard.js'
import {
  listRaffles, saveRaffles, normalizeRaffle, publicRaffle,
  toEntries, countTickets, drawWinners, ensureSeed, STATUSES,
} from './_lib/raffles.js'

const notFound = (id) => Object.assign(new Error(`Unknown raffle "${id}"`), { status: 404 })

/** Live entries for a raffle window — or the frozen snapshot once drawn. */
async function loadEntries(raffle) {
  if (raffle.entriesSnapshot) {
    return { entries: raffle.entriesSnapshot, updatedAt: raffle.drawnAt }
  }
  const { players, updatedAt } = await getLeaderboard({
    casino: raffle.casino,
    from: raffle.startAt,
    to: raffle.endAt,
    env: process.env,
  })
  return { entries: toEntries(players, raffle.wagerPerTicket), updatedAt }
}

/**
 * The raffle to show on /raffles: the one that's currently running,
 * else the next one starting, else the most recently finished.
 */
function pickCurrent(raffles) {
  const visible = raffles.filter((g) => g.status !== 'draft')
  if (!visible.length) return null
  const now = Date.now()
  const running = visible.filter((g) => now >= +new Date(g.startAt) && now < +new Date(g.endAt))
  if (running.length) return running.sort((a, b) => +new Date(a.endAt) - +new Date(b.endAt))[0]
  const upcoming = visible.filter((g) => now < +new Date(g.startAt))
  if (upcoming.length) return upcoming.sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))[0]
  return visible.sort((a, b) => +new Date(b.endAt) - +new Date(a.endAt))[0]
}

/**
 * Make sure a visible raffle has committed to a seed, persisting it on
 * first sight. This is what lets the built-in default raffle be provably
 * fair without shipping its seed in the repo. If storage isn't writable the
 * commitment is simply skipped — a hash we can't persist is worthless, since
 * the next request would publish a different one.
 */
async function commitSeed(raffles, current) {
  if (!current || current.status === 'draft' || current.seed) return { raffles, current }
  const seeded = ensureSeed(current)
  const next = raffles.map((g) => (g.id === seeded.id ? seeded : g))
  try {
    await saveRaffles(next)
    return { raffles: next, current: seeded }
  } catch (err) {
    console.warn('raffle seed commitment not persisted:', err.message)
    return { raffles, current }
  }
}

async function handleGet(req, res) {
  const stored = await listRaffles()
  const admin = sessionIsAdmin(readSession(req))

  const { raffles, current } = await commitSeed(stored, pickCurrent(stored))
  let payload = { current: null, past: [], totalTickets: 0, entries: [] }

  if (current) {
    // A failed upstream call must not take the whole page down — the
    // raffle details still render, just without live ticket counts.
    let entries = []
    let entriesError = null
    let updatedAt = null
    try {
      const loaded = await loadEntries(current)
      entries = loaded.entries
      updatedAt = loaded.updatedAt ?? null
    } catch (err) {
      entriesError = err.message
    }

    payload = {
      current: publicRaffle(current),
      entries,
      totalTickets: countTickets(entries),
      entriesError,
      updatedAt,
      past: [],
    }
  }

  payload.past = raffles
    .filter((g) => g.id !== current?.id && g.winners?.length)
    .sort((a, b) => +new Date(b.endAt) - +new Date(a.endAt))
    .map(publicRaffle)

  if (admin) payload.all = raffles.map(publicRaffle)

  // Short edge cache: ticket counts move slowly and the upstream is rate-limited.
  res.setHeader('Cache-Control', admin ? 'private, no-store' : 's-maxage=60, stale-while-revalidate=300')
  return sendJson(res, 200, payload)
}

async function handlePost(req, res) {
  const session = requireAdmin(req)
  const body = await readBody(req)
  const action = body?.action || 'save'
  const raffles = await listRaffles()

  if (action === 'save') {
    const existing = raffles.find((g) => g.id === body?.raffle?.id) || null
    let next = normalizeRaffle(body?.raffle, existing)
    // committing the seed as it goes live is what makes the draw verifiable
    if (next.status === 'live') next = ensureSeed(next)

    const list = existing
      ? raffles.map((g) => (g.id === existing.id ? next : g))
      : [next, ...raffles]
    await saveRaffles(list, session.name)
    return sendJson(res, 200, { raffle: publicRaffle(next), all: list.map(publicRaffle) })
  }

  if (action === 'status') {
    if (!STATUSES.includes(body?.status)) {
      throw Object.assign(new Error(`status must be one of ${STATUSES.join(', ')}`), { status: 400 })
    }
    const existing = raffles.find((g) => g.id === body?.id)
    if (!existing) throw notFound(body?.id)

    let next = { ...existing, status: body.status }
    if (next.status === 'live') next = ensureSeed(next)

    const list = raffles.map((g) => (g.id === next.id ? next : g))
    await saveRaffles(list, session.name)
    return sendJson(res, 200, { raffle: publicRaffle(next), all: list.map(publicRaffle) })
  }

  if (action === 'draw') {
    const existing = raffles.find((g) => g.id === body?.id)
    if (!existing) throw notFound(body?.id)
    if (existing.drawnAt && !body?.redraw) {
      throw Object.assign(new Error('This raffle has already been drawn'), { status: 409 })
    }

    // Freeze the standings as they are at draw time, then draw from that
    // exact snapshot — it's what gets published for verification.
    const { players } = await getLeaderboard({
      casino: existing.casino,
      from: existing.startAt,
      to: existing.endAt,
      env: process.env,
    })
    const entries = toEntries(players, existing.wagerPerTicket)
    if (!entries.length) {
      throw Object.assign(new Error('Nobody has earned a ticket yet — nothing to draw'), { status: 400 })
    }

    // A redraw invalidates the old commitment, so commit to a fresh seed.
    const seeded = ensureSeed(body?.redraw ? { ...existing, seed: null, seedHash: null } : existing)
    const winners = drawWinners({
      entries,
      prizeCount: seeded.prizeCount,
      prizeAmount: seeded.prizeAmount,
      seed: seeded.seed,
    })

    const next = {
      ...seeded,
      status: 'ended',
      winners,
      entriesSnapshot: entries,
      drawnAt: new Date().toISOString(),
      drawnBy: session.name,
    }
    const list = raffles.map((g) => (g.id === next.id ? next : g))
    await saveRaffles(list, session.name)
    return sendJson(res, 200, { raffle: publicRaffle(next), all: list.map(publicRaffle) })
  }

  if (action === 'delete') {
    const list = raffles.filter((g) => g.id !== body?.id)
    if (list.length === raffles.length) throw notFound(body?.id)
    await saveRaffles(list, session.name)
    return sendJson(res, 200, { all: list.map(publicRaffle) })
  }

  throw Object.assign(new Error(`Unknown action "${action}"`), { status: 400 })
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return await handleGet(req, res)
    if (req.method === 'POST' || req.method === 'PUT') return await handlePost(req, res)
    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    console.error('api/raffles error', err)
    sendJson(res, err.status || 500, { error: err.message })
  }
}
