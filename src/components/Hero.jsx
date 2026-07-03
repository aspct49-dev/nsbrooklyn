import { useState } from 'react'
import { site, casinos, totalPrizePool, accentVars } from '../config/site'
import { Icon } from './icons'

export default function Hero() {
  const [copied, setCopied] = useState(false)
  const code = casinos[0].code

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      /* clipboard may be blocked; ignore */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <section className="hero section" id="top">
      <div className="container">
        <div className="hero-card">
          <div className="hero-card-body">
            <span className="hero-badge">
              <span className="dot" />
              BETBOLT &amp; CASEBATTLE PARTNER · CODE {code}
            </span>

            <h1 className="hero-title">
              <span className="line-pool text-gold">{totalPrizePool}</span>
              <span className="line-word">Leaderboards</span>
            </h1>

            <p className="hero-sub">
              Climb the boards on BetBolt and CaseBattle under code{' '}
              <b>{code}</b> and win your share of crazy prizes every month.
            </p>

            <button className={`code-pill ${copied ? 'copied' : ''}`} onClick={copyCode}>
              <span className="label">Use code</span>
              <span className="code">{code}</span>
              <Icon type={copied ? 'check' : 'copy'} width={15} height={15} />
            </button>

            <div className="hero-actions">
              {casinos.map((c) => (
                <a
                  key={c.id}
                  className="btn btn-sm lb-cta"
                  style={accentVars(c)}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon type={c.icon} width={16} height={16} />
                  {c.ctaLabel}
                </a>
              ))}
              <a className="btn btn-sm btn-ghost" href="#bonuses">
                View Bonuses
              </a>
            </div>
          </div>

          <div className="hero-card-art">
            <img src={site.logo} alt={`${site.brand} logo`} />
          </div>
        </div>
      </div>
    </section>
  )
}
