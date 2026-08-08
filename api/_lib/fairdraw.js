// Provably-fair random draws, shared by raffles (weighted by tickets) and
// giveaways (one entry per person).
//
// The commitment scheme: when a draw becomes possible the server generates a
// secret seed and publishes only its SHA-256 hash. The outcome is therefore
// fixed before entries close. After the draw the seed and the exact entrant
// snapshot are published, so anyone can replay `pickWeighted` and land on the
// same names — and nobody could have rerolled an unfavourable result.
import crypto from 'node:crypto'

export const makeSeed = () => crypto.randomBytes(32).toString('hex')
export const hashSeed = (seed) => crypto.createHash('sha256').update(seed).digest('hex')

/** Attach a seed + published hash if the record doesn't have one yet. */
export function ensureSeed(record) {
  if (record.seed) return record
  const seed = makeSeed()
  return { ...record, seed, seedHash: hashSeed(seed) }
}

/**
 * Deterministic float in [0, 1) from (seed, nonce) — 48 bits of HMAC-SHA256,
 * which is well inside the exact-integer range of a double.
 */
export function roll(seed, nonce) {
  const digest = crypto.createHmac('sha256', seed).update(String(nonce)).digest()
  return digest.readUIntBE(0, 6) / 2 ** 48
}

/**
 * Weighted selection with a per-item cap. A heavier item is proportionally
 * more likely; an item drops out of the pool once it has been picked
 * `maxPicks` times. With the default `maxPicks: 1` this is a plain draw
 * without replacement. Returns fewer than `count` items when the pool runs
 * dry (entrants × maxPicks < count).
 *
 * Pure and deterministic: same items + same seed ⇒ same result.
 *
 * @param {object[]} items
 * @param {number} count how many to draw
 * @param {string} seed
 * @param {(item) => number} weight defaults to 1 each (uniform draw)
 * @param {number} maxPicks how many times one item may be picked
 */
export function pickWeighted({ items, count, seed, weight = () => 1, maxPicks = 1 }) {
  // { item, picks } so an item can stay in the pool across several wins
  const pool = items.filter((it) => weight(it) > 0).map((item) => ({ item, picks: 0 }))
  const picked = []

  for (let nonce = 0; picked.length < count && pool.length; nonce++) {
    const total = pool.reduce((sum, e) => sum + weight(e.item), 0)
    const target = roll(seed, nonce) * total

    let acc = 0
    let idx = pool.length - 1 // float-rounding safety net
    for (let i = 0; i < pool.length; i++) {
      acc += weight(pool[i].item)
      if (target < acc) {
        idx = i
        break
      }
    }

    const entry = pool[idx]
    entry.picks += 1
    picked.push(entry.item)
    if (entry.picks >= maxPicks) pool.splice(idx, 1) // cap reached — retire it
  }

  return picked
}
