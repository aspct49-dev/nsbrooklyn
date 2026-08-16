import { useCallback, useEffect, useState } from 'react'

/**
 * Kick↔Discord link status for the logged-in user, from /api/kick/link.
 * Returns nulls (not an error) when logged out — the page just shows the
 * Discord login prompt in that case.
 */
export function useKickLink(enabled = true) {
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(enabled)

  const reload = useCallback(async () => {
    if (!enabled) return
    try {
      const res = await fetch('/api/kick/link')
      setState(res.ok ? await res.json() : null)
    } catch {
      setState(null)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => { reload() }, [reload])

  const unlink = useCallback(async () => {
    await fetch('/api/kick/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unlink' }),
    })
    await reload()
  }, [reload])

  return {
    loading,
    linked: state?.linked ?? false,
    kickName: state?.kickName ?? null,
    roleGate: state?.roleGate ?? false,
    hasRole: state?.hasRole ?? null,
    roleReason: state?.roleReason ?? null,
    reload,
    unlink,
  }
}

export const kickLinkUrl = '/api/kick/link?start=1'
