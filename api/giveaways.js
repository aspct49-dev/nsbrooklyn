// GET  /api/giveaways — public: live + past giveaways, entry counts, and
//                       whether the logged-in user has already entered.
// POST /api/giveaways
//   { action: 'enter', id }  — any logged-in Discord user, one entry each
//   { action: 'save' | 'status' | 'draw' | 'delete' } — admin only
//
// This is the admin-hosted giveaway (Discord login to enter). The wager
// ticket raffle is a separate feature — see api/raffles.js.
import { sendJson, readBody } from './_lib/http.js'
import { readSession, isAdmin as sessionIsAdmin, requireAdmin } from './_lib/session.js'
import {
  listGiveaways, saveGiveaways, normalizeGiveaway, publicGiveaway,
  addEntry, listEntries, countEntries, clearEntries, hasEntered,
  drawWinners, ensureSeed, phaseOf, isOpen, STATUSES,
} from './_lib/giveaways.js'

const notFound = (id) => Object.assign(new Error(`Unknown giveaway "${id}"`), { status: 404 })

const byNewest = (a, b) => +new Date(b.endAt) - +new Date(a.endAt)

/**
 * Commit to a seed as soon as a giveaway is visible, so the outcome is fixed
 * before entries close. Skipped silently if storage isn't writable — a hash
 * we can't persist is worthless, since the next request would publish a
 * different one.
 */
async function commitSeeds(giveaways) {
  const needs = giveaways.filter((g) => g.status !== 'draft' && !g.seed)
  if (!needs.length) return giveaways
  const next = giveaways.map((g) => (needs.includes(g) ? ensureSeed(g) : g))
  try {
    await saveGiveaways(next)
    return next
  } catch (err) {
    console.warn('giveaway seed commitment not persisted:', err.message)
    return giveaways
  }
}

async function handleGet(req, res) {
  const session = readSession(req)
  const admin = sessionIsAdmin(session)
  const giveaways = await commitSeeds(await listGiveaways())

  const visible = giveaways.filter((g) => g.status !== 'draft')

  // Entry counts come from the live hash for open giveaways and from the
  // frozen count for finished ones, so results can't drift after the draw.
  const withCounts = await Promise.all(
    visible.map(async (g) => {
      const entrants = g.entrantsAtDraw ?? (await countEntries(g.id))
      return publicGiveaway(g, {
        entrants,
        phase: phaseOf(g),
        entered: session ? await hasEntered(g.id, session.id) : false,
      })
    }),
  )

  const active = withCounts.filter((g) => g.phase !== 'ended').sort((a, b) => +new Date(a.endAt) - +new Date(b.endAt))
  const past = withCounts.filter((g) => g.phase === 'ended').sort(byNewest)

  const payload = {
    active,
    past,
    user: session ? { id: session.id, name: session.name, avatar: session.avatar } : null,
  }
  if (admin) payload.all = giveaways.map((g) => publicGiveaway(g, { phase: phaseOf(g) }))

  // Never cache: the response is personalized (`entered`, `user`).
  res.setHeader('Cache-Control', 'private, no-store')
  return sendJson(res, 200, payload)
}

/** Any logged-in Discord user may enter an open giveaway, once. */
async function handleEnter(req, res, body) {
  const session = readSession(req)
  if (!session) {
    throw Object.assign(new Error('Log in with Discord to enter'), { status: 401 })
  }

  const giveaways = await listGiveaways()
  const giveaway = giveaways.find((g) => g.id === body?.id)
  if (!giveaway || giveaway.status === 'draft') throw notFound(body?.id)

  if (!isOpen(giveaway)) {
    const phase = phaseOf(giveaway)
    throw Object.assign(
      new Error(phase === 'upcoming' ? 'This giveaway has not started yet' : 'Entries for this giveaway are closed'),
      { status: 409 },
    )
  }

  let isNew
  try {
    isNew = await addEntry(giveaway.id, session)
  } catch (err) {
    // Storage problems (e.g. KV not provisioned) must not surface internal
    // detail to a visitor who just clicked Enter.
    console.error('giveaway entry failed to persist', err)
    throw Object.assign(new Error("Couldn't record your entry — please try again in a moment."), { status: 503 })
  }

  return sendJson(res, 200, {
    entered: true,
    alreadyEntered: !isNew,
    entrants: await countEntries(giveaway.id),
  })
}

async function handleAdmin(req, res, body, action) {
  const session = requireAdmin(req)
  const giveaways = await listGiveaways()
  const find = () => {
    const g = giveaways.find((x) => x.id === body?.id)
    if (!g) throw notFound(body?.id)
    return g
  }

  const persist = async (next) => {
    const list = giveaways.some((g) => g.id === next.id)
      ? giveaways.map((g) => (g.id === next.id ? next : g))
      : [next, ...giveaways]
    await saveGiveaways(list, session.name)
    return sendJson(res, 200, {
      giveaway: publicGiveaway(next, { phase: phaseOf(next) }),
      all: list.map((g) => publicGiveaway(g, { phase: phaseOf(g) })),
    })
  }

  if (action === 'save') {
    const existing = giveaways.find((g) => g.id === body?.giveaway?.id) || null
    let next = normalizeGiveaway(body?.giveaway, existing)
    if (next.status !== 'draft') next = ensureSeed(next)
    return persist(next)
  }

  if (action === 'status') {
    if (!STATUSES.includes(body?.status)) {
      throw Object.assign(new Error(`status must be one of ${STATUSES.join(', ')}`), { status: 400 })
    }
    let next = { ...find(), status: body.status }
    if (next.status !== 'draft') next = ensureSeed(next)
    return persist(next)
  }

  if (action === 'draw') {
    const existing = find()
    if (existing.drawnAt && !body?.redraw) {
      throw Object.assign(new Error('This giveaway has already been drawn'), { status: 409 })
    }

    const entries = await listEntries(existing.id)
    if (!entries.length) {
      throw Object.assign(new Error('Nobody has entered yet — nothing to draw'), { status: 400 })
    }

    // A redraw invalidates the old commitment, so commit to a fresh seed.
    const seeded = ensureSeed(body?.redraw ? { ...existing, seed: null, seedHash: null } : existing)
    return persist({
      ...seeded,
      status: 'ended',
      winners: drawWinners({ entries, winnerCount: seeded.winnerCount, seed: seeded.seed }),
      entrantsAtDraw: entries.length,
      drawnAt: new Date().toISOString(),
      drawnBy: session.name,
    })
  }

  if (action === 'delete') {
    const existing = find()
    const list = giveaways.filter((g) => g.id !== existing.id)
    await saveGiveaways(list, session.name)
    await clearEntries(existing.id) // don't leave orphaned entrant records
    return sendJson(res, 200, { all: list.map((g) => publicGiveaway(g, { phase: phaseOf(g) })) })
  }

  if (action === 'entries') {
    return sendJson(res, 200, { entries: await listEntries(find().id) })
  }

  throw Object.assign(new Error(`Unknown action "${action}"`), { status: 400 })
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return await handleGet(req, res)
    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await readBody(req)
      const action = body?.action || 'enter'
      if (action === 'enter') return await handleEnter(req, res, body)
      return await handleAdmin(req, res, body, action)
    }
    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    console.error('api/giveaways error', err)
    sendJson(res, err.status || 500, { error: err.message })
  }
}
