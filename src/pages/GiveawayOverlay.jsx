import { useEffect, useRef, useState } from 'react'
import { MIN_SPIN_MS, OVERLAY_POLL_MS, SPIN_MS } from '../lib/overlay'

/**
 * The Kick giveaway card for OBS — add /overlay/giveaway as a browser source.
 *
 * Four states, all in the one card so it never jumps position on stream:
 *
 * - **hidden**  — nothing running. The page is fully transparent.
 * - **open**    — the keyword to type, and the entry count climbing live.
 * - **drawing** — a reel through the entrants, timed to land at the same
 *                 moment the admin picker's reel does (see SPIN_MS).
 * - **winner**  — the name, or all of them on a multi-winner draw.
 *
 * `?demo=open|drawing|winner` feeds sample data instead of polling, so the
 * source can be placed and sized in OBS before a giveaway is running.
 */

const SAMPLE = [
  'NSBbastard', 'gamblingissues', 'boatanic', 'Lelouch', 'Wildstories',
  'jasonthefather', 'Nuzzynd', 'Relaxwithgeebee', 'nspswitch', 'HardR',
  'Maccyb', 'Boofydoo',
]

/* ---------------------------------------------------------------- polling */

/**
 * Poll the overlay endpoint, keeping the last good answer.
 *
 * A failed poll leaves the state alone rather than clearing it. On stream a
 * card that blinks out for a second because the site hiccupped looks broken
 * in a way a card that is one second stale never does.
 *
 * Also tracks the gap between the server's clock and this machine's, taken
 * from the `now` every reply carries — the reel times itself against a server
 * timestamp, and a streaming PC whose clock is out would otherwise land early
 * or late.
 */
function usePoll(url, paused) {
  const [data, setData] = useState(null)
  const skew = useRef(0)

  useEffect(() => {
    if (paused) return undefined
    let alive = true
    let timer

    const tick = async () => {
      try {
        const res = await fetch(url, { cache: 'no-store' })
        if (res.ok) {
          const next = await res.json()
          if (!alive) return
          skew.current = next.now - Date.now()
          setData(next)
        }
      } catch {
        /* keep what we had — see above */
      }
      if (alive) timer = setTimeout(tick, OVERLAY_POLL_MS)
    }

    tick()
    return () => { alive = false; clearTimeout(timer) }
  }, [url, paused])

  return { data, skew: skew.current }
}

/* ------------------------------------------------------------------- reel */

const FRAMES = 34
const easeOut = (t) => 1 - (1 - t) ** 4

/**
 * The names the reel runs through, ending on the winner.
 *
 * Shuffled so it doesn't read chat back in the order people typed, and
 * repeated to length so a round of four still spins. The winner is kept out
 * of the run-up — landing on a name that flashed past a moment earlier looks
 * like the reel stuttered.
 */
function buildReel(names, winner) {
  const others = names.filter((n) => n !== winner)
  const pool = others.length ? others : ['???']
  const out = []
  let bag = []
  while (out.length < FRAMES - 1) {
    if (!bag.length) bag = shuffle(pool)
    const next = bag.pop()
    if (out.length && out[out.length - 1] === next && pool.length > 1) continue
    out.push(next)
  }
  out.push(winner)
  return out
}

function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ------------------------------------------------------------------ demo */

function useDemo(demo) {
  const [state, setState] = useState(null)

  useEffect(() => {
    if (!demo) return undefined
    const base = {
      now: Date.now(),
      open: demo === 'open',
      keyword: '!enter',
      prize: '$50 cash',
      entryCount: 128,
      names: SAMPLE,
      winners: [],
      drawnAt: null,
      subLuck: true,
    }

    if (demo === 'open') {
      setState(base)
      const id = setInterval(
        () => setState((s) => s && { ...s, entryCount: s.entryCount + 1 + Math.floor(Math.random() * 3) }),
        1400,
      )
      return () => clearInterval(id)
    }

    if (demo === 'winner') {
      setState({
        ...base,
        winners: [{ place: 1, name: 'NSBbastard', isSub: true }],
        drawnAt: Date.now() - 60_000,
      })
      return undefined
    }

    // drawing: re-draw every ten seconds so the reel can be watched as many
    // times as it takes to size the source
    const draw = () => setState({
      ...base,
      now: Date.now(),
      winners: [{ place: 1, name: SAMPLE[Math.floor(Math.random() * SAMPLE.length)], isSub: false }],
      drawnAt: Date.now(),
    })
    draw()
    const id = setInterval(draw, 10_000)
    return () => clearInterval(id)
  }, [demo])

  return state
}

