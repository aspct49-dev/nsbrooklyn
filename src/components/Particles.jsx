// Subtle red ember particles drifting in the page background.
// Deterministic layout (golden-angle scatter) — no re-randomizing on render.
// Purely decorative: fixed, pointer-events none, hidden for reduced motion.

const COUNT = 26

const DOTS = Array.from({ length: COUNT }, (_, i) => ({
  left: `${(i * 38.197) % 100}%`,          // golden-angle spread
  top: `${(i * 23.607 + 7) % 100}%`,
  size: 2 + (i % 4),                       // 2–5px
  dur: 9 + (i % 7) * 2.4,                  // 9–23s float loops
  delay: -((i * 1.7) % 12),
  glowDur: 4 + (i % 5) * 1.3,
  opacity: 0.1 + (i % 5) * 0.05,           // 0.10–0.30
}))

export default function Particles() {
  return (
    <div className="particles" aria-hidden="true">
      {DOTS.map((d, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            '--p-opacity': d.opacity,
            animationDuration: `${d.dur}s, ${d.glowDur}s`,
            animationDelay: `${d.delay}s, ${d.delay * 0.6}s`,
          }}
        />
      ))}
    </div>
  )
}
