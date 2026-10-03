import { config, casinos, milestones, milestonesCumulative, milestoneTotal } from '../data/leaderboard'
import { fmtMoney, fmtWager } from '../utils'
import { IconExternal, IconDiscord } from '../components/icons'

const [casino] = casinos

export default function Milestones() {
  const first = milestones[0]
  const top = milestones[milestones.length - 1]

  return (
    <section className="section" id="milestones">
      <div className="container">
        <div className="section-head">
          <h2 className="bonus-heading">WAGER MILESTONES</h2>
          <p className="bonus-heading-sub">Under code <span>{config.referralCode}</span></p>
        </div>

        {/* HERO — the whole pitch in one number */}
        <div className="ms-hero">
          <div className="ms-hero-main">
            <span className="ms-hero-kicker">Clear all {milestones.length} and bank</span>
            <span className="ms-hero-amt">{fmtMoney(milestoneTotal)}</span>
            <span className="ms-hero-sub">
              on {fmtWager(top.wager)} wagered — paid by me, on top of everything else
            </span>
          </div>
          <div className="ms-hero-side">
            <div className="ms-fact">
              <span className="ms-fact-k">Starts at</span>
              <span className="ms-fact-v">{fmtWager(first.wager)}</span>
            </div>
            <div className="ms-fact">
              <span className="ms-fact-k">Biggest single</span>
              <span className="ms-fact-v">{fmtMoney(top.reward)}</span>
            </div>
            <div className="ms-fact slots">
              <span className="ms-fact-k">Counts</span>
              <span className="ms-fact-v">Slots only</span>
            </div>
          </div>
        </div>

        {/* THE LEVELS — every level pays, so the running total is the point.
            One dark panel rather than free-standing rows: the page background
            is bright red and a bare connector line floating on it read as a
            stray stripe rather than a ladder. */}
        <div className="ms-levels">
          {milestonesCumulative.map((m, i) => (
            <div className={`ms-level ${m.tone}`} key={m.key}>
              <div className="ms-level-mark">
                <span className="ms-level-lbl">Level</span>
                <span className="ms-level-hex">{i + 1}</span>
              </div>

              <div className="ms-level-req">
                <span className="ms-level-req-v">{fmtWager(m.wager)}</span>
                <span className="ms-level-req-k">wagered on slots</span>
              </div>

              <div className="ms-level-pay">
                <span className="ms-level-pay-k">reward</span>
                <span className="ms-level-pay-v">{fmtMoney(m.reward)}</span>
              </div>

              <div className="ms-level-run">
                <div className="ms-level-run-head">
                  <span className="ms-level-run-k">banked</span>
                  <span className="ms-level-run-v">{fmtMoney(m.running)}</span>
                </div>
                <span
                  className="ms-level-run-bar"
                  style={{ '--pct': `${(m.running / milestoneTotal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <div className="gw-steps">
          <div className="gw-step">
            <span className="gw-step-n">1</span>
            <h4>Play under code {config.referralCode}</h4>
            <p>
              Your {casino.name} account has to be registered under code{' '}
              {config.referralCode} for wagers to count.
            </p>
          </div>
          <div className="gw-step">
            <span className="gw-step-n">2</span>
            <h4>Wager on slots</h4>
            <p>
              Only slot wagers count toward milestones. {fmtWager(first.wager)} gets you the
              first {fmtMoney(first.reward)}.
            </p>
          </div>
          <div className="gw-step">
            <span className="gw-step-n">3</span>
            <h4>Claim it in Discord</h4>
            <p>
              Open a ticket with your username and a screenshot of your wager, and I'll send
              it over. Each milestone pays once.
            </p>
          </div>
        </div>

        <div className="ms-cta">
          <a className="btn btn-primary" href={casino.url} target="_blank" rel="noreferrer">
            Start wagering <IconExternal />
          </a>
          <a className="btn btn-ghost" href={config.socials.discord} target="_blank" rel="noreferrer">
            <IconDiscord /> Claim via Discord
          </a>
        </div>

        <p className="section-sub ms-fine">
          Slots only — table games and live casino don't count. Milestones are paid by
          NSBROOKLYN, once per milestone, per player, and every milestone you pass pays, so
          clearing the ladder is worth {fmtMoney(milestoneTotal)} in total. The{' '}
          <a href="/leaderboard">leaderboard</a> and <a href="/raffles">raffle</a> rank on{' '}
          {casino.name}’s weighted wager instead — the bands are
          published on those pages. Any wager abuse found by me or {casino.name} disqualifies the
          prize, which rolls to the next player in line. 18+ only.
        </p>
      </div>
    </section>
  )
}
