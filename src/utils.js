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
