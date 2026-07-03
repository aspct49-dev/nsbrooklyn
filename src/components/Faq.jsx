import { useState } from 'react'
import { faqs } from '../config/data'
import { Icon } from './icons'

export default function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section className="section" id="faq">
      <div className="container faq-container">
        <div className="display-head">
          <h2 className="display">Leaderboard FAQ</h2>
        </div>

        <div className="faq-list">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <div className={`faq-item ${isOpen ? 'open' : ''}`} key={f.q}>
                <button
                  className="faq-q"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  {f.q}
                  <Icon type="chevron" width={18} height={18} className="chev" />
                </button>
                {isOpen && <div className="faq-a">{f.a}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
