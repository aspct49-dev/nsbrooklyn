import { rankPerks } from '../data/leaderboard'
import { fmtMoney } from '../utils'

const Lock = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" width="12" height="12" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)

const Check = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 13 4 4L19 7" />
  </svg>
)

// 0 → "0", 10000 → "10K", 1300000 → "1.3M"
export function fmtWager(n) {
  if (n === 0) return '0'
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`
  }
  return `${n / 1_000}K`
}

/** One BetBolt VIP rank: its wager range, what NSB pays, and the perks it unlocks. */
export default function RankTier({ tier }) {
  const { key, name, levels, icon, from, to, perks, reward } = tier
  const isBase = reward === 0

  return (
    <div className={`rk-tier ${key} ${isBase ? 'base' : ''}`}>
      <div className="rk-tier-head">
        <img className="rk-tier-icon" src={icon} alt="" loading="lazy" />
        <h3 className="rk-tier-name">{name} {levels && <span className="rk-levels">{levels}</span>}</h3>
        <p className="rk-range">
          <span className="v">{fmtWager(from)}</span>
          <span className="dash">–</span>
          <span className="v">{fmtWager(to)}</span>
        </p>
        <p className="rk-range-lbl">Wager Amount</p>
      </div>

      <div className="rk-reward">
        {isBase ? (
          <span className="rk-reward-base">Starting rank — no bonus</span>
        ) : (
          <>
            <span className="rk-reward-lbl">NSBROOKLYN pays</span>
            <span className="rk-reward-amt">{fmtMoney(reward)}</span>
          </>
        )}
      </div>

      <div className="rk-perks">
        {rankPerks.map((label, i) => {
          const locked = i >= perks
          return (
            <div className={`rk-perk ${locked ? 'locked' : ''}`} key={label}>
              <span className="rk-perk-ic">{locked ? <Lock /> : <Check />}</span>
              <span className="rk-perk-lbl">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
