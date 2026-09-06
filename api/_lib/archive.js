// Archived leaderboard periods, shown on /winners.
//
// Kept in the settings store rather than in source so a finished period can be
// published from /admin. Previously each one had to be written into
// src/data/leaderboard.js by hand, which meant a code change and a deploy for
// something the admin panel should own.
import { getSettings, saveSettings } from './settingsStore.js'

export async function listArchive() {
  const settings = await getSettings()
  return Array.isArray(settings?.archive) ? settings.archive : []
}

export async function saveArchive(archive, by) {
  const prev = (await getSettings()) || {}
  await saveSettings({
    ...prev,
    casinos: prev.casinos || {},
    archive,
    updatedAt: new Date().toISOString(),
    updatedBy: by ?? prev.updatedBy ?? null,
  })
  return archive
}

const TZ = 'America/New_York'
const etHour = (iso) =>
  Number(new Date(iso).toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }))

/**
 * "August 1 — September 5, 2026".
 *
 * A period opens at 11pm ET the evening before the month it covers, so the
 * raw start date reads as the previous day — labelling it that way is exactly
 * the confusion we removed from the July entry. Anything starting late evening
 * is therefore labelled as the following day.
 */
export function periodLabel(from, to) {
  const opts = { timeZone: TZ, month: 'long', day: 'numeric' }
  const start = new Date(from)
  if (etHour(from) >= 22) start.setUTCDate(start.getUTCDate() + 1)
  return `${start.toLocaleDateString('en-US', opts)} — ${new Date(to).toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
}

/** Stable id for a period, so re-archiving replaces rather than duplicates. */
export const periodId = (from, to) => `${from.slice(0, 10)}_${to.slice(0, 10)}`

/**
 * Turn standings into an archive entry. Prizes come from the casino's ladder
 * by rank, and the list is cut to the number of paid places — the archive
 * records what was actually paid, not everyone who took part.
 */
export function buildEntry({ players, prizes, from, to, by, paid }) {
  const winners = [...players]
    .sort((a, b) => b.wagered - a.wagered)
    .slice(0, prizes.length)
    .map((p, i) => ({
      rank: i + 1,
      name: p.name,
      wagered: Math.round((Number(p.wagered) || 0) * 100) / 100,
      prize: prizes[i],
    }))

  return {
    id: periodId(from, to),
    label: periodLabel(from, to),
    prizePool: prizes.reduce((s, n) => s + n, 0),
    paid: paid || null,
    from,
    to,
    winners,
    archivedAt: new Date().toISOString(),
    archivedBy: by,
  }
}
