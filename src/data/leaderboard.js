// ============================================================================
//  NSBROOKLYN LEADERBOARDS — EDIT EVERYTHING HERE
// ----------------------------------------------------------------------------
//  This is the only file you need to touch to update the site's content.
//  Change the prize pools, the casino/code, the countdown end date, and the
//  player lists below. The site rebuilds the podium + tables automatically.
//
//  Giveaways are NOT here — they're created and drawn from the /admin panel
//  and stored server-side (see api/_lib/giveaways.js for the built-in default).
// ============================================================================

export const config = {
  brandName: 'NSBROOKLYN',
  referralCode: 'NSB',
  // Shown on the legal pages. TODO: replace with your real support email
  // (or leave it — the legal pages also point users to your Discord).
  contactEmail: 'support@nsbrooklyn.com',
  prizePool: 5000, // leaderboard $ pool, shown in the hero + navbar badge

  // Partner casino, joined into the legal pages / footer copy.
  casinoNames: 'Roobet',

  // Decorative profile pictures by rank (1st, 2nd, 3rd). Ranks past this list
  // fall back to the player's initial. Files live in /public.
  rankAvatars: ['/magicpiggy.png', '/befy.png', '/pug.png'],

  socials: {
    discord: 'https://discord.com/invite/nsbrooklyntv',
    x: 'https://x.com/NSBrooklyn',
    kick: 'https://kick.com/nsbrooklyntv',
  },

  // Promo banner under the bonus cards on the home page. The top-3 winner
  // cards pull from the leaderboard so they always match.
  promo: {
    amount: 5000,
    title: 'LEADERBOARD',
    subtitle: 'Climb to the top of the leaderboard & win crazy prizes!',
    cta: 'View Leaderboard',
    to: '/leaderboard',
  },
}

// ============================================================================
//  CASINOS — one entry per partner site. Each gets its own leaderboard tab,
//  prize ladder and player list. `prizes` are per rank, 1st → last; players
//  are ranked by wagered amount. (Each prize list sums to that casino's pool.)
//  With a single entry the leaderboard page hides the casino switcher.
//
//  NOTE: `id` is also the key used by /api/leaderboard and by the stored admin
//  settings, so it has to match a fetcher in api/_lib/leaderboard.js.
// ============================================================================
export const casinos = [
  {
    id: 'roobet',
    name: 'Roobet',
    url: 'https://roobet.com/?ref=nsb',
    logo: '/roobet_logo.webp', // gold wordmark — already light, so no inversion
    logoInvert: false,
    periodLabel: 'Monthly',
    prizePool: 5000,
    prizes: [2200, 1200, 600, 300, 200, 160, 120, 100, 80, 40],
    // Shown on the board so nobody has to ask when prizes land.
    payout: 'Prizes are paid within 72 hours of the board closing',
    // Dev scaffolding only — NOT rendered. The site shows live API standings
    // or an explicit loading/unavailable state; showing these fictional names
    // next to real prize amounts would misrepresent the board.
    players: [
      { name: 'stackedbagg', wagered: 184200 },
      { name: 'luckyshoes', wagered: 152750 },
      { name: 'cloutchasede', wagered: 121400 },
      { name: 'maxwane', wagered: 98300 },
      { name: 'nyquix', wagered: 74110 },
      { name: 'zohaneel', wagered: 61980 },
      { name: 'pressplayng', wagered: 55240 },
      { name: 'rowdyy', wagered: 48900 },
      { name: 'kingofspins', wagered: 40120 },
      { name: 'ghostrider', wagered: 33450 },
    ],
  },
  {
    // The board we are leaving. It stays on the site only so the players
    // already on it can watch it finish and see what they are owed.
    //
    // DELIBERATELY NO `url`: we have moved to Roobet, so nothing here sends
    // anyone to BetBolt — no CTA on the leaderboard, no footer link, no
    // referral. Every consumer treats a missing `url` as "display only".
    //
    // When this period has been paid and published to /winners, delete this
    // entry and move it to `legacyCasinos` below (and eventually drop its
    // fetcher in api/_lib/leaderboard.js).
    id: 'betbolt',
    name: 'BetBolt',
    url: null,
    logo: '/betbolt_logo.png', // dark wordmark — inverted to white via CSS
    logoInvert: true,
    periodLabel: 'Final',
    closing: true,
    prizePool: 5000,
    prizes: [2200, 1200, 600, 300, 200, 160, 120, 100, 80, 40],
  },
]

