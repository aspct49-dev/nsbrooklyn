import { useMemo, useState } from 'react'
import { config, casinos } from '../data/leaderboard'
import { fmtMoney } from '../utils'
import { useLeaderboard, getCasinoRange, orderBy } from '../hooks/useLeaderboard'
import Countdown from '../components/Countdown'
import Podium from '../components/Podium'
import LeaderboardTable from '../components/LeaderboardTable'
import CasinoPicker from '../components/CasinoPicker'
import CasinoBrand from '../components/CasinoBrand'
import LeaderboardStats from '../components/LeaderboardStats'
import WagerRules from '../components/WagerRules'
import { IconExternal } from '../components/icons'

export default function Leaderboard() {
  const [activeId, setActiveId] = useState(casinos[0].id)
  const { players, allPlayers, filled, casino, error, updatedAt, loading } = useLeaderboard(activeId)
  // 'weighted' is the figure the board pays on, so it is what loads first.
  const [metric, setMetric] = useState('weighted')
  const rows = useMemo(() => orderBy(players, metric), [players, metric])
  const top3 = rows.slice(0, 3)
  // `players` is padded out to every paying place, so its length says nothing
  // about whether anyone is actually on the board — `filled` does. Show the
  // board on a successful fetch even with nobody on it yet (every place reads
  // as open), but keep the status message when a fetch failed and we have
  // nothing real to show.
  const hasStandings = filled > 0 || (!loading && !error)

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
            {/* A casino with no `url` is one we have left; its board would be
                display-only. Nothing in `casinos` is like that today. */}
            {casino.url && (
              <a className="btn btn-primary" href={casino.url} target="_blank" rel="noreferrer">
                Visit {casino.name} <IconExternal />
              </a>
            )}
          </div>
        </div>

        {hasStandings && (
          <div className="lb-metric-wrap">
            <div className="lb-metric" role="group" aria-label="Wager figure">
              {[
                ['weighted', 'Weighted', 'What prizes are paid on'],
                ['raw', 'Unweighted', 'Total stake, before weighting'],
              ].map(([key, label, hint]) => (
                <button
                  key={key}
                  type="button"
                  className={`lb-metric-btn ${metric === key ? 'on' : ''}`}
                  aria-pressed={metric === key}
                  onClick={() => setMetric(key)}
                >
                  {label}
                  <small>{hint}</small>
                </button>
              ))}
            </div>

            {/* Rows re-order, prizes do not: a player keeps the prize their
                weighted rank earns them, so the raw view cannot imply someone
                has won a place they have not. */}
            {metric === 'raw' && (
              <p className="lb-metric-note">
                Ranked by total stake. Prizes are still paid on <strong>weighted</strong> wager —
                each reward below is the one that player actually wins.
              </p>
            )}
          </div>
        )}

        {hasStandings && <Podium top3={top3} metric={metric} />}

        <div className="lb-ends-lbl">Leaderboard ends in</div>
        <Countdown endDate={periodEnd} />

        {casino.payout && <p className="lb-payout">{casino.payout}</p>}

        {hasStandings ? (
          <>
            <LeaderboardStats allPlayers={allPlayers} casino={casino} updatedAt={updatedAt} metric={metric} />
            <LeaderboardTable rows={rows} startRank={1} metric={metric} />
          </>
        ) : (
          // the raw upstream error stays as an attribute for debugging only
          <div className="lb-status" style={{ marginTop: 34 }} data-leaderboard-error={error || undefined}>
            {emptyMessage}
          </div>
        )}

        {/* On the page the board is on, not one click away — someone querying
            their position is standing right here when they do it. */}
        <WagerRules context="leaderboard" />

        <p className="section-sub" style={{ textAlign: 'center', marginTop: 22, fontSize: 13 }}>
          Usernames are masked for privacy. Standings update as wagers are processed.
        </p>
      </div>
    </section>
  )
}
