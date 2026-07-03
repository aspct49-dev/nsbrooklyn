import { useState } from 'react'
import { config, casinos } from '../data/leaderboard'
import { fmtMoney } from '../utils'
import { useLeaderboard } from '../hooks/useLeaderboard'
import Countdown from '../components/Countdown'
import Podium from '../components/Podium'
import LeaderboardTable from '../components/LeaderboardTable'
import { IconExternal } from '../components/icons'

// Countdown target = end of the leaderboard's last day, in UTC.
const periodEnd = `${config.leaderboard.endAt}T23:59:59Z`

export default function Leaderboard() {
  const [activeId, setActiveId] = useState(casinos[0].id)
  const { players, casino } = useLeaderboard(activeId)
  const top3 = players.slice(0, 3)

  return (
    <section className="section" id="leaderboard">
      <div className="container">
        {/* HEADER */}
        <div className="lb-hero">
          <img
            className={`lb-logo ${casino.logoInvert ? 'invert' : ''}`}
            src={casino.logo}
            alt={casino.name}
          />
          <h1 className="lb-title">
            <span className="grad">{fmtMoney(casino.prizePool)}</span> <span className="white">Monthly</span><br />
            <span className="grad">Leaderboard</span>
          </h1>
          <p className="lb-sub">
            Compete against other players under code {config.referralCode} and win big rewards!
          </p>

          {/* CASINO SWITCHER — just above the code row */}
          <div className="lb-tabs" role="tablist">
            {casinos.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={c.id === activeId}
                className={`lb-tab ${c.id === activeId ? 'active' : ''}`}
                onClick={() => setActiveId(c.id)}
              >
                <img
                  className={`lb-tab-logo ${c.logoInvert ? 'invert' : ''}`}
                  src={c.logo}
                  alt={c.name}
                />
              </button>
            ))}
          </div>

          <div className="lb-actions">
            <div className="code-chip">
              <span className="label">CODE:</span>
              <span className="code">{config.referralCode}</span>
            </div>
            <a className="btn btn-primary" href={casino.url} target="_blank" rel="noreferrer">
              Visit {casino.name} <IconExternal />
            </a>
          </div>
        </div>

        <Podium top3={top3} />

        <div className="lb-ends-lbl">Leaderboard ends in</div>
        <Countdown endDate={periodEnd} />

        <div style={{ height: 40 }} />

        <LeaderboardTable rows={players} startRank={1} />

        <p className="section-sub" style={{ textAlign: 'center', marginTop: 22, fontSize: 13 }}>
          Usernames are masked for privacy. Standings update as wagers are processed.
        </p>
      </div>
    </section>
  )
}