// Partner casinos we no longer show a board for, kept ONLY so a finished
// period can still be published to /winners from /admin. Each needs an `id`,
// a `name` and the `prizes` ladder that period actually paid.
//
// Empty right now: BetBolt is still in `casinos` above because its final board
// is running. When that board is paid and archived, move it down here — and
// once it is published to /winners, drop it and its fetcher entirely.
export const legacyCasinos = []

// Everything /admin may publish a past period for.
export const archivableCasinos = [...casinos, ...legacyCasinos]

// ============================================================================
//  WAGER WEIGHTING — Roobet's own rule, reproduced here because the board and
//  the raffle both rank on the weighted figure rather than the raw stake.
//
//  Banded on RTP, NOT house edge: the two are inverses and quoting the wrong
//  one is exactly the kind of small error that reads as the board being
//  rigged. Every game counts for something, dice included. These are Roobet's
//  numbers — if they change them, this array is the only place to edit.
// ============================================================================
export const wagerWeights = [
  { band: 'RTP of 97% or lower', weight: '100%', note: 'Most slots and the bulk of the lobby' },
  { band: 'RTP between 97.01% and 98.99%', weight: '50%', note: 'Higher-RTP slots and table games' },
  { band: 'RTP of 99% and over', weight: '10%', note: 'Dice and the lowest-edge originals' },
]

/** Roobet's wording, kept close to theirs because it is their rule. */
export const wagerNote =
  'Leaderboard wager amounts may differ from your statistics on Roobet, depending on the games you are playing.'

// ============================================================================
//  WAGER MILESTONES — a one-off cash reward, paid by NSBROOKLYN, the first
//  time a player's total wager under code NSB passes each mark.
//
//  SLOTS ONLY — table games and live casino do not count toward these.
//
//  These hang off wager totals, not off the casino's own rank tiers (those
//  live in `roobetRanks` below and pay nothing by themselves). `tone` only
//  picks the card's accent colour, see .ms-node.<tone> in src/index.css.
// ============================================================================
export const milestones = [
  { key: 'm1', wager: 1_000, reward: 10, tone: 'silver' },
  { key: 'm2', wager: 2_500, reward: 25, tone: 'silver' },
  { key: 'm3', wager: 5_000, reward: 25, tone: 'gold' },
  { key: 'm4', wager: 10_000, reward: 50, tone: 'gold' },
  { key: 'm5', wager: 25_000, reward: 100, tone: 'emerald' },
  { key: 'm6', wager: 50_000, reward: 100, tone: 'emerald' },
  { key: 'm7', wager: 100_000, reward: 200, tone: 'ruby' },
  { key: 'm8', wager: 250_000, reward: 400, tone: 'ruby' },
  { key: 'm9', wager: 500_000, reward: 400, tone: 'diamond' },
  { key: 'm10', wager: 1_000_000, reward: 800, tone: 'immortal' },
]

// What a player has banked once they have passed each milestone. The ladder is
// cumulative — every milestone pays, so clearing all ten is worth the total,
// not just the last one.
export const milestonesCumulative = milestones.reduce((acc, m) => {
  const running = (acc.length ? acc[acc.length - 1].running : 0) + m.reward
  return [...acc, { ...m, running }]
}, [])

export const milestoneTotal = milestones.reduce((sum, m) => sum + m.reward, 0)

