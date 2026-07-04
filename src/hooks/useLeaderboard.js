import { useEffect, useMemo, useState } from 'react'
import { casinos, config } from '../data/leaderboard'

// Assign a prize to each player by rank, sort by wager (desc), and cap to the
// number of prize slots so we only ever show ranked, paid positions.
function rank(players, prizes) {
  return [...players]
    .sort((a, b) => b.wagered - a.wagered)
    .slice(0, prizes.length)
    .map((p, i) => ({ ...p, prize: prizes[i] || 0 }))
}

const REFRESH_MS = 600_000
const RETRY_MS = 180_000
const RATE_LIMIT_MS = 600_000

// Module-level cache so tab switches / multiple components don't refetch.
const cache = new Map() // cacheKey -> { players, updatedAt }
const listeners = new Set()

// Admin-configured periods from /api/settings (set in the /admin panel).
// Loaded once; components re-render (via listeners) when they arrive.
let adminSettings = null
let settingsPromise = null
export function loadSettings() {
  if (!settingsPromise) {
    settingsPromise = fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        adminSettings = s
        listeners.forEach((fn) => fn())
      })
      .catch(() => {})
  }
  return settingsPromise
}

function getMonthRange(date) {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))
  return { from: start.toISOString(), to: end.toISOString() }
}

// Exported so the page countdown can tick to the same period end the API
// is actually queried with. Admin-panel settings win; the hardcoded
// defaults below are the fallback when nothing is configured.
export function getCasinoRange(casinoId) {
  const configured = adminSettings?.casinos?.[casinoId]
  if (configured?.startAt && configured?.endAt) {
    return { from: configured.startAt, to: configured.endAt }
  }

  const now = new Date()
  const monthRange = getMonthRange(now)
  if (casinoId === 'betbolt') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), 5, 23, 0, 0, 0, 0))
    return { from: start.toISOString(), to: monthRange.to }
  }
  if (casinoId === 'casebattle') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 14, 23, 59, 59, 999))
    return { from: start.toISOString(), to: end.toISOString() }
  }
  return monthRange
}

function cacheKeyFor(casinoId, range) {
  return `${casinoId}:${range.from}:${range.to}`
}

async function refresh(casinoId, range) {
  const qs = new URLSearchParams({ casino: casinoId, from: range.from, to: range.to })
  const res = await fetch(`/api/leaderboard?${qs}`)
  if (!res.ok) {
    let message = `api ${res.status}`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch (err) {
      /* ignore parse errors */
    }
    throw Object.assign(new Error(message), { status: res.status })
  }
  const data = await res.json()
  if (!Array.isArray(data.players)) throw new Error('bad payload')
  cache.set(cacheKeyFor(casinoId, range), data)
  listeners.forEach((fn) => fn())
}

/**
 * Ranked standings for one casino (defaults to the first).
 * Fetches live data from /api/leaderboard (which proxies the casino APIs
 * server-side); until it arrives — or if it fails — falls back to the
 * placeholder players in src/data/leaderboard.js so the UI always renders.
 */
export function useLeaderboard(casinoId = casinos[0].id) {
  const casino = casinos.find((c) => c.id === casinoId) ?? casinos[0]
  const [, force] = useState(0)
  const [error, setError] = useState(null)
  const range = getCasinoRange(casino.id)
  const cacheKey = cacheKeyFor(casino.id, range)

  useEffect(() => {
    const bump = () => force((n) => n + 1)
    listeners.add(bump)

    let timer
    const tick = async () => {
      let delay = REFRESH_MS
      try {
        // admin-configured periods first, so we query the right window
        await loadSettings()
        await refresh(casino.id, getCasinoRange(casino.id))
        setError(null)
      } catch (err) {
        setError(err.message || 'Leaderboard fetch failed')
        if (err.status === 429 || String(err.message).includes('429')) {
          delay = RATE_LIMIT_MS
        } else {
          delay = RETRY_MS
        }
      }
      timer = setTimeout(tick, delay)
    }

    if (!cache.has(cacheKey)) tick()

    return () => {
      listeners.delete(bump)
      clearTimeout(timer)
    }
  }, [cacheKey, casino.id])

  const live = cache.get(cacheKey)
  const source = live?.players?.length ? live.players : error ? [] : casino.players

  const players = useMemo(
    () => rank(source, casino.prizes),
    [source, casino],
  )

  return {
    loading: !live,
    error,
    players,
    updatedAt: live?.updatedAt ?? null,
    casino,
  }
}
