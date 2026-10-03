import { casinos, config, wagerNote, wagerWeights } from '../data/leaderboard'

const [casino] = casinos

/**
 * How much of a wager actually counts toward the board.
 *
 * Shown on the pages that rank on the weighted figure (the leaderboard and the
 * raffle), not tucked away in the terms — someone querying their position is
 * standing on those pages when they do it. The bands are Roobet's rule, not
 * ours, which is why they are quoted rather than paraphrased.
 */
export default function WagerRules({ context = 'leaderboard' }) {
  return (
    <div className="wr-card">
      <h3 className="wr-title">Wager rules</h3>

      <p className="wr-lede">
        {wagerNote} Every game counts toward the {context} — dice included — but not every
        game counts the same:
      </p>

      <div className="wr-bands">
        {wagerWeights.map((w) => (
          <div className="wr-band" key={w.band}>
            <span className="wr-band-pct">{w.weight}</span>
            <span className="wr-band-text">
              <span className="wr-band-name">{w.band}</span>
              <span className="wr-band-note">{w.note}</span>
            </span>
          </div>
        ))}
      </div>

      <p className="wr-notice">
        <span className="wr-notice-mark" aria-hidden="true">!</span>
        These bands are set by {casino.name} and may change — if they change theirs, the board
        follows. Any wager abuse found by {config.brandName} or {casino.name} may result in your
        prize being forfeit and rolled to the next player in line.
      </p>
    </div>
  )
}
