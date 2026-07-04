// Persistent site settings (leaderboard periods set from the admin panel).
//
// Storage backends, in order:
//   1. Vercel KV / Upstash Redis REST — set KV_REST_API_URL + KV_REST_API_TOKEN
//      (or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
//   2. Local JSON file ./data/settings.json — works in dev; on Vercel the
//      filesystem is read-only, so production MUST configure KV to save.
import fs from 'node:fs/promises'
import path from 'node:path'

const KEY = 'nsb:settings'
const FILE = path.join(process.cwd(), 'data', 'settings.json')

function kvCreds() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url: url.replace(/\/$/, ''), token } : null
}

export async function getSettings() {
  const kv = kvCreds()
  if (kv) {
    const res = await fetch(`${kv.url}/get/${KEY}`, {
      headers: { Authorization: `Bearer ${kv.token}` },
    })
    if (res.ok) {
      const body = await res.json()
      if (body.result) return JSON.parse(body.result)
    }
    return null
  }
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8'))
  } catch {
    return null
  }
}

export async function saveSettings(settings) {
  const kv = kvCreds()
  if (kv) {
    const res = await fetch(`${kv.url}/set/${KEY}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kv.token}` },
      body: JSON.stringify(settings),
    })
    if (!res.ok) throw Object.assign(new Error(`KV save failed (${res.status})`), { status: 502 })
    return
  }
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true })
    await fs.writeFile(FILE, JSON.stringify(settings, null, 2))
  } catch (err) {
    throw Object.assign(
      new Error('Cannot persist settings: filesystem is read-only. Configure Vercel KV (KV_REST_API_URL / KV_REST_API_TOKEN).'),
      { status: 500, cause: err },
    )
  }
}
