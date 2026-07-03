/**
 * Fixed ambient background layer (sexyboom-style):
 * faint topo contours, glowing outlined doodles, twinkling sparks,
 * and two 3D CSS dice slowly tumbling through the page.
 * Everything is pointer-events: none and sits behind the content.
 */

const D = {
  width: 64,
  height: 64,
  viewBox: '0 0 64 64',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const DieOutline = (p) => (
  <svg {...D} {...p}>
    <rect x="8" y="8" width="48" height="48" rx="10" />
    <circle cx="22" cy="22" r="3.4" fill="currentColor" stroke="none" />
    <circle cx="42" cy="22" r="3.4" fill="currentColor" stroke="none" />
    <circle cx="32" cy="32" r="3.4" fill="currentColor" stroke="none" />
    <circle cx="22" cy="42" r="3.4" fill="currentColor" stroke="none" />
    <circle cx="42" cy="42" r="3.4" fill="currentColor" stroke="none" />
  </svg>
)

const Chip = (p) => (
  <svg {...D} {...p}>
    <circle cx="32" cy="32" r="24" />
    <circle cx="32" cy="32" r="13" />
    <path d="M32 8v8M32 48v8M8 32h8M48 32h8M15 15l5.6 5.6M43.4 43.4 49 49M49 15l-5.6 5.6M20.6 43.4 15 49" />
  </svg>
)

const Coin = (p) => (
  <svg {...D} {...p}>
    <circle cx="32" cy="32" r="24" />
    <path d="M32 18v28M40 24c-2-3-14-4-14 3s14 3 14 10-12 6-14 3" />
  </svg>
)

const Crown = (p) => (
  <svg {...D} {...p}>
    <path d="M10 24l10 9 12-16 12 16 10-9-4 28H14z" />
    <path d="M14 58h36" />
  </svg>
)

const Bolt = (p) => (
  <svg {...D} {...p}>
    <path d="M36 6 14 38h14l-2 20 22-32H34z" />
  </svg>
)

// One 3D die: 6 faces, preserve-3d, slow tumble.
function Die3D({ className }) {
  return (
    <div className={`die3d-wrap ${className}`}>
      <div className="die3d">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className={`die-face f${n}`} />
        ))}
      </div>
    </div>
  )
}

// Hardcoded spark field (deterministic — no re-random on rerender).
const SPARKS = [
  { top: '8%', left: '12%', s: 3, d: 0 },
  { top: '16%', left: '78%', s: 2, d: 1.2 },
  { top: '24%', left: '32%', s: 2, d: 2.1 },
  { top: '31%', left: '90%', s: 3, d: 0.6 },
  { top: '42%', left: '6%', s: 2, d: 1.8 },
  { top: '48%', left: '55%', s: 2, d: 3.1 },
  { top: '55%', left: '84%', s: 3, d: 0.3 },
  { top: '63%', left: '20%', s: 2, d: 2.6 },
  { top: '70%', left: '68%', s: 2, d: 1.5 },
  { top: '78%', left: '40%', s: 3, d: 0.9 },
  { top: '85%', left: '88%', s: 2, d: 2.9 },
  { top: '90%', left: '14%', s: 2, d: 1.1 },
]

export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="topo" />

      {/* glowing outlined doodles */}
      <DieOutline className="doodle red" style={{ top: '14%', left: '5%', width: 74 }} />
      <Chip className="doodle gold" style={{ top: '30%', right: '4%', width: 88 }} />
      <Bolt className="doodle blue" style={{ top: '48%', left: '3%', width: 64 }} />
      <Coin className="doodle gold slow" style={{ top: '66%', right: '7%', width: 70 }} />
      <Crown className="doodle red slow" style={{ top: '82%', left: '8%', width: 78 }} />
      <Chip className="doodle red" style={{ top: '6%', right: '16%', width: 56 }} />

      {/* 3D dice */}
      <Die3D className="dice-a" />
      <Die3D className="dice-b" />

      {/* sparks */}
      {SPARKS.map((sp, i) => (
        <span
          key={i}
          className="spark"
          style={{
            top: sp.top,
            left: sp.left,
            width: sp.s,
            height: sp.s,
            animationDelay: `${sp.d}s`,
          }}
        />
      ))}
    </div>
  )
}
