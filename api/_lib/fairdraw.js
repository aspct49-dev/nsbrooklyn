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
 * Weighted selection WITHOUT replacement — an item can only be picked once,
 * and a heavier item is proportionally more likely. Returns fewer than
 * `count` items when the pool is smaller than that.
 *
 * Pure and deterministic: same items + same seed ⇒ same result.
 *
 * @param {object[]} items
 * @param {(item) => number} weight defaults to 1 each (uniform draw)
 */
export function pickWeighted({ items, count, seed, weight = () => 1 }) {
  const pool = items.filter((it) => weight(it) > 0)
  const picked = []

  for (let nonce = 0; picked.length < count && pool.length; nonce++) {
    const total = pool.reduce((sum, it) => sum + weight(it), 0)
    const target = roll(seed, nonce) * total

    let acc = 0
    let idx = pool.length - 1 // float-rounding safety net
    for (let i = 0; i < pool.length; i++) {
      acc += weight(pool[i])
      if (target < acc) {
        idx = i
        break
      }
    }

    picked.push(pool.splice(idx, 1)[0])
  }

  return picked
}
