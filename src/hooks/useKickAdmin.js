import { useCallback, useEffect, useRef, useState } from 'react'

const POLL_MS = 3000

/**
 * State for the admin Kick picker: the session, its entries, and the health of
 * the Kick chat subscription.
 *
 * Kept in a hook rather than inline in the page so the page stays a pure
 * render of whatever this returns — which is what makes the delivery-status
 * banners testable without a browser.
 */
export function useKickAdmin(enabled = true) {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const pollRef = useRef(null)

  const load = useCallback(async () => {
    if (!enabled) return
    try {
      const res = await fetch('/api/kick?admin=1')
      if (res.ok) setData(await res.json())
    } catch { /* transient — the poll retries */ }
  }, [enabled])

  const post = useCallback(async (body, okText) => {
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
  }, [])

  useEffect(() => { load() }, [load])

  // Poll only while something can actually change — entries arriving, or the
  // winner's chat after a draw.
  const startPolling = useCallback((on) => {
    clearInterval(pollRef.current)
    if (on) pollRef.current = setInterval(load, POLL_MS)
  }, [load])

  useEffect(() => () => clearInterval(pollRef.current), [])

  return { data, busy, msg, setMsg, load, post, startPolling, pollMs: POLL_MS }
}
