import { useEffect, useRef, useState } from 'react'
import { IconChevron } from './icons'
import CasinoBrand from './CasinoBrand'

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
        <CasinoBrand casino={active} />
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
              <CasinoBrand casino={c} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
