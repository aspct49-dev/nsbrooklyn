// ============================================================================
//  NSBROOKLYN LEADERBOARDS — EDIT EVERYTHING HERE
// ----------------------------------------------------------------------------
//  This is the only file you need to touch to update the site's content.
//  Change the prize pools, the casinos/code, the countdown end date, and the
//  player lists below. The site rebuilds the podium + tables automatically.
// ============================================================================

export const config = {
  brandName: 'NSBROOKLYN',
  referralCode: 'NSB',
  // Shown on the legal pages. TODO: replace with your real support email
  // (or leave it — the legal pages also point users to your Discord).
  contactEmail: 'support@nsbrooklyn.com',
  prizePool: 3000, // combined $ pool across both casinos, shown in the hero

  // Both partner casinos are joined with this on legal pages / footer.
  casinoNames: 'BetBolt & CaseBattle',

  // The active leaderboard period (dates inclusive, 'YYYY-MM-DD'). The
  // countdown ticks down to the end of `endAt` UTC. Update each period.
  leaderboard: {
    startAt: '2026-07-01',
    endAt: '2026-07-31',
  },

  // Decorative profile pictures by rank (1st, 2nd, 3rd). Ranks past this list
  // fall back to the player's initial. Files live in /public.
  rankAvatars: ['/magicpiggy.png', '/befy.png', '/pug.png'],

  socials: {
    discord: 'https://discord.com/invite/nsbrooklyntv',
    x: 'https://x.com/NSBrooklyn',
    kick: 'https://kick.com/nsbrooklyntv',
  },

  // Promo banner under the bonus cards on the home page. The top-3 winner
  // cards pull from the first casino's board so they match the leaderboard.
  promo: {
    amount: 3000,
    title: 'LEADERBOARD',
    subtitle: 'Climb to the top of the leaderboards & win crazy prizes!',
    cta: 'View Leaderboards',
    to: '/leaderboard',
  },
}

// ============================================================================
//  CASINOS — one entry per partner site. Each gets its own leaderboard tab,
//  prize ladder and player list. `prizes` are per rank, 1st → last; players
//  are ranked by wagered amount. (Each prize list sums to that casino's pool.)
// ============================================================================
export const casinos = [
  {
    id: 'betbolt',
    name: 'BetBolt',
    url: 'https://betbolt.com/?r=NSB',
    logo: '/betbolt_logo.png', // transparent wordmark (dark text — inverted to white via CSS)
    logoInvert: true,
    prizePool: 2500,
    prizes: [1100, 600, 300, 150, 100, 80, 60, 50, 40, 20],
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
  {
    id: 'casebattle',
    name: 'CaseBattle',
    url: 'https://casebattle.com/r/NSB',
    logo: '/casebattle_logo.png', // square ninja-cube icon — masked with a border radius
    // Rendered as icon + styled wordmark ("Case" white / "Battle" orange),
    // matching casebattle.com's own branding.
    brandIcon: '/casebattle_logo.png',
    brandParts: [
      { text: 'Case', color: '#ffffff' },
      { text: 'Battle', color: '#f7a11b' },
    ],
    prizePool: 500,
    prizes: [250, 125, 75, 30, 20],
    players: [
      { name: 'knifelord', wagered: 96400 },
      { name: 'dragonlore', wagered: 88210 },
      { name: 'caseopen99', wagered: 71350 },
      { name: 'skinsniper', wagered: 64020 },
      { name: 'unboxgod', wagered: 51890 },
      { name: 'fadecheck', wagered: 44760 },
      { name: 'stattrakx', wagered: 38900 },
      { name: 'goldenbutterflyr', wagered: 31240 },
      { name: 'bluegem', wagered: 26780 },
      { name: 'pinkslipnick', wagered: 21050 },
    ],
  },
]

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
    title: '$3,000', // tip: keep in sync with config.prizePool
    subtitle: 'Leaderboard Pools',
    accent: 'gold',
    featured: true,
    rows: [
      'Must be under code NSB',
      'Wager on BetBolt or CaseBattle',
      'Climb to secure Top Places',
      'Win big rewards & enjoy!',
    ],
    cta: 'VIEW LEADERBOARDS',
    to: '/leaderboard',
  },
  {
    img: '/gold_pot.png',
    title: 'CASEBATTLE',
    subtitle: 'Under code NSB',
    accent: 'gold',
    rows: [
      'Daily promo codes',
      'Up to 10% lossback',
      '5% deposit bonus from the site',
    ],
    cta: 'CLAIM BONUS',
    href: 'https://casebattle.com/r/NSB',
  },
  {
    img: '/red_gem.png',
    title: 'NSBROOKLYN',
    subtitle: 'From me personally',
    accent: 'gold',
    rows: [
      { group: 'On BetBolt' },
      'Bi-weekly lossback up to 10%',
      '$500 biweekly leaderboard',
      'Wager milestones — coming July 7th',
      { group: 'On CaseBattle' },
      '5% deposit bonus from me',
    ],
    cta: 'CLAIM VIA DISCORD',
    href: config.socials.discord,
  },
]

// Past leaderboard periods for the /winners page. Add an entry after each
// period ends and it will render automatically (newest first).
// Example:
// {
//   id: '2026-06', label: 'June 2026', prizePool: 6000,
//   winners: [{ rank: 1, name: 'stackedbagg', wagered: 210500, prize: 2000 }, …],
// }
export const pastWinners = []
