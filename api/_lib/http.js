// Tiny helpers so API handlers work as plain Node handlers — the same
// files run on Vercel (as serverless functions) and under the Vite dev
// middleware, without depending on Vercel-specific req/res sugar.

export function getQuery(req) {
  const url = new URL(req.url, 'http://local')
  return Object.fromEntries(url.searchParams)
}

export function sendJson(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}

export function redirect(res, location) {
  res.statusCode = 302
  res.setHeader('Location', location)
  res.end()
}

export function parseCookies(req) {
  const out = {}
  const header = req.headers.cookie || ''
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

export function setCookie(res, name, value, { maxAge, httpOnly = true, path = '/' } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, 'SameSite=Lax']
  if (httpOnly) parts.push('HttpOnly')
  if (process.env.NODE_ENV !== 'development' && !process.env.VITE_DEV) parts.push('Secure')
  if (maxAge != null) parts.push(`Max-Age=${maxAge}`)
  const prev = res.getHeader('Set-Cookie')
  const cookie = parts.join('; ')
  res.setHeader('Set-Cookie', prev ? [].concat(prev, cookie) : cookie)
}

export async function readBody(req) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks).toString('utf8')
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    const err = new Error('Invalid JSON body')
    err.status = 400
    throw err
  }
}

// Site origin for OAuth redirects: SITE_URL env wins, else derived from headers.
export function getOrigin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  const proto = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return `${proto}://${host}`
}
