import { useEffect, useState } from 'react'
import { isoToLocal, localToIso } from '../utils'

const PHASE_LABEL = {
  draft: { label: 'Draft', cls: 'off' },
  upcoming: { label: 'Scheduled', cls: 'soon' },
  live: { label: 'Open', cls: 'live' },
  'awaiting-draw': { label: 'Needs draw', cls: 'soon' },
  ended: { label: 'Drawn', cls: 'ended' },
}

// A giveaway closing 24h from now — the common case, one click away.
function blankGiveaway() {
  const end = new Date(Date.now() + 24 * 3600 * 1000)
  end.setMinutes(0, 0, 0)
  return {
    id: null,
    title: '',
    prize: '',
    description: '',
    startAt: null,
    endAt: end.toISOString(),
    winnerCount: 1,
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

  const submit = (e) => {
    e.preventDefault()
    onSave({
      id: form.id,
      title: form.title,
      prize: form.prize,
      description: form.description,
      startAt: form.startAt ? localToIso(form.startAt) : null,
      endAt: localToIso(form.endAt),
      winnerCount: Number(form.winnerCount),
      status: form.status,
    })
  }

  return (
    <form className="admin-card gw-form" onSubmit={submit}>
      <div className="admin-card-head">
        <h3>{form.id ? 'Edit giveaway' : 'New giveaway'}</h3>
      </div>

      <label className="admin-label">
        Title
        <input
          className="admin-input"
          value={form.title}
          onChange={set('title')}
          placeholder="e.g. $50 Cash Giveaway"
          maxLength={120}
          required
        />
      </label>

      <label className="admin-label">
        Prize — shown on the card
        <input
          className="admin-input"
          value={form.prize}
          onChange={set('prize')}
          placeholder="e.g. $50 Cash, 1x Nitro, $25 BetBolt balance"
          maxLength={120}
          required
        />
      </label>

      <label className="admin-label">
        Description (optional)
        <input
          className="admin-input"
          value={form.description}
          onChange={set('description')}
          placeholder="Any extra details or requirements"
          maxLength={500}
        />
      </label>

      <div className="gw-form-row">
        <label className="admin-label">
          Opens (optional — blank = now)
          <input className="admin-input" type="datetime-local" value={form.startAt} onChange={set('startAt')} />
        </label>
        <label className="admin-label">
          Closes
          <input className="admin-input" type="datetime-local" value={form.endAt} onChange={set('endAt')} required />
        </label>
        <label className="admin-label">
          Winners
          <input className="admin-input" type="number" min="1" max="100" step="1" value={form.winnerCount} onChange={set('winnerCount')} required />
        </label>
      </div>

      <label className="admin-label">
        Status
        <select className="admin-input" value={form.status} onChange={set('status')}>
          <option value="draft">Draft — hidden from the site</option>
          <option value="live">Published — visible on /giveaways</option>
        </select>
      </label>

      <div className="gw-actions">
        <button className="btn btn-primary admin-save" type="submit" disabled={busy}>
          {busy ? 'Saving…' : form.id ? 'Save changes' : 'Publish giveaway'}
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

function GiveawayRow({ giveaway, onEdit, onDraw, onStatus, onDelete, onEntries, busy }) {
  const st = PHASE_LABEL[giveaway.phase] || PHASE_LABEL.draft
  const drawn = Boolean(giveaway.drawnAt)

  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3>{giveaway.title}</h3>
        <span className={`admin-status ${st.cls}`}>{st.label}</span>
      </div>

      <p className="admin-utc"><b>{giveaway.prize}</b>{giveaway.winnerCount > 1 && ` × ${giveaway.winnerCount} winners`}</p>
      {giveaway.description && <p className="admin-utc">{giveaway.description}</p>}
      <p className="admin-utc">
        {giveaway.startAt ? `${new Date(giveaway.startAt).toLocaleString()} → ` : 'Open now → '}
        {new Date(giveaway.endAt).toLocaleString()}
      </p>

      {drawn ? (
        <div className="gw-winner-list">
          {giveaway.winners.map((w) => (
            <div key={w.place}>
              <b>#{w.place}</b> {w.name} <span className="admin-utc">({w.id})</span>
            </div>
          ))}
          <p className="admin-utc" style={{ marginTop: 8 }}>
            Drawn {new Date(giveaway.drawnAt).toLocaleString()} by {giveaway.drawnBy} from{' '}
            {giveaway.entrantsAtDraw} entrants
          </p>
        </div>
      ) : (
        <p className="admin-utc">
          Entries are counted live — open the public page or click Entrants to see them.
        </p>
      )}

      <div className="gw-actions">
        <button className="btn btn-ghost admin-save" onClick={() => onEdit(giveaway)} disabled={busy}>Edit</button>
        <button className="btn btn-ghost admin-save" onClick={() => onEntries(giveaway)} disabled={busy}>Entrants</button>

        {giveaway.status === 'draft' && (
          <button className="btn btn-primary admin-save" onClick={() => onStatus(giveaway, 'live')} disabled={busy}>
            Publish
          </button>
        )}

        {!drawn && giveaway.status !== 'draft' && (
          <button className="btn btn-primary admin-save" onClick={() => onDraw(giveaway, false)} disabled={busy}>
            Draw winner{giveaway.winnerCount > 1 ? 's' : ''}
          </button>
        )}

        {drawn && (
          <button className="btn btn-ghost admin-save" onClick={() => onDraw(giveaway, true)} disabled={busy}>
            Redraw
          </button>
        )}

        <button className="btn btn-ghost admin-save danger" onClick={() => onDelete(giveaway)} disabled={busy}>
          Delete
        </button>
      </div>
    </div>
  )
}

/** Hosted-giveaway CRUD + draw controls for the /admin panel. */
export default function GiveawayAdmin() {
  const [all, setAll] = useState(null)
  const [editing, setEditing] = useState(null) // giveaway | 'new' | null
  const [entrants, setEntrants] = useState(null) // { title, list }
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = async () => {
    try {
      const res = await fetch('/api/giveaways')
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
      const res = await fetch('/api/giveaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `request failed (${res.status})`)
      if (data.all) setAll(data.all)
      if (okText) setMsg({ text: okText })
      return data
    } catch (err) {
      setMsg({ err: true, text: err.message })
      return null
    } finally {
      setBusy(false)
    }
  }

  const save = async (giveaway) => {
    if (await post({ action: 'save', giveaway }, 'Giveaway saved ✓')) setEditing(null)
  }

  const draw = async (giveaway, redraw) => {
    const what = giveaway.winnerCount > 1 ? `${giveaway.winnerCount} winners` : 'the winner'
    const warning = redraw
      ? `Redraw "${giveaway.title}"? The current winner(s) will be replaced and a new seed committed.`
      : `Draw ${what} for "${giveaway.title}"? Entries close immediately and the result is final.`
    if (!window.confirm(warning)) return
    await post({ action: 'draw', id: giveaway.id, redraw }, redraw ? 'Redraw complete ✓' : 'Winner drawn ✓')
  }

  const setStatus = (giveaway, status) =>
    post({ action: 'status', id: giveaway.id, status }, 'Status updated ✓')

  const remove = async (giveaway) => {
    if (!window.confirm(`Delete "${giveaway.title}"? Its entries are deleted too. This cannot be undone.`)) return
    await post({ action: 'delete', id: giveaway.id }, 'Giveaway deleted ✓')
  }

  const showEntrants = async (giveaway) => {
    const data = await post({ action: 'entries', id: giveaway.id })
    if (data) setEntrants({ title: giveaway.title, list: data.entries })
  }

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2 className="admin-section-title">Giveaways</h2>
          <p className="section-sub">
            Post a prize and anyone logged in with Discord can enter with one click —
            one entry per account, no wagering required. Draw the winner here when it
            closes and it's shown on the public page straight away.
          </p>
        </div>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            + New giveaway
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

      {entrants && (
        <div className="admin-card gv-entrants-panel">
          <div className="admin-card-head">
            <h3>{entrants.title} — {entrants.list.length} entrants</h3>
            <button className="btn btn-ghost admin-save" style={{ width: 'auto' }} onClick={() => setEntrants(null)}>
              Close
            </button>
          </div>
          {entrants.list.length === 0 ? (
            <p className="admin-utc">Nobody has entered yet.</p>
          ) : (
            <div className="gw-winner-list">
              {entrants.list.map((e) => (
                <div key={e.id}>
                  {e.name} <span className="admin-utc">({e.id}) · {new Date(e.at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {all === null ? (
        <div className="lb-status">Loading giveaways…</div>
      ) : all.length === 0 ? (
        <div className="lb-status">No giveaways yet — create one to get started.</div>
      ) : (
        <div className="admin-grid">
          {all.map((g) => (
            <GiveawayRow
              key={g.id}
              giveaway={g}
              busy={busy}
              onEdit={setEditing}
              onDraw={draw}
              onStatus={setStatus}
              onDelete={remove}
              onEntries={showEntrants}
            />
          ))}
        </div>
      )}
    </div>
  )
}
