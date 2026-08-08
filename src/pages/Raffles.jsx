import { config } from '../data/leaderboard'
import { fmtMoney, maskName } from '../utils'
import { useRaffle, rafflePhase } from '../hooks/useRaffle'
import Countdown from '../components/Countdown'
import { IconTicket, IconExternal } from '../components/icons'

const MEDAL = { 1: 'gold', 2: 'silver', 3: 'bronze' }

const fmtDate = (iso) =>
  new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })

const pct = (part, total) => (total > 0 ? `${((part / total) * 100).toFixed(2)}%` : '—')

function PhaseBanner({ phase, raffle }) {
  if (phase === 'upcoming') {
    return (
      <>
        <div className="lb-ends-lbl">Raffle starts in</div>
        <Countdown endDate={raffle.startAt} endedLabel="🎟️ The raffle is open — start wagering!" />
      </>
    )
  }
  if (phase === 'live') {
    return (
      <>
        <div className="lb-ends-lbl">Entries close in</div>
        {/* the phase only re-evaluates on refresh, so the countdown itself
            covers the moment entries close */}
        <Countdown endDate={raffle.endAt} endedLabel="🎲 Entries are closed — winners are being drawn!" />
      </>
    )
  }
  if (phase === 'awaiting-draw') {
    return <div className="gw-banner">🎲 Entries are closed — winners are being drawn!</div>
  }
  return <div className="gw-banner done">🎉 Winners have been drawn — prizes are on their way!</div>
}

