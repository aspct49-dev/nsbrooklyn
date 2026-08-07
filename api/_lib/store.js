// Persistence for admin-managed state (leaderboard periods, raffles,
// giveaways and their entries).
//
// Backends, in order:
//   1. Vercel KV / Upstash Redis REST — set KV_REST_API_URL + KV_REST_API_TOKEN
//      (or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
//   2. Local JSON files under ./data — works in dev; on Vercel the filesystem
//      is read-only, so production MUST configure KV to save anything.
import fs from 'node:fs/promises'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'data')

function kvCreds() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url: url.replace(/\/$/, ''), token } : null
}

export const hasKv = () => Boolean(kvCreds())

async function kvFetch(kv, pathname, { body, method } = {}) {
  const res = await fetch(`${kv.url}/${pathname}`, {
    method: method || (body === undefined ? 'GET' : 'POST'),
    headers: { Authorization: `Bearer ${kv.token}` },
    body,
  })
  if (!res.ok) {
    throw Object.assign(new Error(`KV ${pathname.split('/')[0]} failed (${res.status})`), { status: 502 })
  }
  return (await res.json()).result
}

const fileFor = (key) => path.join(DIR, `${key.replace(/[^a-zA-Z0-9._-]/g, '_')}.json`)

// The file backend has to read-modify-write a whole JSON blob, so two
// overlapping updates to the same key would lose one of them. Serialize per
// key: Node is single-threaded, so chaining the operations is enough.
// (The KV backend doesn't need this — HSET is atomic server-side.)
const locks = new Map()

function withLock(key, fn) {
  const prev = locks.get(key) || Promise.resolve()
  const next = prev.then(fn, fn)
  // keep the chain alive but don't leak rejections into the next waiter
  locks.set(key, next.then(() => {}, () => {}))
  return next
}

async function readFileJson(key, fallback) {
  try {
    return JSON.parse(await fs.readFile(fileFor(key), 'utf8'))
  } catch {
    return fallback
  }
}

async function writeFileJson(key, value) {
  try {
    await fs.mkdir(DIR, { recursive: true })
    await fs.writeFile(fileFor(key), JSON.stringify(value, null, 2))
  } catch (err) {
    throw Object.assign(
      new Error('Cannot persist data: filesystem is read-only. Configure Vercel KV (KV_REST_API_URL / KV_REST_API_TOKEN).'),
      { status: 500, cause: err },
    )
  }
}

// ------------------------------------------------------------- plain JSON

export async function getJson(key, fallback = null) {
  const kv = kvCreds()
  if (kv) {
    const result = await kvFetch(kv, `get/${encodeURIComponent(key)}`)
    return result ? JSON.parse(result) : fallback
  }
  return readFileJson(key, fallback)
}

export async function setJson(key, value) {
  const kv = kvCreds()
  if (kv) {
    await kvFetch(kv, `set/${encodeURIComponent(key)}`, { body: JSON.stringify(value) })
    return
  }
  await writeFileJson(key, value)
}

// -------------------------------------------------------------- hash maps
// Giveaway entries live in a Redis hash keyed by Discord ID. HSET is atomic
// per field, so two people hitting "Enter" at the same moment can't clobber
// each other the way a read-modify-write on one JSON blob would.

/** Set one field. Returns true if the field was new (i.e. a first entry). */
export async function hashSet(key, field, value) {
  const kv = kvCreds()
  if (kv) {
    const added = await kvFetch(
      kv,
      `hset/${encodeURIComponent(key)}/${encodeURIComponent(field)}`,
      { body: JSON.stringify(value) },
    )
    return Number(added) === 1
  }
  return withLock(key, async () => {
    const all = await readFileJson(key, {})
    const isNew = !(field in all)
    all[field] = value
    await writeFileJson(key, all)
    return isNew
  })
}

/** Whole hash as a plain object: { field: parsedValue }. */
export async function hashGetAll(key) {
  const kv = kvCreds()
  if (kv) {
    const flat = (await kvFetch(kv, `hgetall/${encodeURIComponent(key)}`)) || []
    const out = {}
    // Upstash returns [field, value, field, value, …]
    for (let i = 0; i < flat.length; i += 2) {
      try {
        out[flat[i]] = JSON.parse(flat[i + 1])
      } catch {
        out[flat[i]] = flat[i + 1]
      }
    }
    return out
  }
  return readFileJson(key, {})
}

export async function hashCount(key) {
  const kv = kvCreds()
  if (kv) return Number(await kvFetch(kv, `hlen/${encodeURIComponent(key)}`)) || 0
  return Object.keys(await readFileJson(key, {})).length
}

/** Does one field exist? Cheaper than pulling the whole hash to check. */
export async function hashHas(key, field) {
  const kv = kvCreds()
  if (kv) {
    const exists = await kvFetch(
      kv,
      `hexists/${encodeURIComponent(key)}/${encodeURIComponent(field)}`,
    )
    return Number(exists) === 1
  }
  return field in (await readFileJson(key, {}))
}

export async function del(key) {
  const kv = kvCreds()
  if (kv) {
    await kvFetch(kv, `del/${encodeURIComponent(key)}`, { method: 'POST' })
    return
  }
  try {
    await fs.unlink(fileFor(key))
  } catch {
    /* already gone */
  }
}
