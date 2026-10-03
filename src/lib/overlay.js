/**
 * What the stream overlay and the admin picker agree on.
 *
 * Split out of both so neither owns it: the two reels have to land on the same
 * name at the same moment. If they disagreed, the stream would reveal the
 * winner before the streamer's own screen did, or after it — and either way
 * the reaction on camera would be out of step with what viewers see.
 */

/** How long a reel spins, from the moment the draw is made. */
export const SPIN_MS = 5200

/** How often the overlay asks for fresh state. */
export const OVERLAY_POLL_MS = 1500

/** A draw already closer to landing than this is shown as a result, not spun. */
export const MIN_SPIN_MS = 700
