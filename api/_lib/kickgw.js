// The Kick chat giveaway — a live picker run from the admin panel.
//
// Unlike the scheduled giveaways in ./giveaways.js this is a single session
// you open during a stream: set a keyword, collect entries from Kick chat as
// people type it, then draw. Nothing about it is public until you choose to
// announce the winners yourself.
//
// Only viewers who have linked Kick ↔ Discord on the site can enter, so every
// entrant resolves to a real Discord account.
import { getJson, setJson, hashSet, hashGetAll, hashCount, del } from './store.js'
import { pickWeighted, ensureSeed, makeSeed, hashSeed } from './fairdraw.js'

export { ensureSeed, makeSeed, hashSeed }

const KEY = 'nsb:kickgw'
const ENTRIES = 'nsb:kickgw:entries'
const MISSES = 'nsb:kickgw:misses'
const MSGS = 'nsb:kickgw:msgs'
const HITS = 'nsb:kickgw:hits'

const bad = (msg) => Object.assign(new Error(msg), { status: 400 })

/** How many times a subscriber's entry counts when sub luck is on. */
export const SUB_MULTIPLIER = 3

export const BLANK = {
  keyword: '',
  open: false,
  requireRole: true,
  subLuck: false,
  winnerCount: 1,
  prize: '',
  openedAt: null,
  openedBy: null,
  closedAt: null,
  seed: null,
  seedHash: null,
  drawnAt: null,
  drawnBy: null,
  winners: null,
  entrantsAtDraw: null,
  redraws: [],
}

export async function getSession() {
  return { ...BLANK, ...((await getJson(KEY, null)) || {}) }
}

export async function saveSession(session) {
  await setJson(KEY, session)
  return session
}

/** Never leak the seed before the draw — it would give the result away. */
export function publicSession(s) {
  const { seed, ...rest } = s
  return { ...rest, seed: s.drawnAt ? seed : null }
}

// --------------------------------------------------------------- keyword

/**
 * Does a chat message contain the keyword?
 *
 * Emote tokens are stripped first — Kick embeds them as `[emote:123:NAME]`,
 * so an emote called the same thing as the keyword can't trigger an entry.
 * Matching is on whole words, so "!enter" doesn't fire on "!entered", but
 * someone who types it mid-sentence still counts.
 */
export function messageMatches(content, keyword) {
  const needle = String(keyword ?? '').trim().toLowerCase()
  if (!needle) return false
  const text = String(content ?? '').replace(/\[emote:\d+:[^\]]*\]/gi, ' ').toLowerCase()
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // \b is useless next to leading punctuation like "!enter", so bound on
  // whitespace or the string edges instead
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(text)
}

// --------------------------------------------------------------- entries

/** Record an entry, keyed by Discord id. Returns true if it was their first. */
export const addEntry = (user) =>
  hashSet(ENTRIES, user.discordId, {
    discordId: user.discordId,
    discordName: user.discordName,
    kickId: user.kickId,
    kickName: user.kickName,
    kickAvatar: user.kickAvatar || null,
    isSub: Boolean(user.isSub),
    at: new Date().toISOString(),
  })

export async function listEntries() {
  const map = await hashGetAll(ENTRIES)
  return Object.values(map).sort((a, b) => new Date(a.at) - new Date(b.at))
}

export const countEntries = () => hashCount(ENTRIES)

/**
 * Someone typed the keyword but wasn't eligible. Kept so you can answer
 * "why am I not in the list?" on stream instead of guessing, and so it's
 * obvious when lots of viewers are bouncing off the link requirement.
 */
export const recordMiss = (kickId, kickName, reason) =>
  hashSet(MISSES, String(kickId), { kickName, reason, at: new Date().toISOString() })

export async function listMisses() {
  const map = await hashGetAll(MISSES)
  return Object.values(map).sort((a, b) => new Date(b.at) - new Date(a.at))
}

export const clearEntries = () => Promise.all([del(ENTRIES), del(MISSES), del(MSGS)])

// ------------------------------------------------------- winner chatter
// After a draw the picker shows what the winner says next, so you can see
// them react on stream. Only winners are recorded, and matching is on the
// Kick id already in the webhook payload — no extra lookup per message.

const MAX_MSGS = 6

