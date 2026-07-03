import { Fragment, useEffect, useState } from 'react'

function diff(target) {
  const ms = Math.max(0, new Date(target).getTime() - Date.now())
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return { d, h, m, s }
}

const pad = (n) => String(n).padStart(2, '0')

export default function Countdown({ target }) {
  const [t, setT] = useState(() => diff(target))

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  const cells = [
    { v: t.d, l: 'Days' },
    { v: t.h, l: 'Hours' },
    { v: t.m, l: 'Minutes' },
    { v: t.s, l: 'Seconds' },
  ]

  return (
    <div className="countdown">
      {cells.map((c, i) => (
        <Fragment key={c.l}>
          {i > 0 && <span className="colon">:</span>}
          <div className="count-cell">
            <div className="cv">{pad(c.v)}</div>
            <div className="cl">{c.l}</div>
          </div>
        </Fragment>
      ))}
    </div>
  )
}
