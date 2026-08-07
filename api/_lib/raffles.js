// Weekly wager raffle: every $100 wagered in the raffle window earns one
// ticket, and winners are drawn from that weighted ticket pool.
//
// The draw is provably fair. Before the draw the server commits to a random
// seed by publishing its SHA-256 hash (`seedHash`); after the draw the seed
// itself is published together with the exact entry snapshot that was used,
// so anyone can replay `drawWinners()` and land on the same names.
import { getSettings, saveSettings } from './settingsStore.js'
import { pickWeighted, ensureSeed, makeSeed, hashSeed } from './fairdraw.js'

export { ensureSeed, makeSeed, hashSeed }

// Built-in raffle that runs until an admin creates their own in /admin.
// Times are UTC: 2026-07-31 11:00 PM ET → 2026-08-07 11:00 PM ET (UTC-4).
export const DEFAULT_RAFFLES = [
  {
    id: 'weekly-2026-07-31',
    title: 'Weekly $250 Raffle',
    casino: 'betbolt',
    startAt: '2026-08-01T03:00:00.000Z',
    endAt: '2026-08-08T03:00:00.000Z',
    wagerPerTicket: 100,
    prizeCount: 5,
    prizeAmount: 50,
    status: 'live',
    seedHash: null,
    seed: null,
    drawnAt: null,
    drawnBy: null,
    winners: null,
    entriesSnapshot: null,
  },
]

export const STATUSES = ['draft', 'live', 'ended']

/** Total $ paid out by a raffle. */
export const rafflePool = (g) => (g.prizeCount || 0) * (g.prizeAmount || 0)

/** Public view of a raffle — never leaks an undrawn seed. */
export function publicRaffle(g) {
  const { seed, ...rest } = g
  return { ...rest, seed: g.drawnAt ? seed : null, prizePool: rafflePool(g) }
}

// --------------------------------------------------------------- storage

export async function listRaffles() {
  const settings = await getSettings()
  const saved = settings?.raffles
  return Array.isArray(saved) && saved.length ? saved : DEFAULT_RAFFLES
}

/**
 * Replace the stored raffle list, preserving every other settings key.
 * The first write materializes the built-in default so it can be edited.
 * `by` is omitted for automatic writes (e.g. the seed commitment), which
 * shouldn't take credit for the admin's last manual edit.
 */
export async function saveRaffles(raffles, by) {
  const prev = (await getSettings()) || {}
  const next = {
    ...prev,
    casinos: prev.casinos || {},
    raffles,
    updatedAt: new Date().toISOString(),
    updatedBy: by ?? prev.updatedBy ?? null,
  }
  await saveSettings(next)
  return next
}

// --------------------------------------------------------------- tickets

/**
 * Turn raw standings into ticket counts.
 * @param {{name: string, wagered: number}[]} players
 * @param {number} wagerPerTicket dollars of wager per ticket
 */
export function toEntries(players, wagerPerTicket) {
  const per = Number(wagerPerTicket) > 0 ? Number(wagerPerTicket) : 100
  return (players || [])
    .map((p) => ({
      name: p.name,
      wagered: Number(p.wagered) || 0,
      tickets: Math.floor((Number(p.wagered) || 0) / per),
    }))
    .filter((e) => e.tickets > 0)
    .sort((a, b) => b.tickets - a.tickets || b.wagered - a.wagered)
}

export const countTickets = (entries) => entries.reduce((sum, e) => sum + e.tickets, 0)

// --------------------------------------------------------------- the draw

/**
 * Draw the winners, weighted by ticket count and without replacement — one
 * player can only win once, and more tickets means proportionally better
 * odds. Fewer eligible entrants than prizes ⇒ fewer winners.
 *
 * Pure and deterministic: same entries + same seed ⇒ same winners.
 */
export function drawWinners({ entries, prizeCount, prizeAmount, seed }) {
  return pickWeighted({
    items: entries,
    count: prizeCount,
    seed,
    weight: (e) => e.tickets,
  }).map((winner, i) => ({
    place: i + 1,
    name: winner.name,
    tickets: winner.tickets,
    wagered: winner.wagered,
    prize: prizeAmount,
  }))
}

// --------------------------------------------------------------- validation

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/
const bad = (msg) => Object.assign(new Error(msg), { status: 400 })

const slug = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)

/** Validate + normalize an admin-submitted raffle. Throws 400 on bad input. */
export function normalizeRaffle(input, existing) {
  const title = String(input?.title || '').trim()
  if (!title) throw bad('Title is required')
  if (!ISO_RE.test(input?.startAt || '')) throw bad('Invalid start date')
  if (!ISO_RE.test(input?.endAt || '')) throw bad('Invalid end date')
  if (new Date(input.startAt) >= new Date(input.endAt)) throw bad('Start must be before end')

  const num = (v, name, { min, max }) => {
    const n = Number(v)
    if (!Number.isFinite(n) || n < min || n > max) throw bad(`${name} must be between ${min} and ${max}`)
    return n
  }

  const status = STATUSES.includes(input?.status) ? input.status : 'draft'

  return {
    // keep the id stable on edit so an already-drawn raffle isn't orphaned
    id: existing?.id || `${slug(title)}-${Date.now().toString(36)}`,
    title,
    casino: 'betbolt', // single partner casino — see src/data/leaderboard.js
    startAt: input.startAt,
    endAt: input.endAt,
    wagerPerTicket: num(input?.wagerPerTicket ?? 100, 'Wager per ticket', { min: 1, max: 1_000_000 }),
    prizeCount: Math.floor(num(input?.prizeCount ?? 5, 'Number of winners', { min: 1, max: 100 })),
    prizeAmount: num(input?.prizeAmount ?? 50, 'Prize per winner', { min: 1, max: 1_000_000 }),
    status,
    // draw results are never client-supplied — they only ever come from
    // the server-side draw, so carry the existing ones over untouched
    seedHash: existing?.seedHash ?? null,
    seed: existing?.seed ?? null,
    drawnAt: existing?.drawnAt ?? null,
    drawnBy: existing?.drawnBy ?? null,
    winners: existing?.winners ?? null,
    entriesSnapshot: existing?.entriesSnapshot ?? null,
  }
}
