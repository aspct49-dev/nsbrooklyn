import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { config } from '../data/leaderboard'
import { useGiveaways } from '../hooks/useGiveaways'
import { loginUrl } from '../hooks/useAuth'
import { initials } from '../utils'
import Countdown from '../components/Countdown'
import { IconGift, IconDiscord, IconTrophy } from '../components/icons'
import KickLinkPanel from '../components/KickLinkPanel'

const fmtDate = (iso) =>
  new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })

function Avatar({ user, size }) {
  const style = size ? { width: size, height: size } : undefined
  return user.avatar
    ? <img className="gv-avatar" src={user.avatar} alt="" style={style} />
    : <span className="gv-avatar gv-avatar-fallback" style={style}>{initials(user.name)}</span>
}

/** The button (or explanation) in the entry slot, per phase and login state. */
function EntryControl({ giveaway, user, onEnter, busy, error, discordUrl }) {
  if (giveaway.phase === 'upcoming') {
    return <div className="gv-note">Entries open {fmtDate(giveaway.startAt)}</div>
  }
  if (giveaway.phase === 'awaiting-draw') {
    return <div className="gv-note">🎲 Entries are closed — the winner is being drawn!</div>
  }
  if (!user) {
    return (
      <>
        <a className="gv-enter discord" href={loginUrl}>
          <IconDiscord /> Log in with Discord to enter
        </a>
        <div className="gv-note">One entry per Discord account. It's free.</div>
      </>
    )
  }
  // Say up front that they can't enter, rather than letting them click and
  // bounce off a refusal.
  if (giveaway.requireRole && user.hasRole === false) {
    return (
      <>
        <div className="gv-locked">🔒 Certified role required</div>
        <div className="gv-note">
          This one is for Certified members of the Discord. Join the server and pick
          up the role, then come back — your entry will work straight away.
        </div>
        {discordUrl && (
          <a className="gv-enter discord" href={discordUrl} target="_blank" rel="noreferrer" style={{ marginTop: 10 }}>
            <IconDiscord /> Open Discord
          </a>
        )}
      </>
    )
  }

  if (giveaway.entered) {
    return (
      <>
        <div className="gv-entered">✓ You're entered</div>
        <div className="gv-note">Good luck — the winner is drawn when the timer hits zero.</div>
      </>
    )
  }
  return (
    <>
      <button className="gv-enter" onClick={() => onEnter(giveaway.id)} disabled={busy}>
        <IconGift /> {busy ? 'Entering…' : 'Enter giveaway'}
      </button>
      <div className="gv-note">
        Entering as <b>{user.name}</b> · one entry per account
      </div>
      {error && <div className="gv-note err">{error}</div>}
    </>
  )
}