export async function recordWinnerMessage(kickId, kickName, text) {
  const all = await hashGetAll(MSGS)
  const prev = all[String(kickId)]?.messages || []
  await hashSet(MSGS, String(kickId), {
    kickName,
    messages: [...prev, { text: String(text).slice(0, 300), at: new Date().toISOString() }].slice(-MAX_MSGS),
  })
}

/** { kickId: { kickName, messages[] } } */
export const winnerMessages = () => hashGetAll(MSGS)

// ------------------------------------------------------------ diagnostics
// A record of what actually reached the webhook. Without it, "Kick isn't
// sending" and "Kick is sending and we're rejecting it" look identical from
// the admin panel — which is a miserable thing to debug mid-stream.

const MAX_HITS = 12

export async function recordHit(info) {
  try {
    const prev = (await getJson(HITS, null)) || { count: 0, recent: [] }
    await setJson(HITS, {
      count: (prev.count || 0) + 1,
      lastAt: new Date().toISOString(),
      recent: [{ at: new Date().toISOString(), ...info }, ...(prev.recent || [])].slice(0, MAX_HITS),
    })
  } catch {
    // diagnostics must never break delivery
  }
}

export const getHits = () => getJson(HITS, { count: 0, lastAt: null, recent: [] })

// --------------------------------------------------------------- the draw

/**
 * Draw without replacement — nobody wins twice.
 *
 * Uniform by default. With sub luck on, a subscriber's entry weighs
 * SUB_MULTIPLIER times as much: still one entry each, just better odds.
 */
export const entryWeight = (e, subLuck) => (subLuck && e.isSub ? SUB_MULTIPLIER : 1)

export function drawWinners({ entries, winnerCount, seed, subLuck = false }) {
  return pickWeighted({
    items: entries,
    count: winnerCount,
    seed,
    weight: (e) => entryWeight(e, subLuck),
  }).map((w, i) => ({
    place: i + 1,
    discordId: w.discordId,
    discordName: w.discordName,
    kickId: w.kickId,
    kickName: w.kickName,
    kickAvatar: w.kickAvatar || null,
    isSub: Boolean(w.isSub),
  }))
}

/**
 * Replace one winner, leaving the others alone — for when someone is
 * unreachable or turns the prize down. The session's original seed still
 * proves the places that weren't touched, so it is left intact and each
 * redraw carries its own seed.
 */
export function redrawPlace({ session, entries, place, seed }) {
  const winners = session.winners || []
  const target = winners.find((w) => w.place === place)
  if (!target) throw bad(`No winner at place ${place}`)
  if (!entries?.length) throw bad('There are no recorded entries to redraw from')

  const holding = new Set(winners.filter((w) => w.place !== place).map((w) => w.discordId))
  const removed = new Set((session.redraws || []).map((r) => r.removedId))

  const eligible = entries.filter((e) =>
    e.discordId !== target.discordId && !holding.has(e.discordId) && !removed.has(e.discordId))
  if (!eligible.length) {
    throw bad('No eligible entrants left — everyone else has already won or been removed')
  }

  const [replacement] = pickWeighted({
    items: eligible,
    count: 1,
    seed,
    weight: (e) => entryWeight(e, session.subLuck),
  })
  return {
    winners: winners.map((w) =>
      w.place === place
        ? {
            ...w,
            discordId: replacement.discordId,
            discordName: replacement.discordName,
            kickId: replacement.kickId,
            kickName: replacement.kickName,
            kickAvatar: replacement.kickAvatar || null,
            isSub: Boolean(replacement.isSub),
          }
        : w),
    record: {
      place,
      removed: target.discordName,
      removedId: target.discordId,
      replacedWith: replacement.discordName,
      replacedWithId: replacement.discordId,
      seed,
      seedHash: hashSeed(seed),
      at: new Date().toISOString(),
    },
  }
}

// --------------------------------------------------------------- validation

export function normalizeKeyword(input) {
  const keyword = String(input ?? '').trim()
  if (!keyword) throw bad('A keyword is required')
  if (/\s/.test(keyword)) throw bad('The keyword must be a single word with no spaces')
  if (keyword.length > 40) throw bad('The keyword must be 40 characters or fewer')
  return keyword
}

export function normalizeWinnerCount(input) {
  const n = Math.floor(Number(input ?? 1))
  if (!Number.isFinite(n) || n < 1 || n > 100) throw bad('Winners must be between 1 and 100')
  return n
}
