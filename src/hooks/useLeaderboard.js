import { useMemo } from 'react'
import { casinos } from '../data/leaderboard'

// Assign a prize to each player by rank, sort by wager (desc), and cap to the
// number of prize slots so we only ever show ranked, paid positions.
function rank(players, prizes) {
  return [...players]
    .sort((a, b) => b.wagered - a.wagered)
    .slice(0, prizes.length)
    .map((p, i) => ({ ...p, prize: prizes[i] || 0 }))
}

/**
 * Returns the ranked standings for one casino (defaults to the first).
 * Data is static placeholder content from src/data/leaderboard.js — swap the
 * player lists there for live API data later; the shape here stays the same.
 */
export function useLeaderboard(casinoId = casinos[0].id) {
  const casino = casinos.find((c) => c.id === casinoId) ?? casinos[0]

  const players = useMemo(
    () => rank(casino.players, casino.prizes),
    [casino],
  )

  return { loading: false, error: null, players, updatedAt: null, casino }
}
