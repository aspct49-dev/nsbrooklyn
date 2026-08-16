// Kick ↔ Discord account links.
//
// Stored as two keys so both directions are a single lookup: the webhook only
// knows a Kick user id and has to resolve it to a Discord account fast.
//
// The pairing is strictly one-to-one in BOTH directions. Without that, one
// person could link several Kick accounts to one Discord (or hand their Kick
// account round a group) and enter a giveaway more than once.
import { getJson, setJson, del } from './store.js'

const byKick = (kickId) => `nsb:link:kick:${kickId}`
const byDiscord = (discordId) => `nsb:link:discord:${discordId}`

/** The Discord account a Kick user is linked to, or null. */
export const linkForKick = (kickId) => getJson(byKick(String(kickId)), null)

/** The Kick account a Discord user is linked to, or null. */
export const linkForDiscord = (discordId) => getJson(byDiscord(String(discordId)), null)

/**
 * Link a Kick account to a Discord account.
 * Throws 409 if either side already belongs to somebody else.
 */
export async function createLink({ discordId, discordName, kickId, kickName }) {
  const dId = String(discordId)
  const kId = String(kickId)

  const [existingForKick, existingForDiscord] = await Promise.all([
    linkForKick(kId),
    linkForDiscord(dId),
  ])

  if (existingForKick && existingForKick.discordId !== dId) {
    throw Object.assign(
      new Error('That Kick account is already linked to a different Discord account.'),
      { status: 409 },
    )
  }
  if (existingForDiscord && existingForDiscord.kickId !== kId) {
    throw Object.assign(
      new Error(`Your Discord is already linked to Kick user "${existingForDiscord.kickName}". Unlink it first.`),
      { status: 409 },
    )
  }

  const record = {
    discordId: dId,
    discordName,
    kickId: kId,
    kickName,
    at: existingForKick?.at || new Date().toISOString(),
  }
  await Promise.all([setJson(byKick(kId), record), setJson(byDiscord(dId), record)])
  return record
}

/** Remove a Discord account's link, clearing both directions. */
export async function removeLink(discordId) {
  const existing = await linkForDiscord(String(discordId))
  if (!existing) return null
  await Promise.all([del(byDiscord(String(discordId))), del(byKick(existing.kickId))])
  return existing
}
