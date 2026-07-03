import { useEffect, useRef, useState } from 'react'
import { IconChevron } from './icons'

/* One brand row, identical size for every casino:
   - `brandParts` set → icon + styled wordmark text (e.g. Case + Battle)
   - otherwise the casino's wordmark image (inverted to white if flagged). */
function Brand({ casino }) {
  if (casino.brandParts) {
    return (
      <span className="picker-brand">
        <img className="picker-cube" src={casino.brandIcon} alt="" />
        <span className="picker-wordmark">
          {casino.brandParts.map((p) => (
            <span key={p.text} style={{ color: p.color }}>{p.text}</span>
          ))}
        </span>
      </span>
    )
  }
  return (
    <span className="picker-brand">
      <img
        className={`picker-logo ${casino.logoInvert ? 'invert' : ''}`}
        src={casino.logo}
        alt={casino.name}
      />
    </span>
  )
}

/* Sexyboom-style site switcher: a framed pill showing the active casino,
   expanding into a stacked list of all casinos. */
export default function CasinoPicker({ casinos, activeId, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const active = casinos.find((c) => c.id === activeId) ?? casinos[0]

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className={`casino-picker ${open ? 'open' : ''}`} ref={ref}>
      <button
        type="button"
        className="picker-toggle"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Brand casino={active} />
        <span className="picker-chev"><IconChevron /></span>
      </button>

      {open && (
        <div className="picker-menu" role="listbox">
          {casinos.map((c) => (
            <button
              type="button"
              key={c.id}
              role="option"
              aria-selected={c.id === activeId}
              className={`picker-item ${c.id === activeId ? 'active' : ''}`}
              onClick={() => {
                onChange(c.id)
                setOpen(false)
              }}
            >
              <Brand casino={c} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
