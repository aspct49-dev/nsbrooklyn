// Shared formatting helpers.

export const fmtMoney = (n, decimals = 0) =>
  '$' +
  Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

// Mask a username for privacy: "BlazeKing" -> "B*******g"
export const maskName = (name) => {
  if (!name) return ''
  if (name.length <= 2) return name[0] + '*'
  const stars = '*'.repeat(Math.max(1, name.length - 2))
  return name[0] + stars + name[name.length - 1]
}

export const initials = (name) => (name ? name[0].toUpperCase() : '?')

// ISO UTC ↔ <input type="datetime-local">, which works in the admin's local
// time. Used by every date field in the /admin panel.
export function isoToLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const localToIso = (local) => (local ? new Date(local).toISOString() : null)

/**
 * Compact wager amounts for the milestone + rank cards.
 * 0 -> "$0", 2700 -> "$2.7K", 2_250_000 -> "$2.25M", 1.2e9 -> "$1.2B".
 * Roobet's ladder runs to $10B, so B has to be covered. Trailing zeros are
 * trimmed so round numbers don't read as "$10.00M".
 */
export function fmtWager(n) {
  const v = Number(n) || 0
  if (v === 0) return '$0'
  for (const [size, suffix] of [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']]) {
    if (v >= size) {
      const trimmed = (v / size).toFixed(2).replace(/\.?0+$/, '')
      return `$${trimmed}${suffix}`
    }
  }
  return `$${v.toLocaleString('en-US')}`
}
