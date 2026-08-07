import { config, milestones, milestoneTotal } from '../data/leaderboard'
import { fmtMoney } from '../utils'
import { IconExternal, IconDiscord } from '../components/icons'

// 1000 → "$1K", 5000000 → "$5M"
function fmtWager(n) {
  if (n >= 1_000_000) return `$${n / 1_000_000}M`
  if (n >= 1_000) return `$${n / 1_000}K`
  return fmtMoney(n)
}

export default function Milestones() {
  const top = milestones[milestones.length - 1]

  return (
    <section className="section" id="milestones">
      <div className="container">
        {/* HEADER */}
        <div className="lb-hero">
          <span className="gw-eyebrow">Wager Milestones</span>
          <h1 className="lb-title">
            <span className="grad">{fmtMoney(milestoneTotal)}</span> <span className="white">in</span><br />
            <span className="grad">Milestone Rewards</span>
          </h1>
          <p className="lb-sub">
            Wager on BetBolt under code {config.referralCode} and every tier you cross
            pays out — all the way up to {fmtMoney(top.reward)} at {fmtWager(top.wager)} wagered.
          </p>

          <div className="lb-actions">
            <div className="code-chip">
              <span className="label">CODE:</span>
              <span className="code">{config.referralCode}</span>
            </div>
            <a className="btn btn-primary" href="https://betbolt.com/?r=NSB" target="_blank" rel="noreferrer">
              Wager on BetBolt <IconExternal />
            </a>
          </div>
        </div>

        {/* LADDER */}
        <div className="ms-ladder">
          {milestones.map((m, i) => (
            <div className={`ms-card ${i === milestones.length - 1 ? 'top' : ''}`} key={m.wager}>
              <span className="ms-tier">Tier {i + 1}</span>
              <div className="ms-wager">{fmtWager(m.wager)}</div>
              <div className="ms-wager-lbl">Wagered</div>
              <div className="ms-arrow" aria-hidden="true">▾</div>
              <div className="ms-reward">{fmtMoney(m.reward)}</div>
              <div className="ms-reward-lbl">Reward</div>
            </div>
          ))}
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
            <h4>Hit a tier</h4>
            <p>Milestones are paid once each, the first time you cross that total wagered.</p>
          </div>
          <div className="gw-step">
            <span className="gw-step-n">3</span>
            <h4>Claim it in Discord</h4>
            <p>Open a ticket in the Discord with your username and I'll send it over.</p>
          </div>
        </div>

        <div className="ms-cta">
          <a className="btn btn-primary" href={config.socials.discord} target="_blank" rel="noreferrer">
            <IconDiscord /> Claim via Discord
          </a>
        </div>

        <p className="section-sub" style={{ textAlign: 'center', marginTop: 22, fontSize: 13 }}>
          Milestone rewards are paid from me personally, on top of the leaderboard and
          giveaway prizes. One payout per tier, per player. 18+ only.
        </p>
      </div>
    </section>
  )
}
