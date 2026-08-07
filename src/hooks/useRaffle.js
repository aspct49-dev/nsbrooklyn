import { useCallback, useEffect, useState } from 'react'

const REFRESH_MS = 120_000
const EMPTY = { current: null, entries: [], past: [], totalTickets: 0 }

/**
 * The current wager raffle plus its live ticket standings, from /api/raffles.
 * Refreshes on an interval so ticket counts keep climbing while it's open.
 */
export function useRaffle() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const res = await fetch('/api/raffles')
      if (!res.ok) throw new Error(`api ${res.status}`)
      setData(await res.json())
      setError(null)
    } catch (err) {
      setError(err.message || 'Could not load raffles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    const id = setInterval(reload, REFRESH_MS)
    return () => clearInterval(id)
  }, [reload])

  return { ...EMPTY, ...(data || {}), loading, error, reload }
}

/** draft | upcoming | live | awaiting-draw | ended — what the UI should show. */
export function rafflePhase(raffle) {
  if (!raffle) return 'none'
  if (raffle.status === 'draft') return 'draft'
  if (raffle.winners?.length) return 'ended'
  const now = Date.now()
  if (now < +new Date(raffle.startAt)) return 'upcoming'
  if (now < +new Date(raffle.endAt)) return 'live'
  return 'awaiting-draw'
}
