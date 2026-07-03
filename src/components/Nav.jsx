import { useState } from 'react'
import { site, navLinks, socials } from '../config/site'
import { Icon } from './icons'

const NAV_SOCIALS = socials.filter((s) => s.type === 'kick' || s.type === 'discord')

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="nav-brand" href="#top" onClick={() => setOpen(false)}>
          <img src={site.logo} alt={`${site.brand} logo`} />
          <span className="brand-text">{site.brand}</span>
        </a>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav-cta">
          {NAV_SOCIALS.map((s) => (
            <a
              key={s.type}
              className="nav-icon"
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
            >
              <Icon type={s.type} width={18} height={18} />
            </a>
          ))}
          <a className="btn btn-sm" href="#bonuses" onClick={() => setOpen(false)}>
            Claim bonuses
          </a>
          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon type={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  )
}
