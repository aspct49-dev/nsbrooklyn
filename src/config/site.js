/**
 * ────────────────────────────────────────────────────────────────
 *  SITE CONFIG — edit everything about the brand here.
 *  (Colors live in src/styles/theme.css — this file is content only.)
 * ────────────────────────────────────────────────────────────────
 */

export const site = {
  // Brand
  brand: 'NSBROOKLYN',
  tagline: 'Ride with the crew.',
  logo: '/nsbrooklyn.png', // transparent logo, served from /public
}

/**
 * The two partner casinos. Each gets its own leaderboard tab,
 * offer card, referral code, and accent colorway.
 * `accent` / `accent2` drive that casino's gradient + glow.
 */
export const casinos = [
  {
    id: 'betbolt',
    name: 'BetBolt',
    icon: 'bolt',
    logo: '/betbolt.png', // transparent wordmark, dark text — rendered on a light plate
    logoPlate: true,
    code: 'NSBROOKLYN',
    url: 'https://betbolt.com/?r=NSBROOKLYN', // ← replace with real affiliate link
    ctaLabel: 'Play on BetBolt',
    bonus: 'Instant rakeback + deposit bonus with the code',
    perks: [
      'Sign up with code NSBROOKLYN',
      'Instant rakeback on wagers',
      'Deposit bonus on first deposit',
      'Wagers count toward the board',
    ],
    accent: '#3654f4', // BetBolt electric blue (from the bolt mark)
    accent2: '#1f36c7',
    accentText: '#ffffff', // text color on accent-filled buttons
    prizePool: '$3,000',
    period: 'Monthly Leaderboard',
    resetsAt: '2026-08-01T00:00:00Z',
    payouts: 'Top 10 paid',
  },
  {
    id: 'casebattle',
    name: 'CaseBattle',
    icon: 'swords',
    logo: '/casebattle.jpg', // square app icon — masked with a border radius
    logoPlate: false,
    code: 'NSBROOKLYN',
    url: 'https://casebattle.com/?r=NSBROOKLYN', // ← replace with real affiliate link
    ctaLabel: 'Open cases on CaseBattle',
    bonus: 'Free cases + wager rewards with the code',
    perks: [
      'Use code NSBROOKLYN at sign-up',
      'Free cases when you join',
      'Wager rewards as you open',
      'Wagers count toward the board',
    ],
    accent: '#f2a71b', // CaseBattle gold (from the ninja cube)
    accent2: '#c97b0e',
    accentText: '#2a1c02', // text color on accent-filled buttons
    prizePool: '$3,000',
    period: 'Monthly Leaderboard',
    resetsAt: '2026-08-01T00:00:00Z',
    payouts: 'Top 10 paid',
  },
]

// Total shown in the hero — keep in sync with the pools above.
export const totalPrizePool = '$6,000'

// CSS custom properties that cascade a casino's accent into a subtree.
export const accentVars = (c) => ({
  '--lb-accent': c.accent,
  '--lb-accent2': c.accent2,
  '--lb-accent-text': c.accentText,
})

// Social links — remove any you don't use; icons are matched by `type`.
export const socials = [
  { type: 'kick', label: 'Kick', url: 'https://kick.com/' },
  { type: 'twitch', label: 'Twitch', url: 'https://twitch.tv/' },
  { type: 'youtube', label: 'YouTube', url: 'https://youtube.com/' },
  { type: 'x', label: 'X', url: 'https://x.com/' },
  { type: 'discord', label: 'Discord', url: 'https://discord.gg/' },
  { type: 'instagram', label: 'Instagram', url: 'https://instagram.com/' },
]

// Nav links (anchor to section ids on the page).
export const navLinks = [
  { label: 'Bonuses', href: '#bonuses' },
  { label: 'Leaderboards', href: '#leaderboards' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Socials', href: '#socials' },
]