// ============================================================================
//  ROOBET VIP RANKS — Roobet's own progression ladder, shown on /ranks purely
//  as a reference for how far along a wager total puts you. Reaching one pays
//  nothing from NSBROOKLYN; the cash is in the wager milestones above.
//
//  `wager` is Roobet's published requirement for that tier in USD, `family`
//  picks the band's accent colour (see .rb-band.<family> in src/index.css),
//  and `icon` is Roobet's own art for that exact level. The /ranks page groups
//  these by family at render time, so the list stays flat and ordered.
// ============================================================================
export const roobetRanks = [
  { family: 'beginner',     familyName: 'Beginner',     level: '',    icon: '/ranks/beginner.png',       wager: 0 },
  { family: 'silver',       familyName: 'Silver',       level: 'I',   icon: '/ranks/silver1.png',        wager: 1_000 },
  { family: 'silver',       familyName: 'Silver',       level: 'II',  icon: '/ranks/silver2.png',        wager: 2_700 },
  { family: 'silver',       familyName: 'Silver',       level: 'III', icon: '/ranks/silver3.avif',       wager: 5_500 },
  { family: 'silver',       familyName: 'Silver',       level: 'IV',  icon: '/ranks/silver4.avif',       wager: 10_000 },
  { family: 'gold',         familyName: 'Gold',         level: 'I',   icon: '/ranks/gold1.png',          wager: 18_500 },
  { family: 'gold',         familyName: 'Gold',         level: 'II',  icon: '/ranks/gold2.png',          wager: 32_000 },
  { family: 'gold',         familyName: 'Gold',         level: 'III', icon: '/ranks/gold3.avif',         wager: 56_000 },
  { family: 'gold',         familyName: 'Gold',         level: 'IV',  icon: '/ranks/gold4.avif',         wager: 95_000 },
  { family: 'emerald',      familyName: 'Emerald',      level: 'I',   icon: '/ranks/emerald1.avif',      wager: 160_000 },
  { family: 'emerald',      familyName: 'Emerald',      level: 'II',  icon: '/ranks/emerald2.avif',      wager: 275_000 },
  { family: 'emerald',      familyName: 'Emerald',      level: 'III', icon: '/ranks/emerald3.avif',      wager: 460_000 },
  { family: 'ruby',         familyName: 'Ruby',         level: 'I',   icon: '/ranks/ruby1.avif',         wager: 785_000 },
  { family: 'ruby',         familyName: 'Ruby',         level: 'II',  icon: '/ranks/ruby2.avif',         wager: 1_300_000 },
  { family: 'ruby',         familyName: 'Ruby',         level: 'III', icon: '/ranks/ruby3.avif',         wager: 2_250_000 },
  { family: 'diamond',      familyName: 'Diamond',      level: 'I',   icon: '/ranks/diamond1.avif',      wager: 3_800_000 },
  { family: 'diamond',      familyName: 'Diamond',      level: 'II',  icon: '/ranks/diamond2.avif',      wager: 6_500_000 },
  { family: 'diamond',      familyName: 'Diamond',      level: 'III', icon: '/ranks/diamond3.avif',      wager: 10_000_000 },
  { family: 'champion',     familyName: 'Champion',     level: 'I',   icon: '/ranks/champion1.png',      wager: 18_000_000 },
  { family: 'champion',     familyName: 'Champion',     level: 'II',  icon: '/ranks/champion2.avif',     wager: 30_000_000 },
  { family: 'champion',     familyName: 'Champion',     level: 'III', icon: '/ranks/champion3.avif',     wager: 50_000_000 },
  { family: 'legend',       familyName: 'Legend',       level: 'I',   icon: '/ranks/legend1.png',        wager: 88_000_000 },
  { family: 'legend',       familyName: 'Legend',       level: 'II',  icon: '/ranks/legend2.png',        wager: 150_000_000 },
  { family: 'legend',       familyName: 'Legend',       level: 'III', icon: '/ranks/legend3.avif',       wager: 250_000_000 },
  { family: 'master',       familyName: 'Master',       level: 'I',   icon: '/ranks/master1.png',        wager: 425_000_000 },
  { family: 'master',       familyName: 'Master',       level: 'II',  icon: '/ranks/master2.png',        wager: 720_000_000 },
  { family: 'master',       familyName: 'Master',       level: 'III', icon: '/ranks/master3.avif',       wager: 1_200_000_000 },
  { family: 'grandmaster',  familyName: 'Grandmaster',  level: 'I',   icon: '/ranks/gm1.png',            wager: 2_000_000_000 },
  { family: 'grandmaster',  familyName: 'Grandmaster',  level: 'II',  icon: '/ranks/gm2.avif',           wager: 3_500_000_000 },
  { family: 'grandmaster',  familyName: 'Grandmaster',  level: 'III', icon: '/ranks/gm3.avif',           wager: 6_000_000_000 },
  { family: 'immortal',     familyName: 'Immortal',     level: '',    icon: '/ranks/immortal.avif',      wager: 10_000_000_000 },
]

export const rankCount = roobetRanks.length

