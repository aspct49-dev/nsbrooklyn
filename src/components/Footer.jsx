import { Link } from 'react-router-dom'
import { config, casinos } from '../data/leaderboard'
import { IconDiscord, IconKick, IconX } from './icons'

export default function Footer() {
  const s = config.socials
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="f-brand">
              <img src="/nsbrooklyn.png" alt="NSBROOKLYN" />
              <span>{config.brandName}</span>
            </div>
            <p className="f-desc">
              The official {config.casinoNames} leaderboards for code{' '}
              <strong>{config.referralCode}</strong>. Wager, climb the ranks, and win
              your share of the prize pools.
            </p>
          </div>

          <div className="f-col">
            <h4>Navigate</h4>
            <Link to="/">Home</Link>
            <Link to="/leaderboard">Leaderboards</Link>
            <Link to="/#bonuses">Bonuses</Link>
            {casinos.map((c) => (
              <a key={c.id} href={c.url} target="_blank" rel="noreferrer">Play on {c.name}</a>
            ))}
          </div>

          <div className="f-col">
            <h4>Community</h4>
            <a href={s.discord} target="_blank" rel="noreferrer">Discord</a>
            <a href={s.x} target="_blank" rel="noreferrer">X / Twitter</a>
            <a href={s.kick} target="_blank" rel="noreferrer">Kick</a>
          </div>

          <div className="f-col">
            <h4>Legal</h4>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/responsible-gambling">Responsible Gambling</Link>
          </div>
        </div>

        {/* Responsible gambling / 18+ bar */}
        <div className="rg-bar">
          <span className="rg-18">18+</span>
          <p>
            Gamble responsibly. Gambling can be addictive — please play within your limits and never
            wager more than you can afford to lose. If you or someone you know has a gambling problem,
            visit{' '}
            <a href="https://www.begambleaware.org/" target="_blank" rel="noreferrer">BeGambleAware.org</a>{' '}
            or call the National Gambling Helpline. You must be 18+ (or the legal age in your
            jurisdiction) to participate. See our{' '}
            <Link to="/responsible-gambling">Responsible Gambling</Link> page.
          </p>
        </div>

        <p className="disclaimer">
          {config.brandName} is an independent affiliate of {config.casinoNames} and is not owned or
          operated by either casino. We may earn a commission when you sign up or play using code{' '}
          {config.referralCode} or our links. Nothing here is a guarantee of winnings; gambling
          involves real financial risk. You must be of legal age in your jurisdiction to participate.
          Please play responsibly. 18+ only.
        </p>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {config.brandName}. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href={s.discord} target="_blank" rel="noreferrer" aria-label="Discord"><IconDiscord /></a>
            <a href={s.x} target="_blank" rel="noreferrer" aria-label="X"><IconX /></a>
            <a href={s.kick} target="_blank" rel="noreferrer" aria-label="Kick"><IconKick /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}
