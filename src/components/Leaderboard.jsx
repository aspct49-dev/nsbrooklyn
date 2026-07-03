import { useState } from 'react'
import { casinos, accentVars } from '../config/site'
import { leaderboards } from '../config/data'
import { Icon } from './icons'
import Countdown from './Countdown'

const fmt = (n) => '$' + n.toLocaleString('en-US')
const METALS = { 1: 'gold', 2: 'silver', 3: 'bronze' }

export default function Leaderboard() {
  const [activeId, setActiveId] = useState(casinos[0].id)
  const casino = casinos.find((c) => c.id === activeId)
  const rows = leaderboards[activeId] ?? []
  const top3 = rows.slice(0, 3)
  const rest = rows.slice(3)

  return (
    <section className="section" id="leaderboards">
      <div className="container">
        {/* Casino switcher */}
        <div className="lb-tabs" role="tablist">
          {casinos.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={c.id === activeId}
              className={`lb-tab ${c.id === activeId ? 'active' : ''}`}
              style={accentVars(c)}
              onClick={() => setActiveId(c.id)}
            >
              <Icon type={c.icon} width={18} height={18} />
              <span className="lb-tab-name">{c.name}</span>
              <span className="lb-tab-pool">{c.prizePool}</span>
            </button>
          ))}
        </div>

        <div className="lb-panel" key={casino.id} style={accentVars(casino)}>
          <div className="lb-head">
            <h2 className="display lb-title">
              <span className="accent-text">{casino.prizePool} Monthly</span>
              <span>Leaderboard</span>
            </h2>
            <div className="lb-join">
              <span className="code-pill static">
                <span className="label">Code</span>
                <span className="code">{casino.code}</span>
              </span>
              <a
                className="btn btn-sm lb-cta"
                href={casino.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit {casino.name}
                <Icon type="arrow" width={16} height={16} />
              </a>
            </div>
          </div>

          {/* Podium + metal ribbons */}
          <div className="podium">
            {top3.map((p) => (
              <div className={`podium-col p${p.rank}`} key={p.rank}>
                <div className="podium-card">
                  {p.rank === 1 && (
                    <Icon type="crown" className="crown" width={26} height={26} />
                  )}
                  <div className="av-wrap">
                    <div className="av-big">{p.player[0].toUpperCase()}</div>
                    <span className={`rank-chip ${METALS[p.rank]}`}>{p.rank}</span>
                  </div>
                  <div className="who">{p.player}</div>
                  <div className="cap">Wagered</div>
                  <div className="amt">{fmt(p.wagered)}</div>
                </div>
                <div className={`ribbon ${METALS[p.rank]}`}>{p.prize}</div>
              </div>
            ))}
          </div>

          <div className="lb-ends">
            <div className="lb-ends-cap">Leaderboard ends in</div>
            <Countdown target={casino.resetsAt} />
          </div>

          {/* Table: ranks 4+ */}
          <div className="lb-table">
            <div className="lb-row head">
              <span>Rank</span>
              <span>User</span>
              <span className="wag">Wagered</span>
              <span style={{ textAlign: 'right' }}>Reward</span>
            </div>
            {rest.map((p) => (
              <div className="lb-row" key={p.rank}>
                <span className="rank-badge">{p.rank}</span>
                <span className="who">{p.player}</span>
                <span className="wag">{fmt(p.wagered)}</span>
                <span className="prz">{p.prize}</span>
              </div>
            ))}
          </div>

          <p className="lb-note">
            Usernames are masked for privacy. Standings update as wagers are
            processed.
          </p>
        </div>
      </div>
    </section>
  )
}
