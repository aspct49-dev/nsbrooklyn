import { fmtMoney } from '../utils'

// $169,234.56 → "$169.2k", $1,234,567 → "$1.23M", small values stay exact.
function fmtCompact(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}k`
  return fmtMoney(n, n < 100 ? 2 : 0)
}

/* Stats strip for the active board: totals derived from the fetched
   standings, plus the casino's configured prize pool. */
export default function LeaderboardStats({ allPlayers, casino, updatedAt }) {
  const totalWagered = allPlayers.reduce((s, p) => s + (p.wagered || 0), 0)
  const topWager = allPlayers.length ? Math.max(...allPlayers.map((p) => p.wagered || 0)) : 0

  const tiles = [
    { label: 'Total Players', value: String(allPlayers.length) },
    { label: 'Total Wagered', value: fmtCompact(totalWagered), gold: true },
    { label: 'Top Wager', value: fmtCompact(topWager) },
    { label: 'Prize Pool', value: fmtMoney(casino.prizePool), gold: true },
  ]

  return (
    <div className="lb-stats">
      <div className="lb-stats-head">
        <div>
          <div className="lb-stats-eyebrow">Live leaderboard stats</div>
          <h3>{casino.name} Statistics</h3>
        </div>
        {updatedAt && (
          <span className="lb-stats-updated">
            Updated {new Date(updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
      </div>
      <div className="lb-stats-grid">
        {tiles.map((t) => (
          <div className="lb-stat" key={t.label}>
            <div className="lb-stat-label">{t.label}</div>
            <div className={`lb-stat-value ${t.gold ? 'gold' : ''}`}>{t.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
