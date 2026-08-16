import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth, loginUrl } from '../hooks/useAuth'
import { IconDiscord, IconKick, IconTrophy } from '../components/icons'

const POLL_MS = 4000

const MISS_LABEL = {
  'not-linked': 'Kick not linked to Discord',
  'not-in-server': 'not in the Discord server',
  'missing-role': 'missing the required role',
  'bot-forbidden': 'role check failed (bot permissions)',
  'role-gate-not-configured': 'role gate not configured',
}

const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })

/** Admin-only live picker: open a keyword, watch entries land, draw. */
export default function KickGiveaway() {
  const { loading: authLoading, user, isAdmin } = useAuth()

  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [form, setForm] = useState({ keyword: '!enter', winnerCount: 1, prize: '', requireRole: true })
  const pollRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/kick?admin=1')
      if (!res.ok) return
      setData(await res.json())
    } catch { /* transient — the poll will retry */ }
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

  useEffect(() => {
    if (!isAdmin) return undefined
    load()
    return () => clearInterval(pollRef.current)
  }, [isAdmin, load])

  // Poll only while entries can actually arrive — no point hammering it
  // once the round is closed.
  const open = Boolean(data?.session?.open)
  useEffect(() => {
    clearInterval(pollRef.current)
    if (open) pollRef.current = setInterval(load, POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [open, load])

  if (authLoading) return <section className="section"><div className="container admin-gate">Loading…</div></section>
  if (!user) {
    return (
      <section className="section">
        <div className="container admin-gate">
          <h1 className="section-title">Kick Giveaway</h1>
          <p className="section-sub">Log in with Discord to continue.</p>
          <a className="btn btn-primary admin-login" href={loginUrl}><IconDiscord /> Login with Discord</a>
        </div>
      </section>
    )
  }
  if (!isAdmin) {
    return (
      <section className="section">
        <div className="container admin-gate">
          <h1 className="section-title">Kick Giveaway</h1>
          <p className="section-sub">Logged in as <b>{user.name}</b> — this account is not an admin.</p>
        </div>
      </section>
    )
  }

  const s = data?.session
  const entries = data?.entries || []
  const misses = data?.misses || []
  const drawn = Boolean(s?.drawnAt)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const start = () => post({
    action: 'open',
    keyword: form.keyword,
    winnerCount: Number(form.winnerCount),
    prize: form.prize,
    requireRole: form.requireRole,
  }, 'Giveaway open — entries are being collected')

  return (
    <section className="section" id="kick-giveaway">
      <div className="container">
        <div className="admin-head">
          <h1 className="section-title">Kick Giveaway</h1>
          <p className="section-sub">
            Open a keyword and viewers who type it in your Kick chat are entered
            automatically — as long as they've linked Kick to Discord on the site.
          </p>
        </div>

        {msg && <p className={`admin-msg ${msg.err ? 'err' : ''}`}>{msg.text}</p>}

        {data && !data.roleGate && s?.requireRole && (
          <p className="admin-msg err">
            Role checking isn't configured on the server, so nobody can pass the role
            requirement. Set DISCORD_BOT_TOKEN, DISCORD_GUILD_ID and
            DISCORD_REQUIRED_ROLE_IDS, or turn the requirement off.
          </p>
        )}

        <div className="kgw-grid">
          {/* ---------------------------------------------- control panel */}
          <div className="admin-card">
            <div className="admin-card-head">
              <h3>{s?.open ? 'Collecting entries' : 'Set up a round'}</h3>
              <span className={`admin-status ${s?.open ? 'live' : drawn ? 'ended' : 'off'}`}>
                {s?.open ? 'Open' : drawn ? 'Drawn' : 'Closed'}
              </span>
            </div>

            {s?.open ? (
              <>
                <div className="kgw-live">
                  <div className="kgw-keyword"><IconKick /> <code>{s.keyword}</code></div>
                  <p className="admin-utc">
                    Opened {time(s.openedAt)} by {s.openedBy}
                    {s.requireRole ? ' · Discord role required' : ' · no role required'}
                    {s.prize ? ` · ${s.prize}` : ''}
                  </p>
                </div>
                <div className="gw-actions">
                  <button className="btn btn-ghost admin-save" onClick={() => post({ action: 'close' }, 'Entries closed')} disabled={busy}>
                    Close entries
                  </button>
                  <button
                    className="btn btn-primary admin-save"
                    onClick={() => post({ action: 'draw', winnerCount: s.winnerCount }, 'Winners drawn ✓')}
                    disabled={busy || !entries.length}
                  >
                    Draw {s.winnerCount > 1 ? `${s.winnerCount} winners` : 'winner'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <label className="admin-label">
                  Chat keyword
                  <input className="admin-input" value={form.keyword} onChange={set('keyword')} placeholder="!enter" maxLength={40} />
                </label>
                <div className="gw-form-row">
                  <label className="admin-label">
                    Winners
                    <input className="admin-input" type="number" min="1" max="100" value={form.winnerCount} onChange={set('winnerCount')} />
                  </label>
                  <label className="admin-label">
                    Prize (optional)
                    <input className="admin-input" value={form.prize} onChange={set('prize')} placeholder="$50 Cash" maxLength={120} />
                  </label>
                </div>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={form.requireRole}
                    onChange={(e) => setForm((f) => ({ ...f, requireRole: e.target.checked }))}
                  />
                  <span>
                    Require the Discord role
                    <small>
                      Off means anyone with Kick linked to Discord can enter. On also
                      requires the role set in DISCORD_REQUIRED_ROLE_IDS.
                    </small>
                  </span>
                </label>

                <div className="gw-actions">
                  <button className="btn btn-primary admin-save" onClick={start} disabled={busy}>
                    Open giveaway
                  </button>
                  {(entries.length > 0 || drawn) && (
                    <button
                      className="btn btn-ghost admin-save danger"
                      disabled={busy}
                      onClick={() => window.confirm('Clear all entries and results?') && post({ action: 'clear' }, 'Cleared')}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="admin-utc" style={{ marginTop: 10 }}>
                  Opening a round clears the previous entries, so nobody carries over
                  from the last keyword.
                </p>
              </>
            )}
          </div>

          {/* ------------------------------------------------------ stats */}
          <div className="admin-card kgw-stats">
            <div className="kgw-count">
              <span className="n">{data ? entries.length : '—'}</span>
              <span className="l">Entries</span>
            </div>
            {misses.length > 0 && (
              <div className="kgw-count muted">
                <span className="n">{misses.length}</span>
                <span className="l">Not eligible</span>
              </div>
            )}
            {s?.open && <p className="admin-utc">Updating every {POLL_MS / 1000}s…</p>}
          </div>
        </div>

        {/* -------------------------------------------------------- winners */}
        {drawn && s.winners?.length > 0 && (
          <div className="admin-card kgw-winners">
            <div className="admin-card-head">
              <h3><IconTrophy /> {s.winners.length > 1 ? 'Winners' : 'Winner'}</h3>
              <span className="admin-status ended">from {s.entrantsAtDraw} entries</span>
            </div>
            {s.winners.map((w) => (
              <div className="gw-winner-row" key={w.place}>
                <span>
                  <b>#{w.place}</b> {w.discordName}
                  <span className="admin-utc"> · Kick: {w.kickName}</span>
                </span>
                <button
                  className="gw-reroll"
                  disabled={busy}
                  onClick={() => window.confirm(`Replace ${w.discordName} at #${w.place}?`) &&
                    post({ action: 'redraw-place', place: w.place }, `Place #${w.place} redrawn ✓`)}
                >
                  Redraw
                </button>
              </div>
            ))}
            {s.redraws?.length > 0 && (
              <p className="admin-utc" style={{ marginTop: 10 }}>
                {s.redraws.map((r) => (
                  <span key={`${r.place}-${r.at}`} style={{ display: 'block' }}>
                    #{r.place}: {r.removed} → {r.replacedWith} · {time(r.at)} by {r.by}
                  </span>
                ))}
              </p>
            )}
            <p className="admin-utc" style={{ marginTop: 8 }}>
              Drawn {new Date(s.drawnAt).toLocaleString()} by {s.drawnBy} · seed{' '}
              <code className="kgw-seed">{s.seed}</code>
            </p>
          </div>
        )}

        {/* -------------------------------------------------------- entries */}
        <div className="admin-card kgw-list">
          <div className="admin-card-head">
            <h3>Entries</h3>
            {s?.keyword && <span className="admin-status off">{s.keyword}</span>}
          </div>
          {entries.length === 0 ? (
            <p className="admin-utc">
              {s?.open
                ? `Nobody has typed ${s.keyword} yet.`
                : 'No entries — open a round to start collecting.'}
            </p>
          ) : (
            <div className="gw-winner-list">
              {entries.map((e) => (
                <div key={e.discordId}>
                  <b>{e.kickName}</b>
                  <span className="admin-utc"> → {e.discordName} · {time(e.at)}</span>
                </div>
              ))}
            </div>
          )}

          {misses.length > 0 && (
            <>
              <p className="admin-utc" style={{ marginTop: 14 }}>
                <b>{misses.length}</b> typed the keyword but couldn't be entered:
              </p>
              <div className="gw-winner-list">
                {misses.map((m) => (
                  <div key={m.kickName + m.at}>
                    {m.kickName}
                    <span className="admin-utc"> · {MISS_LABEL[m.reason] || m.reason} · {time(m.at)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
