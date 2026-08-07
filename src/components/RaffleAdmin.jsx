import { useEffect, useState } from 'react'
import { fmtMoney, isoToLocal, localToIso } from '../utils'
import { rafflePhase } from '../hooks/useRaffle'

const PHASE_LABEL = {
  draft: { label: 'Draft', cls: 'off' },
  upcoming: { label: 'Scheduled', cls: 'soon' },
  live: { label: 'Live', cls: 'live' },
  'awaiting-draw': { label: 'Needs draw', cls: 'soon' },
  ended: { label: 'Drawn', cls: 'ended' },
}

// A week-long raffle starting at the next 11pm local time — matches the
// cadence of the weekly raffle so a new one is two clicks away.
function blankGiveaway() {
  const start = new Date()
  start.setHours(23, 0, 0, 0)
  if (start <= new Date()) start.setDate(start.getDate() + 1)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return {
    id: null,
    title: 'Weekly $250 Raffle',
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    wagerPerTicket: 100,
    prizeCount: 5,
    prizeAmount: 50,
    status: 'live',
  }
}

function GiveawayForm({ initial, onSave, onCancel, busy }) {
  const [form, setForm] = useState(() => ({
    ...initial,
    startAt: isoToLocal(initial.startAt),
    endAt: isoToLocal(initial.endAt),
  }))
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const pool = (Number(form.prizeCount) || 0) * (Number(form.prizeAmount) || 0)

  const submit = (e) => {
    e.preventDefault()
    onSave({
      id: form.id,
      title: form.title,
      startAt: localToIso(form.startAt),
      endAt: localToIso(form.endAt),
      wagerPerTicket: Number(form.wagerPerTicket),
      prizeCount: Number(form.prizeCount),
      prizeAmount: Number(form.prizeAmount),
      status: form.status,
    })
  }

  return (
    <form className="admin-card gw-form" onSubmit={submit}>
      <div className="admin-card-head">
        <h3>{form.id ? 'Edit raffle' : 'New raffle'}</h3>
        <span className="admin-status live">{fmtMoney(pool)} pool</span>
      </div>

      <label className="admin-label">
        Title
        <input className="admin-input" value={form.title} onChange={set('title')} required />
      </label>

      <div className="gw-form-row">
        <label className="admin-label">
          Starts
          <input className="admin-input" type="datetime-local" value={form.startAt} onChange={set('startAt')} required />
        </label>
        <label className="admin-label">
          Ends
          <input className="admin-input" type="datetime-local" value={form.endAt} onChange={set('endAt')} required />
        </label>
      </div>

      <div className="gw-form-row">
        <label className="admin-label">
          Wager per ticket ($)
          <input className="admin-input" type="number" min="1" step="1" value={form.wagerPerTicket} onChange={set('wagerPerTicket')} required />
        </label>
        <label className="admin-label">
          Winners
          <input className="admin-input" type="number" min="1" max="100" step="1" value={form.prizeCount} onChange={set('prizeCount')} required />
        </label>
        <label className="admin-label">
          Prize each ($)
          <input className="admin-input" type="number" min="1" step="1" value={form.prizeAmount} onChange={set('prizeAmount')} required />
        </label>
      </div>

      <label className="admin-label">
        Status
        <select className="admin-input" value={form.status} onChange={set('status')}>
          <option value="draft">Draft — hidden from the site</option>
          <option value="live">Live — visible on /raffles</option>
        </select>
      </label>

      <p className="admin-utc">
        {form.prizeCount} winners × {fmtMoney(Number(form.prizeAmount) || 0)} ={' '}
        <b>{fmtMoney(pool)}</b> · every {fmtMoney(Number(form.wagerPerTicket) || 0)} wagered = 1 ticket
      </p>

      <div className="gw-actions">
        <button className="btn btn-primary admin-save" type="submit" disabled={busy}>
          {busy ? 'Saving…' : form.id ? 'Save changes' : 'Start raffle'}
        </button>
        {onCancel && (
          <button className="btn btn-ghost admin-save" type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

function GiveawayRow({ raffle, onEdit, onDraw, onStatus, onDelete, busy }) {
  const phase = rafflePhase(raffle)
  const st = PHASE_LABEL[phase] || PHASE_LABEL.draft
  const drawn = Boolean(raffle.drawnAt)

  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3>{raffle.title}</h3>
        <span className={`admin-status ${st.cls}`}>{st.label}</span>
      </div>

      <p className="admin-utc">
        {new Date(raffle.startAt).toLocaleString()} → {new Date(raffle.endAt).toLocaleString()}
      </p>
      <p className="admin-utc">
        {raffle.prizeCount} × {fmtMoney(raffle.prizeAmount)} ={' '}
        <b>{fmtMoney(raffle.prizePool)}</b> · {fmtMoney(raffle.wagerPerTicket)} per ticket
      </p>

      {drawn && (
        <div className="gw-winner-list">
          {raffle.winners.map((w) => (
            <div key={w.place}>
              <b>#{w.place}</b> {w.name} — {w.tickets.toLocaleString()} tickets · {fmtMoney(w.prize)}
            </div>
          ))}
          <p className="admin-utc" style={{ marginTop: 8 }}>
            Drawn {new Date(raffle.drawnAt).toLocaleString()} by {raffle.drawnBy}
          </p>
        </div>
      )}

      <div className="gw-actions">
        <button className="btn btn-ghost admin-save" onClick={() => onEdit(raffle)} disabled={busy}>
          Edit
        </button>

        {raffle.status === 'draft' && (
          <button className="btn btn-primary admin-save" onClick={() => onStatus(raffle, 'live')} disabled={busy}>
            Start
          </button>
        )}

        {!drawn && raffle.status !== 'draft' && (
          <button className="btn btn-primary admin-save" onClick={() => onDraw(raffle, false)} disabled={busy}>
            Draw winners
          </button>
        )}

        {drawn && (
          <button className="btn btn-ghost admin-save" onClick={() => onDraw(raffle, true)} disabled={busy}>
            Redraw
          </button>
        )}

        <button className="btn btn-ghost admin-save danger" onClick={() => onDelete(raffle)} disabled={busy}>
          Delete
        </button>
      </div>
    </div>
  )
}

/** Raffle CRUD + draw controls for the /admin panel. */
export default function GiveawayAdmin() {
  const [all, setAll] = useState(null)
  const [editing, setEditing] = useState(null) // raffle | 'new' | null
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = async () => {
    try {
      const res = await fetch('/api/raffles')
      const data = await res.json()
      setAll(data.all || [])
    } catch {
      setAll([])
    }
  }
  useEffect(() => { load() }, [])

  const post = async (body, okText) => {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/raffles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `request failed (${res.status})`)
      setAll(data.all || [])
      setMsg({ text: okText })
      return true
    } catch (err) {
      setMsg({ err: true, text: err.message })
      return false
    } finally {
      setBusy(false)
    }
  }

  const save = async (raffle) => {
    const ok = await post({ action: 'save', raffle }, 'Raffle saved ✓')
    if (ok) setEditing(null)
  }

  const draw = async (raffle, redraw) => {
    const label = redraw ? 'Redraw' : 'Draw'
    const warning = redraw
      ? `Redraw "${raffle.title}"? The current winners will be replaced and a new seed committed.`
      : `Draw ${raffle.prizeCount} winners for "${raffle.title}"? Entries are frozen at this moment and the result is final.`
    if (!window.confirm(warning)) return
    await post({ action: 'draw', id: raffle.id, redraw }, `${label} complete ✓`)
  }

  const setStatus = (raffle, status) =>
    post({ action: 'status', id: raffle.id, status }, 'Status updated ✓')

  const remove = async (raffle) => {
    if (!window.confirm(`Delete "${raffle.title}"? This cannot be undone.`)) return
    await post({ action: 'delete', id: raffle.id }, 'Raffle deleted ✓')
  }

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2 className="admin-section-title">Raffles</h2>
          <p className="section-sub">
            Run a wager raffle: every $X wagered on BetBolt during the window earns a
            ticket, then draw the winners here. The draw is provably fair — the seed is
            committed when the raffle goes live and published after the draw.
          </p>
        </div>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            + New raffle
          </button>
        )}
      </div>

      {msg && <p className={`admin-msg ${msg.err ? 'err' : ''}`}>{msg.text}</p>}

      {editing && (
        <div className="admin-grid one">
          <GiveawayForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? blankGiveaway() : editing}
            onSave={save}
            onCancel={() => setEditing(null)}
            busy={busy}
          />
        </div>
      )}

      {all === null ? (
        <div className="lb-status">Loading raffles…</div>
      ) : all.length === 0 ? (
        <div className="lb-status">No raffles yet — create one to get started.</div>
      ) : (
        <div className="admin-grid">
          {all.map((g) => (
            <GiveawayRow
              key={g.id}
              raffle={g}
              busy={busy}
              onEdit={setEditing}
              onDraw={draw}
              onStatus={setStatus}
              onDelete={remove}
            />
          ))}
        </div>
      )}
    </div>
  )
}
