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
]

// ============================================================================
//  RANK MILESTONES — a one-off cash reward, paid by NSBROOKLYN, the first
//  time a player reaches each BetBolt VIP rank under code NSB.
//
//  `from`/`to` are BetBolt's own wager range for that rank (levels I–V), and
//  `perks` is how many of the PERKS list below the rank unlocks — BetBolt
//  grants them cumulatively, so a count is enough to describe each tier.
//  Icons are BetBolt's rank art in /public.
// ============================================================================

// Every VIP perk in unlock order. A rank's `perks` count unlocks the first N.
export const rankPerks = [
  'Daily Reward',
  'Weekly Reward',
  'Monthly Reward',
  'Tailored Bonusing',
  'VIP Channel',
  'Level Up Reward',
  'Tier Up Reward',
  'Personal Host',
  'Private Events',
]

export const milestones = [
  { key: 'rock', name: 'Rock', levels: '', icon: '/rock_0.webp', from: 1_000, to: 10_000, perks: 3, reward: 10 },
  { key: 'bronze', name: 'Bronze', levels: 'I–V', icon: '/bronze_5.webp', from: 10_000, to: 50_000, perks: 3, reward: 25 },
  { key: 'silver', name: 'Silver', levels: 'I–V', icon: '/silver_5.webp', from: 75_000, to: 180_000, perks: 3, reward: 75 },
  { key: 'gold', name: 'Gold', levels: 'I–V', icon: '/gold_5.webp', from: 250_000, to: 550_000, perks: 4, reward: 180 },
  { key: 'platinum', name: 'Platinum', levels: 'I–V', icon: '/platinum_5.webp', from: 700_000, to: 1_300_000, perks: 6, reward: 400 },
  { key: 'titanium', name: 'Titanium', levels: 'I–V', icon: '/titanium_5.webp', from: 1_500_000, to: 3_500_000, perks: 8, reward: 1_000 },
  { key: 'pearl', name: 'Pearl', levels: 'I–V', icon: '/pearl_5.webp', from: 5_000_000, to: 12_000_000, perks: 8, reward: 2_500 },
  { key: 'diamond', name: 'Diamond', levels: 'I–V', icon: '/diamond_5.webp', from: 15_000_000, to: 100_000_000, perks: 9, reward: 7_000 },
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
    title: 'RANK REWARDS',
    subtitle: 'From me personally',
    accent: 'gold',
    rows: [
      { group: 'Every BetBolt VIP rank' },
      '$10 at Rock up to $7,000 at Diamond',
      '$11,190 across all eight ranks',
      { group: 'Plus' },
      'Bi-weekly lossback up to 10%',
      'Claimed instantly via Discord',
    ],
    cta: 'VIEW RANK REWARDS',
    to: '/milestones',
  },
]

// Past leaderboard periods for the /winners page. Add an entry after each
// period ends and it will render automatically (newest first).
//
// NOTE: `prize` is whatever that period actually paid — the July board ran on
// the old $2,500 ladder, before the pool doubled to $5,000. Don't restate old
// periods at current rates.
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
