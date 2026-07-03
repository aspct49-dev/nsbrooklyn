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

// Current leaderboard period, as ISO UTC bounds for the API.
const FROM = `${config.leaderboard.startAt}T00:00:00.000Z`
const TO = `${config.leaderboard.endAt}T23:59:59.999Z`

const REFRESH_MS = 90_000

// Module-level cache so tab switches / multiple components don't refetch.
const cache = new Map() // casinoId -> { players, updatedAt }
const listeners = new Set()

async function refresh(casinoId) {
  const qs = new URLSearchParams({ casino: casinoId, from: FROM, to: TO })
  const res = await fetch(`/api/leaderboard?${qs}`)
  if (!res.ok) throw new Error(`api ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data.players)) throw new Error('bad payload')
  cache.set(casinoId, data)
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

  useEffect(() => {
    const bump = () => force((n) => n + 1)
    listeners.add(bump)

    let timer
    const tick = () => refresh(casino.id).catch(() => {}) // keep fallback on error
    if (!cache.has(casino.id)) tick()
    timer = setInterval(tick, REFRESH_MS)

    return () => {
      listeners.delete(bump)
      clearInterval(timer)
    }
  }, [casino.id])

  const live = cache.get(casino.id)
  const source = live?.players?.length ? live.players : casino.players

  const players = useMemo(
    () => rank(source, casino.prizes),
    [source, casino],
  )

  return {
    loading: !live,
    error: null,
    players,
    updatedAt: live?.updatedAt ?? null,
    casino,
  }
}
