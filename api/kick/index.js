// The Kick surface, in one function to stay inside Vercel's function budget.
//
//   GET  /api/kick            — link status for the logged-in user
//   GET  /api/kick?start=1    — begin the Kick OAuth link flow (302)
//   GET  /api/kick?admin=1    — admin: the chat giveaway session + entries
//   POST /api/kick            — { action }
//        unlink                        (any logged-in user)
//        open | close | clear | draw   (admin)
//        redraw-place                  (admin)
import crypto from 'node:crypto'
import { sendJson, redirect, getQuery, getOrigin, setCookie, readBody } from '../_lib/http.js'
import { readSession, requireAdmin } from '../_lib/session.js'
import { authorizeUrl, makePkce } from '../_lib/kick.js'
import { linkForDiscord, removeLink } from '../_lib/links.js'
import { hasRequiredRole, roleGateConfigured } from '../_lib/discord.js'
import {
  getSession, saveSession, publicSession, listEntries, countEntries, listMisses,
  clearEntries, drawWinners, redrawPlace, ensureSeed, makeSeed,
  normalizeKeyword, normalizeWinnerCount, BLANK,
} from '../_lib/kickgw.js'

export const OAUTH_COOKIE = 'nsb_kick_oauth'

// --------------------------------------------------------------- user side

async function linkStatus(req, res, session) {
  const link = await linkForDiscord(session.id)
  const role = roleGateConfigured() ? await hasRequiredRole(session.id) : null
  const gw = await getSession()

  res.setHeader('Cache-Control', 'private, no-store')
  return sendJson(res, 200, {
    linked: Boolean(link),
    kickName: link?.kickName ?? null,
    linkedAt: link?.at ?? null,
    roleGate: roleGateConfigured(),
    hasRole: role ? role.ok : null,
    roleReason: role && !role.ok ? role.reason : null,
    // so the page can say "a chat giveaway is running right now"
    live: gw.open ? { keyword: gw.keyword, requireRole: gw.requireRole } : null,
  })
}

// -------------------------------------------------------------- admin side

async function adminView(res, extra = {}) {
  const session = await getSession()
  const [entries, misses, entrants] = await Promise.all([
    listEntries(), listMisses(), countEntries(),
  ])
  res.setHeader('Cache-Control', 'private, no-store')
  return sendJson(res, 200, {
    session: publicSession(session),
    entries,
    misses,
    entrants,
    roleGate: roleGateConfigured(),
    ...extra,
  })
}

async function handleAdminAction(req, res, body) {
  const admin = requireAdmin(req)
  const current = await getSession()
  const action = body?.action

  if (action === 'open') {
    const keyword = normalizeKeyword(body?.keyword)
    const winnerCount = normalizeWinnerCount(body?.winnerCount)
    // Opening starts a fresh round: old entries would otherwise carry over
    // and quietly enter people who never typed this keyword.
    if (body?.keepEntries !== true) await clearEntries()

    const next = ensureSeed({
      ...BLANK,
      keyword,
      winnerCount,
      prize: String(body?.prize || '').trim().slice(0, 120),
      requireRole: body?.requireRole !== false,
      open: true,
      openedAt: new Date().toISOString(),
      openedBy: admin.name,
    })
    await saveSession(next)
    return adminView(res)
  }

  if (action === 'close') {
    await saveSession({ ...current, open: false, closedAt: new Date().toISOString() })
    return adminView(res)
  }

  if (action === 'clear') {
    await clearEntries()
    await saveSession({ ...current, winners: null, drawnAt: null, drawnBy: null, entrantsAtDraw: null, redraws: [] })
    return adminView(res)
  }

  if (action === 'draw') {
    const entries = await listEntries()
    if (!entries.length) throw Object.assign(new Error('Nobody has entered yet'), { status: 400 })

    // Close on draw so a message arriving mid-draw can't change the pool.
    const seeded = ensureSeed(
      current.drawnAt ? { ...current, seed: null, seedHash: null } : current,
    )
    const winnerCount = normalizeWinnerCount(body?.winnerCount ?? seeded.winnerCount)
    await saveSession({
      ...seeded,
      open: false,
      closedAt: current.closedAt || new Date().toISOString(),
      winnerCount,
      winners: drawWinners({ entries, winnerCount, seed: seeded.seed }),
      entrantsAtDraw: entries.length,
      drawnAt: new Date().toISOString(),
      drawnBy: admin.name,
    })
    return adminView(res)
  }

  if (action === 'redraw-place') {
    if (!current.drawnAt || !current.winners?.length) {
      throw Object.assign(new Error('Draw before redrawing a place'), { status: 409 })
    }
    const place = Number(body?.place)
    if (!Number.isInteger(place)) throw Object.assign(new Error('A place number is required'), { status: 400 })

    const { winners, record } = redrawPlace({
      session: current, entries: await listEntries(), place, seed: makeSeed(),
    })
    await saveSession({
      ...current,
      winners,
      redraws: [...(current.redraws || []), { ...record, by: admin.name }],
    })
    return adminView(res)
  }

  throw Object.assign(new Error(`Unknown action "${action}"`), { status: 400 })
}

// ------------------------------------------------------------------ route

export default async function handler(req, res) {
  try {
    const session = readSession(req)
    if (!session) throw Object.assign(new Error('Log in with Discord first'), { status: 401 })

    if (req.method === 'GET') {
      const q = getQuery(req)

      if (q.start) {
        const state = crypto.randomBytes(16).toString('hex')
        const { verifier, challenge } = makePkce()
        // state + verifier ride in one short-lived cookie; the callback needs
        // both and neither is worth persisting server-side
        setCookie(res, OAUTH_COOKIE, `${state}.${verifier}`, { maxAge: 600 })
        return redirect(res, authorizeUrl(getOrigin(req), { state, challenge }))
      }

      if (q.admin) {
        requireAdmin(req)
        return await adminView(res)
      }

      // NOTE: these are awaited, not just returned. Returning a promise out
      // of a try block escapes the catch below, so a rejection would surface
      // as an unhandled rejection instead of a proper error response.
      return await linkStatus(req, res, session)
    }

    if (req.method === 'POST') {
      const body = await readBody(req)
      if (body?.action === 'unlink') {
        const removed = await removeLink(session.id)
        return sendJson(res, 200, { linked: false, unlinked: removed?.kickName ?? null })
      }
      return await handleAdminAction(req, res, body)
    }

    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    console.error('api/kick error', err)
    sendJson(res, err.status || 500, { error: err.message })
  }
}
