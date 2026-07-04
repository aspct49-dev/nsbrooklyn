import { useEffect, useState } from 'react'
import { casinos } from '../data/leaderboard'
import { useAuth, loginUrl } from '../hooks/useAuth'
import { getCasinoRange } from '../hooks/useLeaderboard'
import { IconDiscord } from '../components/icons'

// ISO UTC ↔ <input type="datetime-local"> (which works in local time)
function isoToLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const localToIso = (local) => (local ? new Date(local).toISOString() : null)

function statusOf(c, isDefault) {
  if (!c?.startAt || !c?.endAt) return { label: 'Not configured', cls: 'off' }
  const suffix = isDefault ? ' (default)' : ''
  const now = Date.now()
  if (now < new Date(c.startAt)) return { label: `Upcoming${suffix}`, cls: 'soon' }
  if (now > new Date(c.endAt)) return { label: `Ended${suffix}`, cls: 'ended' }
  return { label: `Live${suffix}`, cls: 'live' }
}

function BoardCard({ casino, value, isDefault, onSave, saving }) {
  const [start, setStart] = useState(isoToLocal(value?.startAt))
  const [end, setEnd] = useState(isoToLocal(value?.endAt))
  const [msg, setMsg] = useState(null)
  useEffect(() => {
    setStart(isoToLocal(value?.startAt))
    setEnd(isoToLocal(value?.endAt))
  }, [value?.startAt, value?.endAt])

  const st = statusOf(value, isDefault)

  const save = async () => {
    setMsg(null)
    if (!start || !end) return setMsg({ err: true, text: 'Both dates are required.' })
    if (new Date(start) >= new Date(end)) return setMsg({ err: true, text: 'Start must be before end.' })
    const ok = await onSave(casino.id, { startAt: localToIso(start), endAt: localToIso(end) })
    setMsg(ok ? { text: 'Saved ✓' } : { err: true, text: 'Save failed — check console / KV config.' })
  }

  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3>{casino.name}</h3>
        <span className={`admin-status ${st.cls}`}>{st.label}</span>
      </div>

      <label className="admin-label">
        Start date &amp; time
        <input
          className="admin-input"
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </label>
      <label className="admin-label">
        End date &amp; time
        <input
          className="admin-input"
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </label>

      {start && end && (
        <p className="admin-utc">
          UTC: {localToIso(start)?.slice(0, 16).replace('T', ' ')} → {localToIso(end)?.slice(0, 16).replace('T', ' ')}
        </p>
      )}

      {isDefault && (
        <p className="admin-utc">
          Showing the built-in default period — it runs the site until you save
          your own dates here.
        </p>
      )}

      <button className="btn btn-primary admin-save" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : `Save ${casino.name} period`}
      </button>
      {msg && <p className={`admin-msg ${msg.err ? 'err' : ''}`}>{msg.text}</p>}
    </div>
  )
}

export default function Admin() {
  const { loading, user, isAdmin } = useAuth()
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => setSettings({ casinos: {} }))
  }, [])

  const save = async (casinoId, period) => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casinos: { [casinoId]: period } }),
      })
      if (!res.ok) throw new Error(`save failed (${res.status})`)
      setSettings(await res.json())
      return true
    } catch (err) {
      console.error(err)
      return false
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <section className="section"><div className="container admin-gate">Loading…</div></section>

  if (!user) {
    return (
      <section className="section">
        <div className="container admin-gate">
          <h1 className="section-title">Admin Panel</h1>
          <p className="section-sub">Log in with Discord to continue.</p>
          <a className="btn btn-primary admin-login" href={loginUrl}>
            <IconDiscord /> Login with Discord
          </a>
        </div>
      </section>
    )
  }

  if (!isAdmin) {
    return (
      <section className="section">
        <div className="container admin-gate">
          <h1 className="section-title">Admin Panel</h1>
          <p className="section-sub">
            Logged in as <b>{user.name}</b> — this account is not an admin.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container">
        <div className="admin-head">
          <h1 className="section-title">Admin Panel</h1>
          <p className="section-sub">
            Set when each leaderboard starts and ends. The site's countdowns and
            the API date ranges follow these settings.
          </p>
          {settings?.updatedAt && (
            <p className="admin-meta">
              Last updated {new Date(settings.updatedAt).toLocaleString()} by {settings.updatedBy}
            </p>
          )}
        </div>

        <div className="admin-grid">
          {casinos.map((c) => {
            const saved = settings?.casinos?.[c.id]
            // no saved settings yet → prefill with the built-in default
            // period that's currently driving the site
            const fallback = getCasinoRange(c.id)
            const value = saved ?? { startAt: fallback.from, endAt: fallback.to }
            return (
              <BoardCard
                key={c.id}
                casino={c}
                value={value}
                isDefault={!saved}
                onSave={save}
                saving={saving}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
