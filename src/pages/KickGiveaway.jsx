import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth, loginUrl } from '../hooks/useAuth'
import { IconDiscord, IconKick, IconExternal } from '../components/icons'
import SpinReel, { EntrantTile } from '../components/SpinReel'

const POLL_MS = 3000
const CHANNEL = 'nsbrooklyntv'

const MISS_LABEL = {
  'not-linked': 'Kick not linked to Discord',
  'not-in-server': 'not in the Discord server',
  'missing-role': 'missing the required role',
  'bot-forbidden': 'role check failed (bot permissions)',
  'role-gate-not-configured': 'role gate not configured',
}

const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

/** Admin-only live picker: open a keyword, watch entries land, spin. */
export default function KickGiveaway() {
  const { loading: authLoading, user, isAdmin } = useAuth()

  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [keyword, setKeyword] = useState('!enter')
  const [winnerCount, setWinnerCount] = useState(1)
  const [requireRole, setRequireRole] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const pollRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/kick?admin=1')
      if (res.ok) setData(await res.json())
    } catch { /* transient — the poll retries */ }
  }, [])

  const post = async (body, okText) => {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || `request failed (${res.status})`)
      setData(json)
      if (okText) setMsg({ text: okText })
      return json
    } catch (err) {
      setMsg({ err: true, text: err.message })
      return null
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  const s = data?.session
  const entries = data?.entries || []
  const misses = data?.misses || []
  const messages = data?.messages || {}
  const collecting = Boolean(s?.open)
  const drawn = Boolean(s?.drawnAt)

  // Poll while entries can still arrive, and briefly after a draw so the
  // winner's chat shows up.
  useEffect(() => {
    clearInterval(pollRef.current)
    if (collecting || (drawn && revealed)) pollRef.current = setInterval(load, POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [collecting, drawn, revealed, load])

  useEffect(() => { if (s?.keyword) setKeyword(s.keyword) }, [s?.keyword])

  if (authLoading) return <section className="section"><div className="container admin-gate">Loading…</div></section>
  if (!user) {
    return (
      <section className="section"><div className="container admin-gate">
        <h1 className="section-title">Kick Giveaway</h1>
        <p className="section-sub">Log in with Discord to continue.</p>
        <a className="btn btn-primary admin-login" href={loginUrl}><IconDiscord /> Login with Discord</a>
      </div></section>
    )
  }
  if (!isAdmin) {
    return (
      <section className="section"><div className="container admin-gate">
        <h1 className="section-title">Kick Giveaway</h1>
        <p className="section-sub">Logged in as <b>{user.name}</b> — this account is not an admin.</p>
      </div></section>
    )
  }

  const start = () => {
    setRevealed(false)
    post({ action: 'open', keyword, winnerCount: Number(winnerCount), requireRole }, 'Collecting entries')
  }

  const spin = async () => {
    const res = await post({ action: 'draw', winnerCount: Number(winnerCount) })
    if (!res) return
    setRevealed(false)
    setSpinning(true)
  }

  const clearAll = () => {
    if (!window.confirm('Clear all entries and the current result?')) return
    setSpinning(false)
    setRevealed(false)
    post({ action: 'clear' }, 'Cleared')
  }

  const winner = s?.winners?.[0] || null
  const winnerChat = winner ? messages[String(winner.kickId)]?.messages || [] : []

  return (
    <section className="section kgw" id="kick-giveaway">
      <div className="container">
        {/* ------------------------------------------------------- header */}
        <div className="kgw-bar">
          <div className="kgw-bar-brand">
            <span className="kgw-bar-logo"><IconKick /></span>
            <span className="kgw-bar-url">kick.com/ <b>{CHANNEL}</b></span>
          </div>
          <div className="kgw-bar-right">
            <span className={`kgw-state ${collecting ? 'on' : ''}`}>
              <span className="dot" />
              {collecting ? `COLLECTING · ${s.keyword}` : 'IDLE'}
            </span>
            {collecting && (
              <button className="kgw-btn ghost" onClick={() => post({ action: 'close' }, 'Entries closed')} disabled={busy}>
                STOP
              </button>
            )}
          </div>
        </div>

        {msg && <p className={`admin-msg ${msg.err ? 'err' : ''}`}>{msg.text}</p>}
        {data && !data.roleGate && requireRole && (
          <p className="admin-msg err">
            Role checking isn't configured on the server — nobody could pass it. Set the
            Discord bot env vars, or untick the role requirement.
          </p>
        )}

        <div className="kgw-layout">
          {/* ----------------------------------------------------- controls */}
          <aside className="kgw-side">
            <div className="kgw-panel">
              <h4 className="kgw-panel-title">Controls</h4>

              <label className="kgw-label">Entry keyword</label>
              <input
                className="kgw-input"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="!enter"
                maxLength={40}
                disabled={collecting}
              />

              <div className="kgw-two">
                <div>
                  <label className="kgw-label">Winners</label>
                  <input
                    className="kgw-input"
                    type="number" min="1" max="100"
                    value={winnerCount}
                    onChange={(e) => setWinnerCount(e.target.value)}
                    disabled={collecting}
                  />
                </div>
                <label className="kgw-toggle">
                  <input
                    type="checkbox"
                    checked={requireRole}
                    onChange={(e) => setRequireRole(e.target.checked)}
                    disabled={collecting}
                  />
                  <span>Certified<br /><small>role required</small></span>
                </label>
              </div>

              <button className="kgw-btn" onClick={start} disabled={busy || collecting}>
                <span className="dot" /> START COLLECTING
              </button>

              <button className="kgw-btn go" onClick={spin} disabled={busy || spinning || !entries.length}>
                {spinning ? 'SPINNING…' : `SPIN (${entries.length} ${entries.length === 1 ? 'ENTRY' : 'ENTRIES'})`}
              </button>

              <button className="kgw-btn ghost" onClick={clearAll} disabled={busy}>CLEAR ALL</button>
            </div>

            <div className="kgw-panel">
              <h4 className="kgw-panel-title">
                Entries <span className="kgw-count-badge">{entries.length}</span>
              </h4>
              {entries.length === 0 ? (
                <p className="kgw-empty">
                  {collecting ? `Waiting for ${s.keyword}…` : 'Start collecting to gather entries.'}
                </p>
              ) : (
                <div className="kgw-entries">
                  {entries.map((e) => (
                    <div className="kgw-entry" key={e.discordId} title={`Discord: ${e.discordName}`}>
                      <EntrantTile entrant={e} size={26} />
                      <span>{e.kickName}</span>
                    </div>
                  ))}
                </div>
              )}
              {misses.length > 0 && (
                <details className="kgw-misses">
                  <summary>{misses.length} not eligible</summary>
                  {misses.map((m) => (
                    <div key={m.kickName + m.at}>
                      {m.kickName} <small>{MISS_LABEL[m.reason] || m.reason}</small>
                    </div>
                  ))}
                </details>
              )}
            </div>
          </aside>

          {/* -------------------------------------------------------- stage */}
          <div className="kgw-stage">
            <div className="kgw-panel reel-panel">
              <SpinReel
                entrants={entries}
                winner={winner}
                spinning={spinning}
                onDone={() => { setSpinning(false); setRevealed(true); load() }}
              />
            </div>

            {drawn && revealed && winner && (
              <div className="kgw-panel winner-panel">
                <div className="kgw-winner">
                  <EntrantTile entrant={winner} size={62} />
                  <div className="kgw-winner-text">
                    <span className="kgw-winner-lbl">🏆 Winner</span>
                    <span className="kgw-winner-name">{winner.kickName}</span>
                    <span className="kgw-winner-sub">Discord: {winner.discordName}</span>
                  </div>
                  <a
                    className="kgw-btn ghost view"
                    href={`https://kick.com/${winner.kickName}`}
                    target="_blank" rel="noreferrer"
                  >
                    VIEW PROFILE <IconExternal />
                  </a>
                </div>

                {s.winners.length > 1 && (
                  <div className="kgw-others">
                    {s.winners.slice(1).map((w) => (
                      <span key={w.place}><b>#{w.place}</b> {w.kickName}</span>
                    ))}
                  </div>
                )}

                <div className="gw-actions">
                  {s.winners.map((w) => (
                    <button
                      key={w.place}
                      className="gw-reroll"
                      disabled={busy}
                      onClick={() => window.confirm(`Replace ${w.kickName} at #${w.place}?`) &&
                        post({ action: 'redraw-place', place: w.place }, `#${w.place} redrawn`)}
                    >
                      Redraw #{w.place}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {drawn && revealed && winner && (
              <div className="kgw-panel">
                <h4 className="kgw-panel-title">{winner.kickName}'s recent messages</h4>
                {winnerChat.length === 0 ? (
                  <p className="kgw-empty">Waiting for {winner.kickName} to chat…</p>
                ) : (
                  <div className="kgw-chat">
                    {winnerChat.map((m, i) => (
                      <div key={i}><span className="t">{time(m.at)}</span> {m.text}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {drawn && revealed && s.seed && (
              <p className="kgw-fair">
                Provably fair — winner decided server-side before the spin.
                Seed <code>{s.seed.slice(0, 24)}…</code> · drawn from {s.entrantsAtDraw} entries
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
