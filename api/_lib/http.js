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

/**
 * The request body as exact bytes. Signature checks must hash what was
 * actually sent, so this never re-serializes: a re-encoded object would
 * differ from the sender's bytes by key order or whitespace and every
 * signature would fail. Some hosts pre-parse the body and drain the stream,
 * so the already-read forms are honoured first.
 */
export async function readRawBody(req) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody
  if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody, 'utf8')
  if (Buffer.isBuffer(req.body)) return req.body
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8')

  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks)
  if (raw.length) return raw

  // Stream already drained and only a parsed object survives — unusable for
  // signatures, so say so rather than silently failing verification.
  if (req.body && typeof req.body === 'object') {
    throw Object.assign(
      new Error('Raw body unavailable (request was pre-parsed) — cannot verify signature'),
      { status: 500 },
    )
  }
  return raw
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body
  const raw = (await readRawBody(req)).toString('utf8')
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
