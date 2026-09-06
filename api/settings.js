// GET  /api/settings — public: leaderboard periods + the archived periods
//                      shown on /winners
// PUT  /api/settings — admin: update the leaderboard period
// POST /api/settings — admin: { action: 'archive' } snapshots the period that
//                      just finished and publishes it to /winners
import { sendJson, readBody } from './_lib/http.js'
import { requireAdmin } from './_lib/session.js'
import { getSettings, saveSettings } from './_lib/settingsStore.js'
import { assertIso, getLeaderboard } from './_lib/leaderboard.js'
import { listArchive, saveArchive, buildEntry, periodId } from './_lib/archive.js'
import { casinos as CASINO_CONFIG } from '../src/data/leaderboard.js'

const CASINOS = ['betbolt']

/**
 * Only what the site actually needs.
 *
 * This used to return the whole settings object, which meant raffles and
 * giveaways — including their committed draw seeds — were served publicly. A
 * seed published before its draw lets anyone compute the winner in advance,
 * so the response is now built from named fields rather than spread wholesale.
 */
function publicSettings(settings) {
  return {
    casinos: settings?.casinos || {},
    archive: Array.isArray(settings?.archive) ? settings.archive : [],
    updatedAt: settings?.updatedAt || null,
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120')
      return sendJson(res, 200, publicSettings(await getSettings()))
    }

    if (req.method === 'POST') {
      const session = requireAdmin(req)
      const body = await readBody(req)
      if (body?.action !== 'archive') {
        throw Object.assign(new Error(`Unknown action "${body?.action}"`), { status: 400 })
      }

      const casinoId = body?.casino || 'betbolt'
      const casino = CASINO_CONFIG.find((c) => c.id === casinoId)
      if (!casino) throw Object.assign(new Error(`Unknown casino "${casinoId}"`), { status: 400 })

      const { from, to } = body
      assertIso(from, 'from')
      assertIso(to, 'to')
      if (new Date(from) >= new Date(to)) {
        throw Object.assign(new Error('start must be before end'), { status: 400 })
      }

      // Standings come from the API, never from the client — an archive is a
      // payout record and shouldn't be something the browser can dictate.
      const { players } = await getLeaderboard({ casino: casinoId, from, to, env: process.env })
      if (!players?.length) {
        throw Object.assign(new Error('No standings for that period yet — nothing to archive'), { status: 400 })
      }

      const entry = buildEntry({
        players,
        prizes: casino.prizes,
        from,
        to,
        by: session.name,
        paid: typeof body?.paid === 'string' ? body.paid.slice(0, 60) : null,
      })

      // Re-archiving the same period replaces it rather than duplicating.
      const archive = (await listArchive()).filter((a) => a.id !== periodId(from, to))
      const next = [entry, ...archive].sort((a, b) => new Date(b.to) - new Date(a.to))
      await saveArchive(next, session.name)
      return sendJson(res, 200, { entry, archive: next })
    }

    if (req.method === 'PUT') {
      const session = requireAdmin(req)
      const body = await readBody(req)

      const casinos = {}
      for (const id of CASINOS) {
        const c = body?.casinos?.[id]
        if (!c) continue
        assertIso(c.startAt, `${id}.startAt`)
        assertIso(c.endAt, `${id}.endAt`)
        if (new Date(c.startAt) >= new Date(c.endAt)) {
          throw Object.assign(new Error(`${id}: start must be before end`), { status: 400 })
        }
        casinos[id] = { startAt: c.startAt, endAt: c.endAt }
      }
      if (!Object.keys(casinos).length) {
        throw Object.assign(new Error('No casino settings in body'), { status: 400 })
      }

      // merge over existing so saving a period never clobbers the stored
      // giveaways, raffles or archive
      const prev = (await getSettings()) || { casinos: {} }
      const next = {
        ...prev,
        casinos: { ...prev.casinos, ...casinos },
        updatedAt: new Date().toISOString(),
        updatedBy: session.name,
      }
      await saveSettings(next)
      return sendJson(res, 200, publicSettings(next))
    }

    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    console.error('api/settings error', err)
    sendJson(res, err.status || 500, { error: err.message })
  }
}
