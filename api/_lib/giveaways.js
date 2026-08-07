// Admin-hosted giveaways: an admin posts a prize, anyone logged in with
// Discord clicks Enter once, and the admin draws the winner(s) at the end.
//
// This is NOT the wager raffle (see ./raffles.js) — there are no tickets and
// no wagering requirement; every entrant has exactly one equal entry.
//
// Entries live in their own Redis hash per giveaway, keyed by Discord ID, so
// the dedupe is atomic and the giveaway record itself stays small.
import { getSettings, saveSettings } from './settingsStore.js'
import { hashSet, hashGetAll, hashCount, hashHas, del } from './store.js'
import { pickWeighted, ensureSeed } from './fairdraw.js'

export { ensureSeed }

export const STATUSES = ['draft', 'live', 'ended']

const entriesKey = (id) => `nsb:giveaway-entries:${id}`

/** Public view — never leaks an undrawn seed. */
export function publicGiveaway(g, extra = {}) {
  const { seed, ...rest } = g
  return { ...rest, seed: g.drawnAt ? seed : null, ...extra }
}

// --------------------------------------------------------------- storage

export async function listGiveaways() {
  const settings = await getSettings()
  return Array.isArray(settings?.giveaways) ? settings.giveaways : []
}

/**
 * Replace the stored giveaway list, preserving every other settings key.
 * `by` is omitted for automatic writes (e.g. the seed commitment), which
 * shouldn't take credit for the admin's last manual edit.
 */
export async function saveGiveaways(giveaways, by) {
  const prev = (await getSettings()) || {}
  const next = {
    ...prev,
    casinos: prev.casinos || {},
    giveaways,
    updatedAt: new Date().toISOString(),
    updatedBy: by ?? prev.updatedBy ?? null,
  }
  await saveSettings(next)
  return next
}

// --------------------------------------------------------------- entries

/**
 * Record one entry. Returns true if this was the user's first — HSET is
 * atomic per field, so simultaneous clicks can't produce a double entry or
 * lose someone else's.
 */
export function addEntry(giveawayId, user) {
  return hashSet(entriesKey(giveawayId), user.id, {
    id: user.id,
    name: user.name,
    avatar: user.avatar || null,
    at: new Date().toISOString(),
  })
}

export async function listEntries(giveawayId) {
  const map = await hashGetAll(entriesKey(giveawayId))
  return Object.values(map).sort((a, b) => new Date(a.at) - new Date(b.at))
}

export const countEntries = (giveawayId) => hashCount(entriesKey(giveawayId))

export const clearEntries = (giveawayId) => del(entriesKey(giveawayId))

/**
 * Membership check only — deliberately not a full read. Every page view calls
 * this per giveaway, so pulling the whole entrant list here would mean
 * downloading thousands of records on each load.
 */
export function hasEntered(giveawayId, userId) {
  if (!userId) return Promise.resolve(false)
  return hashHas(entriesKey(giveawayId), userId)
}

// --------------------------------------------------------------- the draw

/**
 * Uniform draw without replacement — every entrant has exactly one equal
 * chance and nobody can win twice. Deterministic for a given seed.
 */
export function drawWinners({ entries, winnerCount, seed }) {
  return pickWeighted({ items: entries, count: winnerCount, seed }).map((w, i) => ({
    place: i + 1,
    id: w.id,
    name: w.name,
    avatar: w.avatar || null,
  }))
}

// --------------------------------------------------------------- lifecycle

/** draft | upcoming | live | awaiting-draw | ended */
export function phaseOf(giveaway) {
  if (!giveaway) return 'none'
  if (giveaway.status === 'draft') return 'draft'
  if (giveaway.winners?.length) return 'ended'
  const now = Date.now()
  if (giveaway.startAt && now < +new Date(giveaway.startAt)) return 'upcoming'
  if (now < +new Date(giveaway.endAt)) return 'live'
  return 'awaiting-draw'
}

export const isOpen = (giveaway) => phaseOf(giveaway) === 'live'

// --------------------------------------------------------------- validation

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/
const bad = (msg) => Object.assign(new Error(msg), { status: 400 })

const slug = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)

/** Validate + normalize an admin-submitted giveaway. Throws 400 on bad input. */
export function normalizeGiveaway(input, existing) {
  const title = String(input?.title || '').trim()
  if (!title) throw bad('Title is required')

  const prize = String(input?.prize || '').trim()
  if (!prize) throw bad('Prize is required')
  if (prize.length > 120) throw bad('Prize must be 120 characters or fewer')

  const description = String(input?.description || '').trim().slice(0, 500)

  if (!ISO_RE.test(input?.endAt || '')) throw bad('Invalid end date')
  if (input?.startAt && !ISO_RE.test(input.startAt)) throw bad('Invalid start date')
  if (input?.startAt && new Date(input.startAt) >= new Date(input.endAt)) {
    throw bad('Start must be before end')
  }

  const winnerCount = Math.floor(Number(input?.winnerCount ?? 1))
  if (!Number.isFinite(winnerCount) || winnerCount < 1 || winnerCount > 100) {
    throw bad('Number of winners must be between 1 and 100')
  }

  return {
    // keep the id stable on edit so entries and results aren't orphaned
    id: existing?.id || `${slug(title)}-${Date.now().toString(36)}`,
    title: title.slice(0, 120),
    prize,
    description,
    startAt: input?.startAt || null,
    endAt: input.endAt,
    winnerCount,
    status: STATUSES.includes(input?.status) ? input.status : 'draft',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    // draw results are never client-supplied — they only ever come from the
    // server-side draw, so carry the existing ones over untouched
    seedHash: existing?.seedHash ?? null,
    seed: existing?.seed ?? null,
    drawnAt: existing?.drawnAt ?? null,
    drawnBy: existing?.drawnBy ?? null,
    winners: existing?.winners ?? null,
    entrantsAtDraw: existing?.entrantsAtDraw ?? null,
  }
}
