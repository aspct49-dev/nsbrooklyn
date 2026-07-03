import { useState } from 'react'
import { config, casinos } from '../data/leaderboard'
import { fmtMoney } from '../utils'
import { useLeaderboard } from '../hooks/useLeaderboard'
import Countdown from '../components/Countdown'
import Podium from '../components/Podium'
import LeaderboardTable from '../components/LeaderboardTable'
import CasinoPicker from '../components/CasinoPicker'
import CasinoBrand from '../components/CasinoBrand'
import { IconExternal } from '../components/icons'

// Countdown target = end of the leaderboard's last day, in UTC.
const periodEnd = `${config.leaderboard.endAt}T23:59:59Z`

export default function Leaderboard() {
  const [activeId, setActiveId] = useState(casinos[0].id)
  const { players, casino, error } = useLeaderboard(activeId)
  const top3 = players.slice(0, 3)
  const periodLabel = casino.id === 'casebattle' ? 'Biweekly' : 'Monthly'

  return (
    <section className="section" id="leaderboard">
      <div className="container">
        {/* HEADER */}
        <div className="lb-hero">
          <div className="lb-brand">
            <CasinoBrand casino={casino} />
          </div>
          <h1 className="lb-title">
            <span className="grad">{fmtMoney(casino.prizePool)}</span> <span className="white">{periodLabel}</span><br />
            <span className="grad">Leaderboard</span>
          </h1>
          <p className="lb-sub">
            Compete against other players under code {config.referralCode} and win big rewards!
          </p>

          {/* CASINO SWITCHER — dropdown picker, just above the code row */}
          <CasinoPicker casinos={casinos} activeId={activeId} onChange={setActiveId} />

          <div className="lb-actions">
            <div className="code-chip">
              <span className="label">CODE:</span>
              <span className="code">{config.referralCode}</span>
            </div>
            <a className="btn btn-primary" href={casino.url} target="_blank" rel="noreferrer">
              Visit {casino.name} <IconExternal />
            </a>
          </div>
          {error ? (
            <div className="alert alert-warning" style={{ marginTop: 24, padding: '14px 18px', borderRadius: 12, background: 'rgba(255, 200, 0, 0.12)', color: '#f7a11b', border: '1px solid rgba(255, 200, 0, 0.28)' }}>
              Live leaderboard unavailable: {error}. Verify your Vercel env vars and API access.
            </div>
          ) : null}
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
