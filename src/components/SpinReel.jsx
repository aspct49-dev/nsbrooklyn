import { useEffect, useMemo, useRef, useState } from 'react'

const CARD = 104   // card width + gap, must match .kgw-reel-card in the CSS
const RUNWAY = 44  // cards scrolled past before landing

/** Deterministic tile colour per name, so someone looks the same every round. */
export function tileHue(name) {
  let h = 0
  for (let i = 0; i < String(name).length; i++) h = (h * 31 + String(name).charCodeAt(i)) % 360
  return h
}

export function EntrantTile({ entrant, size = 40 }) {
  const style = { width: size, height: size }
  if (entrant.kickAvatar) {
    return <img className="kgw-tile" src={entrant.kickAvatar} alt="" style={style} />
  }
  return (
    <span
      className="kgw-tile letter"
      style={{ ...style, background: `hsl(${tileHue(entrant.kickName)} 70% 55%)`, fontSize: size * 0.45 }}
    >
      {String(entrant.kickName || '?')[0].toUpperCase()}
    </span>
  )
}

/**
 * The slot-machine reel.
 *
 * It is pure theatre: the winner is decided server-side before this ever
 * runs, and is planted at a known index so the animation lands on it. The
 * reel never chooses anything — if it did, the draw wouldn't be verifiable.
 */
export default function SpinReel({ entrants, winner, spinning, onDone }) {
  const [offset, setOffset] = useState(0)
  const [settled, setSettled] = useState(false)
  const stripRef = useRef(null)

  // Build the strip once per spin: random filler, then the real winner at a
  // fixed landing index, then more filler so the reel doesn't end mid-air.
  const strip = useMemo(() => {
    if (!entrants.length) return []
    const pick = () => entrants[Math.floor(Math.random() * entrants.length)]
    const cards = Array.from({ length: RUNWAY }, pick)
    if (winner) cards.push(winner)
    for (let i = 0; i < 8; i++) cards.push(pick())
    return cards
  }, [entrants, winner, spinning])

  useEffect(() => {
    if (!spinning || !winner || !strip.length) return undefined
    setSettled(false)
    setOffset(0)

    // let the reset paint before starting, or the transition is skipped
    const id = requestAnimationFrame(() => {
      const width = stripRef.current?.parentElement?.offsetWidth ?? 0
      setOffset(RUNWAY * CARD - width / 2 + CARD / 2)
    })

    const done = setTimeout(() => {
      setSettled(true)
      onDone?.()
    }, 5200)

    return () => {
      cancelAnimationFrame(id)
      clearTimeout(done)
    }
  }, [spinning, winner, strip, onDone])

  if (!entrants.length) {
    return <div className="kgw-reel empty">Entries appear here as people type the keyword.</div>
  }

  return (
    <div className="kgw-reel">
      <span className="kgw-marker top" />
      <span className="kgw-marker bottom" />
      <div
        ref={stripRef}
        className="kgw-strip"
        style={{
          transform: `translateX(${-offset}px)`,
          transition: spinning ? 'transform 5s cubic-bezier(0.12, 0.7, 0.1, 1)' : 'none',
        }}
      >
        {strip.map((e, i) => (
          <div
            className={`kgw-reel-card ${settled && i === RUNWAY ? 'won' : ''}`}
            key={`${e.discordId}-${i}`}
          >
            <EntrantTile entrant={e} size={44} />
            <span className="kgw-reel-name">{e.kickName}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
