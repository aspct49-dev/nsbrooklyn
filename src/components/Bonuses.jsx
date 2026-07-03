import { casinos, totalPrizePool, accentVars } from '../config/site'
import { Icon } from './icons'

// Gold accent for the featured center card.
const goldVars = {
  '--lb-accent': '#e8b24c',
  '--lb-accent2': '#b47c22',
  '--lb-accent-text': '#2a1c02',
}

function CasinoCard({ casino }) {
  return (
    <div className="bonus-card" style={accentVars(casino)}>
      <div className={`bonus-float ${casino.logoPlate ? 'plate' : ''}`}>
        <img src={casino.logo} alt={`${casino.name} logo`} />
      </div>
      <h3>{casino.name}</h3>
      <div className="bonus-cap">Under code {casino.code}</div>
      <div className="bonus-rows">
        {casino.perks.map((perk) => (
          <div className="bonus-row" key={perk}>
            {perk}
          </div>
        ))}
      </div>
      <a
        className="btn lb-cta bonus-cta"
        href={casino.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Claim Bonus
      </a>
    </div>
  )
}

export default function Bonuses() {
  const code = casinos[0].code

  return (
    <section className="section" id="bonuses">
      <div className="container">
        <div className="display-head">
          <h2 className="display text-gold">Bonuses</h2>
          <div className="under-code">
            Under code <span className="mini-pill">{code}</span>
          </div>
        </div>

        <div className="bonus-grid">
          <CasinoCard casino={casinos[0]} />

          {/* featured center card — the combined leaderboard pool */}
          <div className="bonus-card featured" style={goldVars}>
            <div className="bonus-float emblem">
              <Icon type="crown" width={38} height={38} />
            </div>
            <h3 className="text-gold">{totalPrizePool}</h3>
            <div className="bonus-cap">Monthly Leaderboards</div>
            <div className="bonus-rows">
              <div className="bonus-row">Must be under code {code}</div>
              <div className="bonus-row">Wager on BetBolt or CaseBattle</div>
              <div className="bonus-row">Climb to secure top places</div>
              <div className="bonus-row">Win big rewards &amp; enjoy!</div>
            </div>
            <a className="btn lb-cta bonus-cta" href="#leaderboards">
              View Leaderboards
            </a>
          </div>

          <CasinoCard casino={casinos[1]} />
        </div>
      </div>
    </section>
  )
}
