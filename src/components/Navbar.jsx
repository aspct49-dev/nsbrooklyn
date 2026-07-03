import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { config } from '../data/leaderboard'
import {
  IconHome, IconTrophy, IconMedal, IconGift, IconSword,
  IconDiscord, IconKick, IconX,
} from './icons'

const nav = [
  { label: 'Home', icon: <IconHome />, to: '/', end: true },
  { label: 'Leaderboards', icon: <IconTrophy />, to: '/leaderboard', badge: `$${(config.prizePool / 1000)}K` },
  { label: 'Winners', icon: <IconMedal />, to: '/winners' },
  { label: 'Rewards', icon: <IconSword />, soon: true },
]

function NavItems({ onClose }) {
  return nav.map((n) => {
    if (n.soon) {
      return (
        <span key={n.label} className="nav-item" style={{ cursor: 'default' }}>
          <span className="ico">{n.icon}</span>
          {n.label}
          <span className="soon">SOON</span>
        </span>
      )
    }
    return (
      <NavLink
        key={n.label}
        to={n.hash ? n.to + n.hash : n.to}
        end={n.end}
        className={({ isActive }) => `nav-item ${isActive && !n.hash ? 'active' : ''}`}
        onClick={onClose}
      >
        <span className="ico">{n.icon}</span>
        {n.label}
        {n.badge && <span className="badge">{n.badge}</span>}
      </NavLink>
    )
  })
}

function Socials() {
  const s = config.socials
  return (
    <>
      <a href={s.discord} target="_blank" rel="noreferrer" aria-label="Discord"><IconDiscord /></a>
      <a href={s.x} target="_blank" rel="noreferrer" aria-label="X"><IconX /></a>
      <a href={s.kick} target="_blank" rel="noreferrer" aria-label="Kick"><IconKick /></a>
    </>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      {/* horizontal top bar */}
      <header className="navbar">
        <div className="navbar-inner">
          <Link className="nb-brand" to="/" onClick={close} aria-label="NSBROOKLYN home">
            <img src="/logo_vertical.png" alt="NSBROOKLYN logo" />
          </Link>

          <nav className="nb-links">
            <NavItems onClose={close} />
          </nav>

          <div className="nb-spacer" />

          <div className="nb-socials">
            <Socials />
          </div>

          <button className="hamburger" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
        </div>
      </header>

      {/* mobile drawer (off-canvas) */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link className="sidebar-logo" to="/" onClick={close} aria-label="NSBROOKLYN home">
          <img src="/logo_vertical.png" alt="NSBROOKLYN logo" />
        </Link>

        <nav className="nav">
          <NavItems onClose={close} />
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-socials">
          <Socials />
        </div>
      </aside>
      {open && <div className="scrim" onClick={close} />}
    </>
  )
}
