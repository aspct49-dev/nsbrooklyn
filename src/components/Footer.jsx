import { site, casinos, socials, navLinks } from '../config/site'

export default function Footer() {
  const year = new Date().getFullYear()
  const casinoNames = casinos.map((c) => c.name).join(' or ')

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <img src={site.logo} alt={`${site.brand} logo`} />
            <p>{site.tagline} Entertainment &amp; recreation — play responsibly.</p>
          </div>

          <div className="footer-cols">
            <div className="footer-col">
              <h4>Explore</h4>
              {navLinks.map((l) => (
                <a key={l.href} href={l.href}>
                  {l.label}
                </a>
              ))}
            </div>
            <div className="footer-col">
              <h4>Play</h4>
              {casinos.map((c) => (
                <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer">
                  {c.name}
                </a>
              ))}
            </div>
            <div className="footer-col">
              <h4>Follow</h4>
              {socials.map((s) => (
                <a key={s.type} href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-disclaimer">
          <div className="age-badge">
            <span className="pill">18+</span>
            <span>
              Gambling can be addictive. Play responsibly. If you or someone you
              know has a gambling problem, seek help.
            </span>
          </div>
        </div>

        <p className="footer-legal">
          {site.brand} is an independent promoter and is not the operator of{' '}
          {casinoNames}. All trademarks belong to their respective owners.
          Rewards, leaderboards, and prize pools are provided at the discretion
          of {site.brand} and may change at any time. Void where prohibited. You
          must meet the legal gambling age in your jurisdiction to participate.
        </p>

        <p className="footer-copy">
          © {year} {site.brand} · Entertainment &amp; Recreation. All rights
          reserved.
        </p>
      </div>
    </footer>
  )
}
