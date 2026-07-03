import Backdrop from './components/Backdrop'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Bonuses from './components/Bonuses'
import Leaderboard from './components/Leaderboard'
import Faq from './components/Faq'
import Socials from './components/Socials'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Backdrop />
      <Nav />
      <main>
        <Hero />
        <Bonuses />
        <Leaderboard />
        <Faq />
        <Socials />
      </main>
      <Footer />
    </>
  )
}
