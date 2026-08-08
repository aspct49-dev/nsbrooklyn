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
  casinoNames: 'BetBolt',

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
// ============================================================================
export const casinos = [
  {
    id: 'betbolt',
    name: 'BetBolt',
    url: 'https://betbolt.com/?r=NSB',
    logo: '/betbolt_logo.png', // transparent wordmark (dark text — inverted to white via CSS)
    logoInvert: true,
    periodLabel: 'Monthly',
    prizePool: 5000,
    prizes: [2200, 1200, 600, 300, 200, 160, 120, 100, 80, 40],
    // Placeholder standings — swap for real API data later. Names are masked
    // on render ("BlazeKing" -> "B*******g"), so full names are fine here.
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
]

// ============================================================================
//  WAGER MILESTONES — one-off rewards paid the first time a player crosses
//  each tier while wagering on BetBolt under code NSB. Claimed via Discord.
// ============================================================================
export const milestones = [
  { wager: 500_000, reward: 500 },
  { wager: 1_000_000, reward: 1_000 },
  { wager: 5_000_000, reward: 5_000 },
]

export const milestoneTotal = milestones.reduce((sum, m) => sum + m.reward, 0)

// The four "choose your bonus" cards on the home page.
// `featured: true` gives the highlighted treatment.
// Rows are strings; use { group: '...' } to insert a small section label.
export const bonuses = [
  {
    img: '/drink.png',
    title: 'BETBOLT',
    subtitle: 'Under code NSB',
    accent: 'gold',
    rows: [
      'Instant lossback from BetBolt',
      'Daily, weekly & monthly bonuses',
      'Juicy level-up bonus',
      'VIP transfers',
      'Exclusive VIP program for high rollers',
    ],
    cta: 'CLAIM BONUS',
    href: 'https://betbolt.com/?r=NSB',
  },
  {
    img: '/orb.png',
    title: '$5,000', // tip: keep in sync with config.prizePool
    subtitle: 'Leaderboard Pool',
    accent: 'gold',
    featured: true,
    rows: [
      'Must be under code NSB',
      'Wager on BetBolt to enter',
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
    title: 'MILESTONES',
    subtitle: 'From me personally',
    accent: 'gold',
    rows: [
      { group: 'Wager rewards' },
      '$500K, $1M and $5M wager tiers',
      'Up to $5,000 per milestone',
      { group: 'Plus' },
      'Bi-weekly lossback up to 10%',
      'Claimed instantly via Discord',
    ],
    cta: 'VIEW MILESTONES',
    to: '/milestones',
  },
]

// Past leaderboard periods for the /winners page. Add an entry after each
// period ends and it will render automatically (newest first).
// Example:
// {
//   id: '2026-06', label: 'June 2026', prizePool: 5000,
//   winners: [{ rank: 1, name: 'stackedbagg', wagered: 210500, prize: 2200 }, …],
// }
export const pastWinners = []
