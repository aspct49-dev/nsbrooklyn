import { useEffect, useState } from 'react'
import { isoToLocal, localToIso } from '../utils'

/**
 * Publish a finished leaderboard period to /winners.
 *
 * Takes explicit dates rather than only the currently configured period:
 * starting a new board replaces the old one's dates, and without this the
 * finished period becomes unreachable — which is exactly what happened to the
 * August board. `previousPeriod` pre-fills the common case.
 */
export default function ArchivePanel({ settings, onArchive, saving }) {
  const prev = settings?.previousPeriod
  const current = settings?.casinos?.betbolt

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    // prefer the period we just replaced; fall back to the current one if it
    // has already finished
    const seed = prev || (current && new Date(current.endAt) < new Date()
      ? { from: current.startAt, to: current.endAt }
      : null)
    if (seed) {
      setFrom(isoToLocal(seed.from))
      setTo(isoToLocal(seed.to))
    }
  }, [prev?.from, prev?.to, current?.startAt, current?.endAt])

  const archived = settings?.archive || []

  const publish = async () => {
    setMsg(null)
    if (!from || !to) return setMsg({ err: true, text: 'Both dates are required.' })
    if (new Date(to) > new Date()) {
      return setMsg({ err: true, text: "That period hasn't finished yet." })
    }
    const r = await onArchive({ from: localToIso(from), to: localToIso(to) })
    setMsg(r.ok
      ? { text: `Published "${r.entry.label}" — ${r.entry.winners.length} winners` }
      : { err: true, text: r.error })
  }

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2 className="admin-section-title">Publish past winners</h2>
          <p className="section-sub">
            Snapshots the final standings for a finished period and puts them on{' '}
            <a href="/winners">/winners</a>, prizes assigned by rank. Publishing the same
            period again replaces it rather than adding a duplicate.
          </p>
        </div>
      </div>

      <div className="admin-grid one">
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Archive a period</h3>
            {prev && <span className="admin-status soon">previous period loaded</span>}
          </div>

          <div className="gw-form-row">
            <label className="admin-label">
              Period start
              <input className="admin-input" type="datetime-local" value={from}
                onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="admin-label">
              Period end
              <input className="admin-input" type="datetime-local" value={to}
                onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>

          <button className="btn btn-primary admin-save" onClick={publish} disabled={saving}>
            {saving ? 'Publishing…' : 'Publish to /winners'}
          </button>
          {msg && <p className={`admin-msg ${msg.err ? 'err' : ''}`}>{msg.text}</p>}

          {archived.length > 0 && (
            <div className="gw-winner-list" style={{ marginTop: 16 }}>
              {archived.map((a) => (
                <div key={a.id}>
                  <b>{a.label}</b>
                  <span className="admin-utc"> · {a.winners.length} winners · #1 {a.winners[0]?.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
