// POST /api/kick/webhook — Kick pushes chat here.
//
// While a chat giveaway is open, anyone typing the keyword is entered — as
// long as their Kick account is linked to a Discord account on the site (and
// holds the required role, if the round asks for it).
//
// Set this URL in your Kick app and subscribe to `chat.message.sent`.
import { sendJson, readRawBody } from '../_lib/http.js'
import { verifyWebhook } from '../_lib/kick.js'
import { linkForKick } from '../_lib/links.js'
import { hasRequiredRole } from '../_lib/discord.js'
import { getSession, messageMatches, addEntry, recordMiss, recordWinnerMessage } from '../_lib/kickgw.js'

// Vercel's Node runtime parses JSON bodies by default, which drains the
// stream — and a re-serialized body would not match Kick's signature.
export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })

  try {
    const rawBody = await readRawBody(req)
    await verifyWebhook({ headers: req.headers, rawBody })

    const type = req.headers['kick-event-type']
    if (type !== 'chat.message.sent') return sendJson(res, 200, { ignored: type || 'unknown' })

    const gw = await getSession()
    const payload = JSON.parse(rawBody.toString('utf8'))
    const sender = payload?.sender
    if (!sender?.user_id || sender.is_anonymous) return sendJson(res, 200, { ignored: 'anonymous' })

    // Only our own channel, when configured — the same app could in
    // principle receive events for another broadcaster. Checked before
    // anything is recorded, so a winner chatting elsewhere isn't logged here.
    const channel = process.env.KICK_CHANNEL_SLUG
    if (channel && payload?.broadcaster?.channel_slug &&
        payload.broadcaster.channel_slug.toLowerCase() !== channel.toLowerCase()) {
      return sendJson(res, 200, { ignored: 'other-channel' })
    }

    // Once drawn, keep a short log of what the winners say so the picker can
    // show them reacting. Matched on the Kick id already in the payload, so
    // this costs no extra lookup for the other 99% of chat. This never
    // creates an entry — the round is closed by then.
    if (gw.drawnAt && gw.winners?.length) {
      const isWinner = gw.winners.some((w) => String(w.kickId) === String(sender.user_id))
      if (isWinner) {
        await recordWinnerMessage(sender.user_id, sender.username, payload?.content ?? '')
        return sendJson(res, 200, { winnerMessage: true })
      }
    }

    if (!gw.open || !gw.keyword) return sendJson(res, 200, { ignored: 'no-open-giveaway' })
    if (!messageMatches(payload?.content, gw.keyword)) return sendJson(res, 200, { matched: false })

    const kickName = sender.username || `kick-${sender.user_id}`
    const link = await linkForKick(sender.user_id)
    if (!link) {
      await recordMiss(sender.user_id, kickName, 'not-linked')
      return sendJson(res, 200, { matched: true, entered: false, reason: 'not-linked' })
    }

    if (gw.requireRole) {
      const role = await hasRequiredRole(link.discordId)
      if (!role.ok) {
        await recordMiss(sender.user_id, kickName, role.reason)
        return sendJson(res, 200, { matched: true, entered: false, reason: role.reason })
      }
    }

    await addEntry({
      discordId: link.discordId,
      discordName: link.discordName,
      kickId: String(sender.user_id),
      kickName: link.kickName || kickName,
      kickAvatar: sender.profile_picture || null,
    })
    return sendJson(res, 200, { matched: true, entered: true })
  } catch (err) {
    // 401 means the signature failed — likely noise, so log quietly.
    if (err.status === 401) {
      console.warn('kick/webhook rejected:', err.message)
      return sendJson(res, 401, { error: err.message })
    }
    console.error('api/kick/webhook error', err)
    return sendJson(res, err.status || 500, { error: err.message })
  }
}
