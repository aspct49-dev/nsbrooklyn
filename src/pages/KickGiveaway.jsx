import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth, loginUrl } from '../hooks/useAuth'
import { useKickAdmin } from '../hooks/useKickAdmin'
import { useKickChat } from '../hooks/useKickChat'
import { IconDiscord, IconKick, IconExternal } from '../components/icons'
import SpinReel, { EntrantTile } from '../components/SpinReel'

const CHANNEL = 'nsbrooklyntv'

const MISS_LABEL = {
  'not-linked': 'Kick not linked to Discord',
  'not-in-server': 'not in the Discord server',
  'missing-role': 'missing the required role',
  'bot-forbidden': 'role check failed (bot permissions)',
  'role-gate-not-configured': 'role gate not configured',
}

const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

/**
 * Whole-word keyword match, mirroring the server's rule so the browser only
 * posts messages that stand a chance. The server re-checks it regardless —
 * this is a filter, not a decision.
 */
function matchesKeyword(content, keyword) {
  const needle = String(keyword || '').trim().toLowerCase()
  if (!needle) return false
  const text = String(content || '').replace(/\[emote:\d+:[^\]]*\]/gi, ' ').toLowerCase()
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(text)
}

/** Admin-only live picker: open a keyword, watch entries land, spin. */
export default function KickGiveaway() {
  const { loading: authLoading, user, isAdmin } = useAuth()

  const { data, busy, msg, load, post, startPolling, pollMs } = useKickAdmin(isAdmin)
  const [keyword, setKeyword] = useState('!enter')
  const [winnerCount, setWinnerCount] = useState(1)
  const [requireRole, setRequireRole] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [chatroomId, setChatroomId] = useState(null)
  const [chatErr, setChatErr] = useState(null)
  const seenRef = useRef(new Set())

  // The picker reads chat itself, so it needs the chatroom id up front.
  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/kick?chatroom=1')
      .then((r) => r.json())
      .then((j) => (j.chatroomId ? setChatroomId(j.chatroomId) : setChatErr(j.error)))
      .catch((e) => setChatErr(e.message))
  }, [isAdmin])

  const s = data?.session
  const entries = data?.entries || []
  const misses = data?.misses || []
  const messages = data?.messages || {}
  const collecting = Boolean(s?.open)
  const drawn = Boolean(s?.drawnAt)

  // Poll while entries can still arrive, and after a draw so the winner's
  // chat shows up.
  useEffect(() => {
    startPolling(collecting || (drawn && revealed))
  }, [collecting, drawn, revealed, startPolling])

  useEffect(() => { if (s?.keyword) setKeyword(s.keyword) }, [s?.keyword])

  // Filter in the browser so we aren't posting every message, but the server
  // re-checks the keyword and eligibility — the client decides nothing.
  const onChat = useCallback(async (m) => {
    if (!s?.open || !s.keyword) return
    if (!matchesKeyword(m.content, s.keyword)) return
    if (seenRef.current.has(m.kickUserId)) return
    seenRef.current.add(m.kickUserId)
    try {
      await fetch('/api/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat-entry', ...m }),
      })
      load()
    } catch {
      seenRef.current.delete(m.kickUserId) // let them try again
    }
  }, [s?.open, s?.keyword, load])

  const { connected, seen: chatSeen } = useKickChat({ chatroomId, active: collecting, onMessage: onChat })

  // a fresh round means a fresh set of who we've already sent
  useEffect(() => { seenRef.current = new Set() }, [s?.openedAt])

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
            <span className={`kgw-state ${collecting && connected ? 'on' : ''}`}>
              <span className="dot" />
              {!collecting ? 'IDLE' : connected ? `COLLECTING · ${s.keyword}` : 'CONNECTING…'}
            </span>
            {collecting && connected && (
              <span className="kgw-seen" title="Chat messages seen on the socket">
                {chatSeen} msg{chatSeen === 1 ? '' : 's'} seen
              </span>
            )}
            {collecting && (
              <button className="kgw-btn ghost" onClick={() => post({ action: 'close' }, 'Entries closed')} disabled={busy}>
                STOP
              </button>
            )}
          </div>
        </div>

        {msg && <p className={`admin-msg ${msg.err ? 'err' : ''}`}>{msg.text}</p>}

        {/* Delivery problems look exactly like "nobody entered", so they are
            stated plainly — including WHICH channel is subscribed, since a
            subscription for the wrong channel is the failure that otherwise
            looks perfectly healthy. */}
        {data?.subscription && !data.subscription.ok && (
          <div className="kgw-alert">
            {data.subscription.reason === 'wrong-channel' ? (
              <>
                <b>Chat is connected to the WRONG channel</b>
                <p>
                  Kick is delivering chat for broadcaster{' '}
                  <code>{(data.subscription.subscribedTo || []).join(', ')}</code>, but this
                  picker watches <b>{data.subscription.channel}</b> (id{' '}
                  <code>{data.subscription.broadcasterId}</code>). A subscription belongs to
                  whichever Kick account authorised it, so it has to be granted by the{' '}
                  <b>{data.subscription.channel}</b> account itself.
                </p>
                <p>
                  <a href="/api/kick?start=1&broadcaster=1">Connect chat as {data.subscription.channel}</a>
                  {' · '}
                  <button className="kgw-linkbtn" onClick={() => post({ action: 'clear-subscriptions' }, 'Stale subscriptions removed')}>
                    remove the wrong subscription
                  </button>
                </p>
              </>
            ) : (
              <>
                <b>Kick chat delivery is OFF</b>
                <p>
                  Kick isn't sending chat here, so nothing can be collected. Setting a
                  webhook URL isn't enough on its own — a subscription has to be granted
                  by the channel owner.
                </p>
                <p>
                  <a href="/api/kick?start=1&broadcaster=1">Connect chat as the broadcaster</a>
                  {' — sign in to Kick as '}
                  <b>{data.subscription.channel || 'your channel'}</b> when it asks.
                  {data.subscription.error && <><br /><small>({data.subscription.error})</small></>}
                </p>
              </>
            )}
          </div>
        )}
        {data?.subscription?.ok && (
          <p className="kgw-subok">
            ✓ Kick chat delivery is live for <b>{data.subscription.channel || 'this app'}</b>
            {data.subscription.warn && <> — {data.subscription.warn}</>}
          </p>
        )}

        {/* Whether Kick is talking to us at all. "No chat events yet" versus
            "arriving but rejected" are completely different problems, and
            without this they look identical from here. */}
        {collecting && connected && chatSeen === 0 && (
          <div className="kgw-hits none">
            Connected to <b>chatrooms.{chatroomId}</b> but no chat has come through yet.
            If your chat is active and this stays at zero, the chatroom id is wrong —
            check <code>KICK_CHATROOM_ID</code>.
          </div>
        )}
        {chatErr && <div className="kgw-alert"><b>Can't reach the chat room</b><p>{chatErr}</p></div>}

        {data?.hits && (
          <div className={`kgw-hits ${data.hits.count ? '' : 'none'}`}>
            {data.hits.count ? (
              <>
                <b>{data.hits.count}</b> chat events received · last{' '}
                {new Date(data.hits.lastAt).toLocaleTimeString()}
                <details>
                  <summary>recent</summary>
                  {data.hits.recent.map((h, i) => (
                    <div key={i}>
                      {time(h.at)} · <b>{h.outcome}</b>
                      {h.from ? ` · ${h.from}` : ''}{h.detail ? ` · ${h.detail}` : ''}
                    </div>
                  ))}
                </details>
              </>
            ) : (
              <>
                <b>No chat events have ever reached the site.</b> Kick isn't delivering,
                so the problem is on the Kick side rather than here — check the app's
                webhook URL is exactly{' '}
                <code>https://www.usecodensb.gg/api/kick/webhook</code> and that webhooks
                are enabled.
              </>
            )}
          </div>
        )}

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
