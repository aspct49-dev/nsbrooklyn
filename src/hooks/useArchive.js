import { useEffect, useState } from 'react'
import { pastWinners } from '../data/leaderboard'

/**
 * Archived leaderboard periods for /winners.
 *
 * Server-published entries come first; the hardcoded `pastWinners` are older
 * periods archived before /admin could do it, and are kept so nothing
 * disappears. An id collision means the server copy wins.
 */
export function useArchive() {
  const [remote, setRemote] = useState(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => setRemote(Array.isArray(s?.archive) ? s.archive : []))
      .catch(() => setRemote([]))
  }, [])

  const server = remote || []
  const ids = new Set(server.map((a) => a.id))
  const periods = [...server, ...pastWinners.filter((p) => !ids.has(p.id))]
    .sort((a, b) => new Date(b.to || b.id) - new Date(a.to || a.id))

  return { periods, loading: remote === null }
}