/* ------------------------------------------------------------------ card */

export default function GiveawayOverlay() {
  const demo = new URLSearchParams(window.location.search).get('demo')
  const valid = ['open', 'drawing', 'winner'].includes(demo) ? demo : null

  const polled = usePoll('/api/kick?overlay=1', valid !== null)
  const fake = useDemo(valid)
  const data = valid ? fake : polled.data
  const skew = valid ? 0 : polled.skew

  const [spin, setSpin] = useState(null)
  const [frame, setFrame] = useState(0)
  const handled = useRef(null)

  const winners = data?.winners ?? []
  const top = winners[0] ?? null

  // A new draw starts a spin that ends when the admin's reel does. Switching
  // the scene in two seconds late spins for what is left of it; arriving after
  // it has landed just shows the result.
  useEffect(() => {
    if (!top || !data?.drawnAt || handled.current === data.drawnAt) return
    handled.current = data.drawnAt

    const end = data.drawnAt - skew + SPIN_MS
    if (end - Date.now() < MIN_SPIN_MS) return

    setSpin({ frames: buildReel(data.names || [], top.name), start: Date.now(), end })
  }, [data, top, skew])

  useEffect(() => {
    if (!spin) return undefined
    let raf = 0
    const step = () => {
      const t = Math.min(1, (Date.now() - spin.start) / (spin.end - spin.start))
      setFrame(Math.round(easeOut(t) * (spin.frames.length - 1)))
      if (t < 1) raf = requestAnimationFrame(step)
      else setSpin(null)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [spin])

  const phase = spin ? 'drawing' : top ? 'winner' : data?.open ? 'open' : 'hidden'

  // Keep the last thing shown on screen while the card fades out, so the exit
  // is the card leaving rather than going blank and then leaving.
  const shown = useRef(null)
  if (phase !== 'hidden' && data) shown.current = { phase, data }
  const view = shown.current

  if (!view) return <div className="ovg" data-show="false" />

  const d = view.data
  const p = phase === 'hidden' ? view.phase : phase
  const multi = winners.length > 1

  const label = p === 'open'
    ? <><span className="ovg-dot" aria-hidden="true" /> Giveaway open</>
    : p === 'drawing'
      ? 'Drawing…'
      : multi ? `${winners.length} winners` : 'Winner'

  const headline = p === 'open'
    ? <span className="ovg-name cta">Type <em>{d.keyword}</em></span>
    : p === 'drawing' && spin
      ? <span key={frame} className="ovg-name reel">{spin.frames[frame]}</span>
      : <span key={`w-${d.drawnAt}`} className="ovg-name win">{top?.name ?? ''}</span>

  return (
    <div className="ovg" data-show={phase !== 'hidden'} data-phase={p}>
      <div className="ovg-card">
        <div className="ovg-top">
          <span className="ovg-mark">
            <img src="/nsbrooklyn.png" alt="" />
          </span>
          <span className="ovg-head">
            <span className="ovg-label">{label}</span>
            <span className="ovg-name-box">{headline}</span>
          </span>
          {p === 'open'
            ? <span className="ovg-badge live">Live</span>
            : <span className="ovg-badge">{d.entryCount.toLocaleString('en-US')} in</span>}
        </div>

        {/* Every winner past the first, so a multi-winner draw does not hide
            the rest behind the headline. */}
        {p === 'winner' && multi && (
          <div className="ovg-others">
            {winners.slice(1).map((w) => (
              <span className="ovg-other" key={w.place}>
                <b>{w.place}</b> {w.name}
              </span>
            ))}
          </div>
        )}

        <div className="ovg-bottom">
          <span className="ovg-field">
            {p === 'open' ? (
              <>
                <span className="ovg-label">Entries</span>
                <strong key={d.entryCount} className="ovg-count">
                  {d.entryCount.toLocaleString('en-US')}
                </strong>
              </>
            ) : (
              <>
                <span className="ovg-label">Keyword</span>
                <strong>{d.keyword}</strong>
              </>
            )}
          </span>
          {d.prize && <span className="ovg-badge prize">{d.prize}</span>}
        </div>
      </div>
    </div>
  )
}
