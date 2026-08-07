import { useCallback, useEffect, useState } from 'react'

const REFRESH_MS = 30_000

/**
 * Admin-hosted giveaways from /api/giveaways, plus whether the logged-in
 * Discord user has already entered each one. Refreshes fairly often so entry
 * counts and freshly drawn winners appear without a reload.
 */
export function useGiveaways() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const res = await fetch('/api/giveaways')
      if (!res.ok) throw new Error(`api ${res.status}`)
      setData(await res.json())
      setError(null)
    } catch (err) {
      setError(err.message || 'Could not load giveaways')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    const id = setInterval(reload, REFRESH_MS)
    return () => clearInterval(id)
  }, [reload])

  /** Enter a giveaway, then refresh so the count and button state update. */
  const enter = useCallback(async (id) => {
    const res = await fetch('/api/giveaways', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enter', id }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body?.error || `Could not enter (${res.status})`)
    await reload()
    return body
  }, [reload])

  return {
    active: data?.active || [],
    past: data?.past || [],
    user: data?.user || null,
    loading,
    error,
    reload,
    enter,
  }
}
