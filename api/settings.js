// GET  /api/settings — public: current leaderboard periods (or null)
// PUT  /api/settings — admin-only: update periods for both casinos
import { sendJson, readBody } from './_lib/http.js'
import { requireAdmin } from './_lib/session.js'
import { getSettings, saveSettings } from './_lib/settingsStore.js'
import { assertIso } from './_lib/leaderboard.js'

const CASINOS = ['betbolt', 'casebattle']

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const settings = await getSettings()
      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120')
      return sendJson(res, 200, settings || { casinos: {} })
    }

    if (req.method === 'PUT' || req.method === 'POST') {
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

      // merge over existing so updating one board keeps the other
      const prev = (await getSettings()) || { casinos: {} }
      const next = {
        casinos: { ...prev.casinos, ...casinos },
        updatedAt: new Date().toISOString(),
        updatedBy: session.name,
      }
      await saveSettings(next)
      return sendJson(res, 200, next)
    }

    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    console.error('api/settings error', err)
    sendJson(res, err.status || 500, { error: err.message })
  }
}