function WinnerList({ giveaway, user }) {
  return (
    <div className="gv-winners">
      <div className="gv-winners-lbl">
        <IconTrophy /> {giveaway.winners.length > 1 ? 'Winners' : 'Winner'}
      </div>
      {giveaway.winners.map((w) => (
        <div className={`gv-winner ${w.id === user?.id ? 'you' : ''}`} key={w.place}>
          <Avatar user={w} size={44} />
          <div>
            <div className="gv-winner-name">
              {w.name}
              {w.id === user?.id && <span className="gv-you">That's you!</span>}
            </div>
            <div className="gv-winner-prize">Won {giveaway.prize}</div>
          </div>
          {giveaway.winners.length > 1 && <span className="gv-place">#{w.place}</span>}
        </div>
      ))}
      <p className="gv-note">
        Drawn {new Date(giveaway.drawnAt).toLocaleString()} from {giveaway.entrantsAtDraw}{' '}
        {giveaway.entrantsAtDraw === 1 ? 'entrant' : 'entrants'}. Winners are contacted on Discord.
      </p>
      {giveaway.seed && (
        <details className="gw-fair">
          <summary>Provably fair — verify this draw</summary>
          <p>
            The seed was generated and its SHA-256 hash published before entries
            closed, so the result was locked in beforehand. Winners are picked from
            the entrant list using <code>HMAC-SHA256(seed, n)</code> for draw&nbsp;
            <code>n</code>, without replacement.
          </p>
          <div className="gw-fair-row"><span>Seed hash</span><code>{giveaway.seedHash}</code></div>
          <div className="gw-fair-row"><span>Seed</span><code>{giveaway.seed}</code></div>

          {/* Any place replaced after the fact, stated openly — the seed above
              still proves every place that wasn't redrawn. */}
          {giveaway.redraws?.length > 0 && (
            <>
              <p>
                {giveaway.redraws.length === 1 ? 'One place was' : `${giveaway.redraws.length} places were`}{' '}
                redrawn after the original draw, because the winner was ineligible
                or unreachable. Each replacement was drawn from the same entrant
                list under its own seed.
              </p>
              {giveaway.redraws.map((r) => (
                <div className="gw-fair-row" key={`${r.place}-${r.at}`}>
                  <span>Place #{r.place}</span>
                  <code>{r.removed} → {r.replacedWith} · {new Date(r.at).toLocaleString()} · seed {r.seed}</code>
                </div>
              ))}
            </>
          )}
        </details>
      )}
    </div>
  )
}

function GiveawayCard({ giveaway, user, onEnter, busy, error, past, discordUrl }) {
  return (
    <div className={`gv-card ${past ? 'past' : ''} ${giveaway.entered ? 'is-entered' : ''}`}>
      <div className="gv-card-head">
        <div>
          <h3 className="gv-title">{giveaway.title}</h3>
          {giveaway.description && <p className="gv-desc">{giveaway.description}</p>}
        </div>
        <div className="gv-prize">
          {giveaway.requireRole && <span className="gv-req">Certified only</span>}
          <span className="gv-prize-lbl">Prize</span>
          <span className="gv-prize-val">{giveaway.prize}</span>
          {giveaway.winnerCount > 1 && (
            <span className="gv-prize-lbl">×{giveaway.winnerCount} winners</span>
          )}
        </div>
      </div>

      <div className="gv-meta">
        <span><b>{giveaway.entrants}</b> {giveaway.entrants === 1 ? 'entry' : 'entries'}</span>
        <span>
          {giveaway.phase === 'ended'
            ? `Ended ${fmtDate(giveaway.endAt)}`
            : `Closes ${fmtDate(giveaway.endAt)}`}
        </span>
      </div>

      {giveaway.phase === 'ended' ? (
        <WinnerList giveaway={giveaway} user={user} />
      ) : (
        <>
          {giveaway.phase === 'live' && (
            <div className="gv-countdown">
              <Countdown
                endDate={giveaway.endAt}
                endedLabel="🎲 Entries are closed — the winner is being drawn!"
              />
            </div>
          )}
          <div className="gv-entry">
            <EntryControl
              giveaway={giveaway}
              user={user}
              onEnter={onEnter}
              busy={busy}
              error={error}
              discordUrl={discordUrl}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default function Giveaways() {
  const { active, past, user, loading, error, enter } = useGiveaways()
  const [busyId, setBusyId] = useState(null)
  const [enterError, setEnterError] = useState(null)

  // Feedback from the Kick OAuth round-trip, which comes back as ?kick=...
  const params = new URLSearchParams(useLocation().search)
  const kickResult = params.get('kick')
  const kickName = params.get('name')
  const kickReason = params.get('reason')


  const onEnter = async (id) => {
    setBusyId(id)
    setEnterError(null)
    try {
      await enter(id)
    } catch (err) {
      setEnterError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="section" id="giveaways">
      <div className="container">
        <div className="section-head">
          <h2 className="bonus-heading">DAILY GIVEAWAYS</h2>
          <p className="bonus-heading-sub">
            Hosted by <span>{config.brandName}</span> · log in with Discord to enter
          </p>
        </div>

        {kickResult === 'linked' && (
          <div className="kick-flash ok">Kick account <b>{kickName}</b> linked — chat entries will now count.</div>
        )}
        {kickResult === 'error' && (
          <div className="kick-flash err">{kickReason || 'Could not link your Kick account.'}</div>
        )}

        <KickLinkPanel user={user} discordUrl={config.socials.discord} />

        {loading ? (
          <div className="lb-status">Loading giveaways…</div>
        ) : error ? (
          <div className="lb-status">Giveaways are temporarily unavailable — check back shortly.</div>
        ) : active.length === 0 && past.length === 0 ? (
          <div className="lb-status">
            No giveaways running right now — a new one is posted most days here and
            announced in the{' '}
            <a href={config.socials.discord} target="_blank" rel="noreferrer">Discord</a>.
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="gv-list">
                {active.map((g) => (
                  <GiveawayCard
                    key={g.id}
                    giveaway={g}
                    user={user}
                    onEnter={onEnter}
                    busy={busyId === g.id}
                    error={busyId === null && enterError ? enterError : null}
                    discordUrl={config.socials.discord}
                  />
                ))}
              </div>
            )}

            {active.length === 0 && (
              <div className="lb-status">
                No giveaway is open right now — the next one goes up shortly, so check
                back tomorrow.
              </div>
            )}

            {past.length > 0 && (
              <>
                <h3 className="gw-sub-title gv-past-title">Past giveaways</h3>
                <div className="gv-list">
                  {past.map((g) => (
                    <GiveawayCard key={g.id} giveaway={g} user={user} past />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <p className="section-sub" style={{ textAlign: 'center', marginTop: 22, fontSize: 13 }}>
          One entry per Discord account. Multi-accounting voids all entries. Winners are
          contacted on Discord — make sure your DMs are open. 18+ only.
        </p>
      </div>
    </section>
  )
}
