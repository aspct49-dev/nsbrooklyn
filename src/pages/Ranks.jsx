import { config, casinos, rankBands, rankCount, rankName, roobetRanks } from '../data/leaderboard'
import { fmtWager } from '../utils'
import { IconExternal } from '../components/icons'

const [casino] = casinos

export default function Ranks() {
  const first = roobetRanks[1] // Beginner is the floor; Silver I is the first climb
  const last = roobetRanks[roobetRanks.length - 1]

  return (
    <section className="section" id="ranks">
      <div className="container">
        <div className="section-head">
          <h2 className="bonus-heading">ROOBET VIP RANKS</h2>
          <p className="bonus-heading-sub">
            All {rankCount} tiers — <span>Beginner to Immortal</span>
          </p>
        </div>

        {/* HERO — what the ladder is and where it ends */}
        <div className="rb-hero">
          <img className="rb-hero-art" src={last.icon} alt="" />
          <div className="rb-hero-text">
            <h3>
              {casino.name}'s own ladder, <span className="gld">all {rankCount} tiers</span>.
            </h3>
            <p>
              Climbing unlocks {casino.name}'s VIP perks — rakeback, free spins, bonuses and a
              personal host near the top. Ranks are {casino.name}'s and pay nothing from me
              directly; my cash is on the{' '}
              <a className="rb-hero-link" href="/milestones">wager milestones</a>.
            </p>
            <div className="rb-hero-stats">
              <span><b>{fmtWager(first.wager)}</b> to leave Beginner</span>
              <span><b>{fmtWager(last.wager)}</b> for Immortal</span>
              <span><b>{rankBands.length}</b> families</span>
            </div>
          </div>
          <a className="btn btn-primary rb-hero-cta" href={casino.url} target="_blank" rel="noreferrer">
            Start climbing <IconExternal />
          </a>
        </div>

        {/* THE LADDER — one band per family, tiers running left to right */}
        <div className="rb-ladder">
          {rankBands.map((band) => (
            <div className={`rb-band ${band.family}`} key={band.family}>
              <div className="rb-band-label">
                <span className="rb-band-name">{band.familyName}</span>
                <span className="rb-band-count">
                  {band.tiers.length} {band.tiers.length === 1 ? 'tier' : 'tiers'}
                </span>
              </div>

              <div className="rb-band-tiers">
                {band.tiers.map((tier) => (
                  <div className="rb-tier" key={rankName(tier)}>
                    <img className="rb-tier-icon" src={tier.icon} alt="" loading="lazy" />
                    <span className="rb-tier-name">{rankName(tier)}</span>
                    <span className="rb-tier-wager">{fmtWager(tier.wager)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="section-sub rb-fine">
          Wager requirements and VIP perks are set by {casino.name} and may change — this page
          mirrors their published ladder. Wagers are weighted by the game’s
          RTP — the bands are published on the <a href="/leaderboard">leaderboard</a> page. Play
          under code{' '}
          <strong>{config.referralCode}</strong>. 18+ only.
        </p>
      </div>
    </section>
  )
}
