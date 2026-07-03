import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Leaderboard from './pages/Leaderboard'
import Winners from './pages/Winners'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import ResponsibleGambling from './pages/ResponsibleGambling'

// Per-route <title> + description so each page is distinct for search engines
// and browser tabs. (Social scrapers read the static tags in index.html.)
const ROUTE_META = {
  '/': {
    title: 'NSBROOKLYN — $3,000 BetBolt & CaseBattle Leaderboards',
    description: 'Wager on BetBolt or CaseBattle under code NSBROOKLYN and climb the $3,000 monthly leaderboards. Rakeback, deposit bonuses, free cases & more.',
  },
  '/leaderboard': {
    title: 'NSBROOKLYN — $3,000 Wager Leaderboards (Code NSBROOKLYN)',
    description: 'Live BetBolt & CaseBattle wager leaderboards for code NSBROOKLYN. Climb the ranks and win your share of the $3,000 monthly prize pools.',
  },
  '/winners': {
    title: 'NSBROOKLYN — Past Leaderboard Winners',
    description: 'Previous NSBROOKLYN leaderboard winners and their prizes, archived each period.',
  },
  '/privacy': { title: 'NSBROOKLYN — Privacy Policy', description: 'How NSBROOKLYN collects, uses and protects your information.' },
  '/terms': { title: 'NSBROOKLYN — Terms & Conditions', description: 'The terms governing use of the NSBROOKLYN website and leaderboards.' },
  '/responsible-gambling': { title: 'NSBROOKLYN — Responsible Gambling', description: 'Gamble responsibly. 18+. Tips, warning signs and where to get help.' },
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
    setMeta('meta[property="og:url"]', 'content', `https://nsbrooklyn.com${pathname}`)
    setMeta('link[rel="canonical"]', 'href', `https://nsbrooklyn.com${pathname === '/' ? '/' : pathname}`)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteMeta />
      <div className="app" id="top">
        <Navbar />

        <div className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/winners" element={<Winners />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/responsible-gambling" element={<ResponsibleGambling />} />
          </Routes>

          <Footer />
        </div>
      </div>
    </BrowserRouter>
  )
}
