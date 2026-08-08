import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Particles from './components/Particles'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Leaderboard from './pages/Leaderboard'
import Giveaways from './pages/Giveaways'
import Raffles from './pages/Raffles'
import Milestones from './pages/Milestones'
import Winners from './pages/Winners'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import ResponsibleGambling from './pages/ResponsibleGambling'
import Admin from './pages/Admin'

// Per-route <title> + description so each page is distinct for search engines
// and browser tabs. (Social scrapers read the static tags in index.html.)
const ROUTE_META = {
  '/': {
    title: 'NSBROOKLYN — $5,000 BetBolt Leaderboard (Code NSB)',
    description: 'Wager on BetBolt under code NSB and climb the $5,000 wager leaderboard. Daily giveaways, wager milestones, rakeback and deposit bonuses.',
  },
  '/leaderboard': {
    title: 'NSBROOKLYN — $5,000 Wager Leaderboard (Code NSB)',
    description: 'Live BetBolt wager leaderboard for code NSB. Climb the ranks and win your share of the $5,000 prize pool.',
  },
  '/giveaways': {
    title: 'NSBROOKLYN — Daily Discord Giveaways',
    description: 'Free daily giveaways hosted by NSBROOKLYN. Log in with Discord and enter with one click — no wagering required, winners drawn live.',
  },
  '/raffles': {
    title: 'NSBROOKLYN — Weekly $250 Wager Raffle',
    description: 'Every $100 wagered on BetBolt under code NSB earns a raffle ticket. 5 winners share $250 every week — provably fair draws.',
  },
  '/milestones': {
    title: 'NSBROOKLYN — BetBolt Rank Milestone Rewards',
    description: 'Reach a BetBolt VIP rank under code NSB and get paid on top — $25 at Bronze up to $7,000 at Diamond, $11,180 across every rank.',
  },
  '/winners': {
    title: 'NSBROOKLYN — Past Leaderboard Winners',
    description: 'Previous NSBROOKLYN leaderboard winners and their prizes, archived each period.',
  },
  '/privacy': { title: 'NSBROOKLYN — Privacy Policy', description: 'How NSBROOKLYN collects, uses and protects your information.' },
  '/terms': { title: 'NSBROOKLYN — Terms & Conditions', description: 'The terms governing use of the NSBROOKLYN website and leaderboards.' },
  '/responsible-gambling': { title: 'NSBROOKLYN — Responsible Gambling', description: 'Gamble responsibly. 18+. Tips, warning signs and where to get help.' },
  '/admin': { title: 'NSBROOKLYN — Admin Panel', description: 'Manage the NSBROOKLYN leaderboards.' },
}

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector)
  if (!el) return
  el.setAttribute(attr, value)
}

function RouteMeta() {
  const { pathname } = useLocation()
  useEffect(() => {
    const meta = ROUTE_META[pathname] || ROUTE_META['/']
    document.title = meta.title
    setMeta('meta[name="description"]', 'content', meta.description)
    setMeta('meta[property="og:title"]', 'content', meta.title)
    setMeta('meta[property="og:description"]', 'content', meta.description)
    setMeta('meta[property="og:url"]', 'content', `https://usecodensb.gg${pathname}`)
    setMeta('link[rel="canonical"]', 'href', `https://usecodensb.gg${pathname === '/' ? '/' : pathname}`)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteMeta />
      <div className="app" id="top">
        <Particles />
        <Navbar />

        <div className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/giveaways" element={<Giveaways />} />
            <Route path="/raffles" element={<Raffles />} />
            <Route path="/milestones" element={<Milestones />} />
            <Route path="/winners" element={<Winners />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/responsible-gambling" element={<ResponsibleGambling />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>

          <Footer />
        </div>
      </div>
    </BrowserRouter>
  )
}