/** Display name for one tier: "Silver III", or just "Immortal" where there
 *  is only a single level in the family. */
export const rankName = (r) => (r.level ? `${r.familyName} ${r.level}` : r.familyName)

/** The flat ladder grouped into its families, in ladder order. */
export const rankBands = roobetRanks.reduce((bands, r) => {
  const last = bands[bands.length - 1]
  if (last && last.family === r.family) last.tiers.push(r)
  else bands.push({ family: r.family, familyName: r.familyName, tiers: [r] })
  return bands
}, [])


// The four "choose your bonus" cards on the home page.
// `featured: true` gives the highlighted treatment.
// Rows are strings; use { group: '...' } to insert a small section label.
export const bonuses = [
  {
    img: '/drink.png',
    title: 'ROOBET',
    subtitle: 'Under code NSB',
    accent: 'gold',
    rows: [
      { group: 'First deposit' },
      'Deposit $50+, wager $1,000 or 5x it → $50',
      '10% deposit bonus up to $2,500',
      { group: 'Everyone' },
      '5% lossback, up to $100 a day',
      'Free spins daily & weekly',
      'VIP transfers at 50k+ a month',
    ],
    cta: 'CLAIM BONUS',
    href: 'https://roobet.com/?ref=nsb',
  },
  {
    img: '/orb.png',
    title: '$5,000', // tip: keep in sync with config.prizePool
    subtitle: 'Leaderboard Pool',
    accent: 'gold',
    featured: true,
    rows: [
      'Must be under code NSB',
      'Wager on Roobet to enter',
      'Climb to secure Top Places',
      'Win big rewards & enjoy!',
    ],
    cta: 'VIEW LEADERBOARD',
    to: '/leaderboard',
  },
  {
    img: '/giftbox.png',
    title: 'GIVEAWAYS',
    subtitle: 'Daily & free to enter',
    accent: 'gold',
    rows: [
      { group: 'Daily giveaways' },
      'New giveaway every day',
      'Log in with Discord & click enter',
      'No wagering needed — totally free',
      { group: 'Weekly wager raffle' },
      'Every $100 wagered = 1 ticket',
      '5 winners share $250 each week',
    ],
    cta: 'ENTER GIVEAWAYS',
    to: '/giveaways',
  },
  {
    img: '/gold_pot.png',
    title: 'WAGER MILESTONES',
    subtitle: 'From me personally',
    accent: 'gold',
    rows: [
      { group: 'Ten cash milestones' },
      '$10 at $1,000 wagered',
      'Up to $800 at $1M wagered',
      '$2,110 if you clear them all',
      { group: 'Slots only' },
      'Every milestone you pass pays',
      'Claimed instantly via Discord',
    ],
    cta: 'VIEW MILESTONES',
    to: '/milestones',
  },
]

// Past leaderboard periods for the /winners page. Add an entry after each
// period ends and it will render automatically (newest first).
//
// NOTE: `prize` is whatever that period actually paid — the July board ran on
// the old $2,500 ladder, before the pool doubled to $5,000. Don't restate old
// periods at current rates. These are BetBolt-era boards, kept for the record.
export const pastWinners = [
  {
    id: '2026-07',
    label: 'July 1 — July 31, 2026',
    prizePool: 2500,
    // Optional — rendered as a badge on /winners. Omit if a period's prizes
    // haven't gone out yet.
    paid: 'Paid within 48 hours',
    winners: [
      { rank: 1, name: 'nspswitch', wagered: 207891.34, prize: 1100 },
      { rank: 2, name: 'NSBbastard', wagered: 181516.80, prize: 600 },
      { rank: 3, name: 'HardR', wagered: 19346.09, prize: 300 },
      { rank: 4, name: 'Beboy03', wagered: 13548.02, prize: 150 },
      { rank: 5, name: 'Maccyb', wagered: 5533.59, prize: 100 },
      { rank: 6, name: 'Boofydoo', wagered: 4424.70, prize: 80 },
      { rank: 7, name: 'jasonthefather', wagered: 4000.08, prize: 60 },
      { rank: 8, name: 'valerie', wagered: 3171.33, prize: 50 },
      { rank: 9, name: 'Relaxwithgeebee', wagered: 1739.47, prize: 40 },
      { rank: 10, name: 'J2E2F7', wagered: 1692.86, prize: 20 },
    ],
  },
]
