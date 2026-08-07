import { Link } from 'react-router-dom'
import { config, casinos } from '../data/leaderboard'
import { fmtMoney } from '../utils'
import BonusCards from '../components/BonusCards'
import PromoBanner from '../components/PromoBanner'
import { IconExternal, IconGift } from '../components/icons'

const [betbolt] = casinos

export default function Home() {
  return (
    <>
      {/* HERO */}
      <div className="container">
        <section className="hero">
          <img className="hero-art" src="/nsbrooklyn.png" alt="" aria-hidden="true" />
          <div className="hero-inner">
            <span className="hero-tag"><span className="dot" /> BETBOLT PARTNER · CODE {config.referralCode}</span>
            <h1>
              <span className="grad">{fmtMoney(config.prizePool)}</span><br />
              LEADERBOARD
            </h1>
            <p>
              Climb to the top of the {betbolt.name} leaderboard under
              code <strong>{config.referralCode}</strong> and win your share of crazy prizes —
              plus weekly giveaways and wager milestones on top.
            </p>
            <div className="code-row">
              <div className="code-chip">
                <span className="label">USE CODE</span>
                <span className="code">{config.referralCode}</span>
              </div>
            </div>
            <div className="hero-actions">
              <a className="btn btn-primary" href={betbolt.url} target="_blank" rel="noreferrer">
                Play on {betbolt.name} <IconExternal />
              </a>
              <Link className="btn btn-ghost" to="/giveaways">
                <IconGift /> Weekly giveaway
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* BONUS CARDS */}
      <BonusCards />

      {/* $6K LEADERBOARD PROMO */}
      <PromoBanner />
    </>
  )
}
