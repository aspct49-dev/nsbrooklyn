// POST /api/kick/webhook — Kick pushes chat here.
//
// A viewer typing the keyword is entered into any open keyword giveaway, but
// only if their Kick account is linked to a Discord account that holds the
// required role. Entries are keyed by DISCORD id, so everything downstream —
// dedupe, the draw, single-place redraws, winner display — is unchanged.
//
// Set the webhook URL to <site>/api/kick/webhook in your Kick app and
// subscribe to `chat.message.sent`.
import { sendJson, readRawBody } from '../_lib/http.js'
import { verifyWebhook } from '../_lib/kick.js'
import { linkForKick } from '../_lib/links.js'
import { hasRequiredRole } from '../_lib/discord.js'
import { listGiveaways, addEntry, recordMiss, isOpen, acceptsKeyword, messageMatches } from '../_lib/giveaways.js'

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

    const payload = JSON.parse(rawBody.toString('utf8'))
    const sender = payload?.sender
    const content = String(payload?.content ?? '')
    if (!sender?.user_id || sender.is_anonymous) return sendJson(res, 200, { ignored: 'anonymous' })

    // Only our own channel, when configured — the same app could in principle
    // receive events for another broadcaster.
    const channel = process.env.KICK_CHANNEL_SLUG
    if (channel && payload?.broadcaster?.channel_slug &&
        payload.broadcaster.channel_slug.toLowerCase() !== channel.toLowerCase()) {
      return sendJson(res, 200, { ignored: 'other-channel' })
    }

    const open = (await listGiveaways()).filter(
      (g) => isOpen(g) && acceptsKeyword(g) && messageMatches(content, g.keyword),
    )
    if (!open.length) return sendJson(res, 200, { matched: 0 })

    const link = await linkForKick(sender.user_id)
    const kickName = sender.username || `kick-${sender.user_id}`

    if (!link) {
      await Promise.all(open.map((g) => recordMiss(g.id, sender.user_id, kickName, 'not-linked')))
      return sendJson(res, 200, { matched: open.length, entered: 0, reason: 'not-linked' })
    }

    const results = []
    for (const giveaway of open) {
      if (giveaway.requireRole) {
        const role = await hasRequiredRole(link.discordId)
        if (!role.ok) {
          await recordMiss(giveaway.id, sender.user_id, kickName, role.reason)
          results.push({ id: giveaway.id, entered: false, reason: role.reason })
          continue
        }
      }
      await addEntry(giveaway.id, {
        id: link.discordId,
        name: link.discordName,
        avatar: null,
        via: 'kick',
        kickName: link.kickName,
      })
      results.push({ id: giveaway.id, entered: true })
    }

    return sendJson(res, 200, {
      matched: open.length,
      entered: results.filter((r) => r.entered).length,
      results,
    })
  } catch (err) {
    // 401 means the signature failed — log quietly, it may just be noise.
    if (err.status === 401) {
      console.warn('kick/webhook rejected:', err.message)
      return sendJson(res, 401, { error: err.message })
    }
    console.error('api/kick/webhook error', err)
    return sendJson(res, err.status || 500, { error: err.message })
  }
}