function Winners({ raffle }) {
  return (
    <div className="gw-winners">
      <h3 className="gw-sub-title">Winners</h3>
      <div className="lb-table-wrap">
        <table className="lb-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>#</th>
              <th>User</th>
              <th className="right">Tickets</th>
              <th className="right">Prize</th>
            </tr>
          </thead>
          <tbody>
            {raffle.winners.map((w) => (
              <tr key={w.place}>
                <td><span className={`rank-pill ${MEDAL[w.place] || ''}`}>{w.place}</span></td>
                <td><div className="user-cell">{maskName(w.name)}</div></td>
                <td className="right"><span className="gw-tickets">{w.tickets.toLocaleString()}</span></td>
                <td className="right"><span className="reward-val">{fmtMoney(w.prize)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {raffle.seed && (
        <details className="gw-fair">
          <summary>Provably fair — verify this draw</summary>
          <p>
            The winning seed was generated and its SHA-256 hash published before
            entries closed, so the result was locked in before the draw. Winners
            are picked one at a time from the ticket pool using{' '}
            <code>HMAC-SHA256(seed, n)</code> for draw&nbsp;<code>n</code>. A player
            stays in the pool after winning and can place twice, then drops out.
          </p>
          <div className="gw-fair-row"><span>Seed hash</span><code>{raffle.seedHash}</code></div>
          <div className="gw-fair-row"><span>Seed</span><code>{raffle.seed}</code></div>
          <div className="gw-fair-row">
            <span>Drawn</span><code>{new Date(raffle.drawnAt).toLocaleString()}</code>
          </div>
        </details>
      )}
    </div>
  )
}

function Entries({ entries, totalTickets, entriesError, updatedAt, wagerPerTicket }) {
  if (entriesError) {
    return <div className="lb-status">Ticket counts are temporarily unavailable — check back shortly.</div>
  }
  if (!entries.length) {
    return (
      <div className="lb-status">
        No tickets yet — be the first. Every {fmtMoney(wagerPerTicket)} wagered under
        code {config.referralCode} earns you one entry.
      </div>
    )
  }

  return (
    <>
      <div className="gw-entries-head">
        <h3 className="gw-sub-title">Entries</h3>
        {updatedAt && (
          <span className="lb-stats-updated">
            Updated {new Date(updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
      </div>
      <div className="lb-table-wrap">
        <table className="lb-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Rank</th>
              <th>User</th>
              <th className="right">Wagered</th>
              <th className="right">Tickets</th>
              <th className="right hide-sm-cell">Win chance</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.name}>
                <td><span className={`rank-pill ${MEDAL[i + 1] || ''}`}>{i + 1}</span></td>
                <td><div className="user-cell">{maskName(e.name)}</div></td>
                <td className="right">
                  <span className="wager-val"><span className="cur">$</span>{fmtMoney(e.wagered, 2).slice(1)}</span>
                </td>
                <td className="right"><span className="gw-tickets">{e.tickets.toLocaleString()}</span></td>
                <td className="right hide-sm-cell">
                  <span className="gw-odds">{pct(e.tickets, totalTickets)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function Raffles() {
  const { current, entries, past, totalTickets, entriesError, updatedAt, loading, error } = useRaffle()
  const phase = rafflePhase(current)

  if (loading) {
    return (
      <section className="section">
        <div className="container"><div className="lb-status">Loading raffle…</div></div>
      </section>
    )
  }

  if (!current) {
    return (
      <section className="section" id="raffles">
        <div className="container">
          <div className="section-head">
            <h2 className="bonus-heading">RAFFLES</h2>
            <p className="bonus-heading-sub">Under code <span>{config.referralCode}</span></p>
          </div>
          <div className="lb-status">
            {error
              ? 'Raffles are temporarily unavailable — check back shortly.'
              : 'No raffle is running right now — the next one will show up here as soon as it starts.'}
          </div>
        </div>
      </section>
    )
  }

  const tiles = [
    { label: 'Prize Pool', value: fmtMoney(current.prizePool), gold: true },
    { label: 'Winners', value: `${current.prizeCount} × ${fmtMoney(current.prizeAmount)}` },
    { label: 'Total Tickets', value: totalTickets.toLocaleString(), gold: true },
    { label: 'Entrants', value: String(entries.length) },
  ]

  return (
    <section className="section" id="raffles">
      <div className="container">
        {/* HEADER */}
        <div className="lb-hero">
          <span className="gw-eyebrow"><IconTicket /> Wager Raffle</span>
          <h1 className="lb-title">
            <span className="grad">{fmtMoney(current.prizePool)}</span> <span className="white">Weekly</span><br />
            <span className="grad">Raffle</span>
          </h1>
          <p className="lb-sub">
            {current.title} · {fmtDate(current.startAt)} → {fmtDate(current.endAt)}
          </p>

          <div className="lb-actions">
            <div className="code-chip">
              <span className="label">CODE:</span>
              <span className="code">{config.referralCode}</span>
            </div>
            <a className="btn btn-primary" href="https://betbolt.com/?r=NSB" target="_blank" rel="noreferrer">
              Wager on BetBolt <IconExternal />
            </a>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="gw-steps">
          <div className="gw-step">
            <span className="gw-step-n">1</span>
            <h4>Play under code {config.referralCode}</h4>
            <p>Sign up on BetBolt with code {config.referralCode} so your wagers are tracked.</p>
          </div>
          <div className="gw-step">
            <span className="gw-step-n">2</span>
            <h4>Earn tickets automatically</h4>
            <p>Every {fmtMoney(current.wagerPerTicket)} wagered during the week = 1 ticket. No cap, no sign-up.</p>
          </div>
          <div className="gw-step">
            <span className="gw-step-n">3</span>
            <h4>{current.prizeCount} winners get {fmtMoney(current.prizeAmount)}</h4>
            <p>Winners are drawn at random from the ticket pool. A player can win up to two prizes.</p>
          </div>
        </div>

        <PhaseBanner phase={phase} raffle={current} />

        {/* STATS */}
        <div className="lb-stats">
          <div className="lb-stats-head">
            <div>
              <div className="lb-stats-eyebrow">
                {phase === 'ended' ? 'Final results' : 'Live raffle stats'}
              </div>
              <h3>{current.title}</h3>
            </div>
            <span className="lb-stats-updated">
              <IconTicket /> {fmtMoney(current.wagerPerTicket)} = 1 ticket
            </span>
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

        {phase === 'ended' && current.winners?.length ? (
          <Winners raffle={current} />
        ) : (
          <Entries
            entries={entries}
            totalTickets={totalTickets}
            entriesError={entriesError}
            updatedAt={updatedAt}
            wagerPerTicket={current.wagerPerTicket}
          />
        )}

        {/* Fairness commitment, shown while the raffle is still open */}
        {phase !== 'ended' && current.seedHash && (
          <p className="gw-commit">
            Provably fair — the winning seed is already locked in.
            Its SHA-256 hash is <code>{current.seedHash.slice(0, 32)}…</code>, and the
            full seed is published here after the draw.
          </p>
        )}

        {/* PAST RAFFLES */}
        {past.length > 0 && (
          <div className="gw-past">
            <h3 className="gw-sub-title">Past raffles</h3>
            {past.map((g) => (
              <div className="winners-card" key={g.id}>
                <div className="winners-card-head">
                  <h3>{g.title}</h3>
                  <span className="wc-pool">{fmtMoney(g.prizePool)} paid out</span>
                </div>
                <div className="lb-table-wrap">
                  <table className="lb-table">
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>#</th>
                        <th>User</th>
                        <th className="right">Tickets</th>
                        <th className="right">Prize</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.winners.map((w) => (
                        <tr key={w.place}>
                          <td><span className={`rank-pill ${MEDAL[w.place] || ''}`}>{w.place}</span></td>
                          <td><div className="user-cell">{maskName(w.name)}</div></td>
                          <td className="right"><span className="gw-tickets">{w.tickets.toLocaleString()}</span></td>
                          <td className="right"><span className="reward-val">{fmtMoney(w.prize)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="section-sub" style={{ textAlign: 'center', marginTop: 22, fontSize: 13 }}>
          Usernames are masked for privacy. Ticket counts update as wagers are processed. 18+ only.
        </p>
      </div>
    </section>
  )
}
