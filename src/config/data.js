/**
 * Placeholder content, keyed by casino id.
 * Usernames are masked tegens-style (first + last char) — swap for real
 * API data later and mask the same way.
 */

// Top wagerers per casino, ordered highest → lowest.
export const leaderboards = {
  betbolt: [
    { rank: 1, player: 's********g', wagered: 184200, prize: '$1,250' },
    { rank: 2, player: 'l******s',   wagered: 152750, prize: '$750' },
    { rank: 3, player: 'c*********e', wagered: 121400, prize: '$500' },
    { rank: 4, player: 'm*****e',    wagered: 98300,  prize: '$200' },
    { rank: 5, player: 'n****x',     wagered: 74110,  prize: '$120' },
    { rank: 6, player: 'z******l',   wagered: 61980,  prize: '$75' },
    { rank: 7, player: 'p********g', wagered: 55240,  prize: '$45' },
    { rank: 8, player: 'r*****y',    wagered: 48900,  prize: '$30' },
    { rank: 9, player: 'k********s', wagered: 40120,  prize: '$20' },
    { rank: 10, player: 'g********r', wagered: 33450, prize: '$10' },
  ],
  casebattle: [
    { rank: 1, player: 'k******d',   wagered: 96400, prize: '$1,250' },
    { rank: 2, player: 'd********e', wagered: 88210, prize: '$750' },
    { rank: 3, player: 'c********9', wagered: 71350, prize: '$500' },
    { rank: 4, player: 's********r', wagered: 64020, prize: '$200' },
    { rank: 5, player: 'u********d', wagered: 51890, prize: '$120' },
    { rank: 6, player: 'f*******k',  wagered: 44760, prize: '$75' },
    { rank: 7, player: 's********x', wagered: 38900, prize: '$45' },
    { rank: 8, player: 'g************r', wagered: 31240, prize: '$30' },
    { rank: 9, player: 'b******m',   wagered: 26780, prize: '$20' },
    { rank: 10, player: 'p*********k', wagered: 21050, prize: '$10' },
  ],
}

// Leaderboard FAQ (accordion).
export const faqs = [
  {
    q: 'How do I enter the leaderboards?',
    a: 'Sign up on BetBolt or CaseBattle using code NSBROOKLYN. Once the code is on your account, every wager you make counts toward that site’s board automatically — no extra steps.',
  },
  {
    q: 'Do both sites share one leaderboard?',
    a: 'No — BetBolt and CaseBattle each run their own board with their own prize pool. The code is the same on both, and you can compete on both at once.',
  },
  {
    q: 'When and how are prizes paid?',
    a: 'Prizes are paid at the end of each monthly period, typically within 48 hours, to your balance on the site where you placed.',
  },
  {
    q: 'How often do standings update?',
    a: 'Standings update as wagers are processed. Usernames are masked for privacy.',
  },
  {
    q: 'What do I get besides the leaderboard?',
    a: 'The code also unlocks each site’s bonuses — rakeback and deposit bonus on BetBolt, free cases and wager rewards on CaseBattle. Check the Bonuses section above.',
  },
]
