import { useState } from 'react'
import { config, casinos } from '../data/leaderboard'
import { fmtMoney } from '../utils'
import { useLeaderboard, getCasinoRange } from '../hooks/useLeaderboard'
import Countdown from '../components/Countdown'
import Podium from '../components/Podium'
import LeaderboardTable from '../components/LeaderboardTable'
import CasinoPicker from '../components/CasinoPicker'
import CasinoBrand from '../components/CasinoBrand'
import LeaderboardStats from '../components/LeaderboardStats'
import { IconExternal } from '../components/icons'

export default function Leaderboard() {
  const [activeId, setActiveId] = useState(casinos[0].id)
  const { players, allPlayers, casino, error, updatedAt, loading } = useLeaderboard(activeId)
  const top3 = players.slice(0, 3)
  const hasStandings = players.length > 0

  // Why the board is empty, in the visitor's terms. An upstream hiccup is
  // temporary and self-healing, so it shouldn't read like something is broken
  // or like wagers have stopped counting.
  const emptyMessage = loading
    ? 'Loading live standings…'
    : error
      ? "Live standings are temporarily unavailable — they'll come back on their own shortly. Your wagers are still being tracked as normal."
      : `No one has wagered under code ${config.referralCode} this period yet — be the first.`
  const periodLabel = casino.periodLabel || 'Monthly'
  // Countdown ticks to the end of the same period the API is queried with.
  const periodEnd = getCasinoRange(casino.id).to

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

          {/* CASINO SWITCHER — only worth showing with more than one board */}
          {casinos.length > 1 && (
            <CasinoPicker casinos={casinos} activeId={activeId} onChange={setActiveId} />
          )}

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

        {hasStandings && <Podium top3={top3} />}

        <div className="lb-ends-lbl">Leaderboard ends in</div>
        <Countdown endDate={periodEnd} />

        {hasStandings ? (
          <>
            <LeaderboardStats allPlayers={allPlayers} casino={casino} updatedAt={updatedAt} />
            <LeaderboardTable rows={players} startRank={1} />
          </>
        ) : (
          // the raw upstream error stays as an attribute for debugging only
          <div className="lb-status" style={{ marginTop: 34 }} data-leaderboard-error={error || undefined}>
            {emptyMessage}
          </div>
        )}

        <p className="section-sub" style={{ textAlign: 'center', marginTop: 22, fontSize: 13 }}>
          Usernames are masked for privacy. Standings update as wagers are processed.
        </p>
      </div>
    </section>
  )
}
