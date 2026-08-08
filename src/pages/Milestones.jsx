import { config, milestones, milestoneTotal } from '../data/leaderboard'
import { fmtMoney } from '../utils'
import RankTier, { fmtWager } from '../components/RankTier'
import { IconExternal, IconDiscord } from '../components/icons'

export default function Milestones() {
  const paid = milestones.filter((m) => m.reward > 0)
  const top = paid[paid.length - 1]

  return (
    <section className="section" id="milestones">
      <div className="container">
        <div className="section-head">
          <h2 className="bonus-heading">RANK MILESTONES</h2>
          <p className="bonus-heading-sub">Under code <span>{config.referralCode}</span></p>
        </div>

        {/* Headline callout — the total on offer across every rank */}
        <div className="rk-callout">
          <div className="rk-callout-badge">
            <span className="amt">{fmtMoney(milestoneTotal)}</span>
            <span className="per">on offer</span>
          </div>
          <div className="rk-callout-text">
            <h3>
              Hit a BetBolt VIP rank, <span className="gld">I pay you</span>{' '}
              <span className="wht">on top</span>.
            </h3>
            <p>
              Every rank you reach on BetBolt under code <strong>{config.referralCode}</strong> pays
              out from me personally — {fmtMoney(paid[0].reward)} at {paid[0].name} all the way to{' '}
              {fmtMoney(top.reward)} at {top.name}. That's on top of BetBolt's own VIP perks, the{' '}
              {fmtMoney(config.prizePool)} leaderboard and the giveaways.
            </p>
          </div>
          <a className="btn btn-primary rk-callout-cta" href="https://betbolt.com/?r=NSB" target="_blank" rel="noreferrer">
            Start ranking up <IconExternal />
          </a>
        </div>

        <div className="rk-grid">
          {milestones.map((tier) => <RankTier key={tier.key} tier={tier} />)}
        </div>

        {/* HOW IT WORKS */}
        <div className="gw-steps">
          <div className="gw-step">
            <span className="gw-step-n">1</span>
            <h4>Play under code {config.referralCode}</h4>
            <p>Your BetBolt account has to be registered under code {config.referralCode} for wagers to count.</p>
          </div>
          <div className="gw-step">
            <span className="gw-step-n">2</span>
            <h4>Reach a rank</h4>
            <p>
              Ranks are BetBolt's own VIP tiers — {fmtWager(paid[0].from)} wagered gets you{' '}
              {paid[0].name}. Each one pays once, the first time you reach it.
            </p>
          </div>
          <div className="gw-step">
            <span className="gw-step-n">3</span>
            <h4>Claim it in Discord</h4>
            <p>Open a ticket with your username and a screenshot of the rank, and I'll send it over.</p>
          </div>
        </div>

        <div className="ms-cta">
          <a className="btn btn-primary" href={config.socials.discord} target="_blank" rel="noreferrer">
            <IconDiscord /> Claim via Discord
          </a>
        </div>

        <p className="section-sub" style={{ textAlign: 'center', marginTop: 22, fontSize: 13 }}>
          Wager ranges and VIP perks are set by BetBolt and may change. Rank rewards are paid by
          NSBROOKLYN, once per rank, per player. 18+ only.
        </p>
      </div>
    </section>
  )
}
