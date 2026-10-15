import { fmtMoney, maskName, wagerOf } from '../utils'

const MEDAL = { 1: 'gold', 2: 'silver', 3: 'bronze' }

export default function LeaderboardTable({ rows, startRank, metric = 'weighted' }) {
  if (!rows.length) return null
  return (
    <div className="lb-table-wrap">
      <table className="lb-table">
        <thead>
          <tr>
            <th style={{ width: 80 }}>Rank</th>
            <th>User</th>
            <th className="right">{metric === 'raw' ? 'Wagered (raw)' : 'Wagered'}</th>
            <th className="right">Reward</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => {
            const rank = startRank + i
            // Open slots have no name, so the rank is the only stable key.
            return (
              <tr key={p.open ? `open-${rank}` : p.name} className={p.open ? 'lb-row-open' : ''}>
                <td><span className={`rank-pill ${MEDAL[rank] || ''}`}>{rank}</span></td>
                <td>
                  <div className="user-cell">
                    {p.open ? <span className="lb-open-cell">This could be you</span> : maskName(p.name)}
                  </div>
                </td>
                <td className="right">
                  {p.open ? (
                    <span className="lb-open-dash">—</span>
                  ) : (
                    <span className="wager-val"><span className="cur">$</span>{fmtMoney(wagerOf(p, metric), 2).slice(1)}</span>
                  )}
                </td>
                <td className="right"><span className="reward-val">{fmtMoney(p.prize)}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
