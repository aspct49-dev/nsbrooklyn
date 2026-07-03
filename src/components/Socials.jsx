import { site, socials } from '../config/site'
import { Icon } from './icons'

export default function Socials() {
  return (
    <section className="section" id="socials">
      <div className="container">
        <div className="socials-cta">
          <h2 className="display">Join the crew</h2>
          <p>Go-live alerts, giveaways &amp; bonus drops from {site.brand}.</p>
          <div className="social-grid">
            {socials.map((s) => (
              <a
                key={s.type}
                className="social-link"
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon type={s.type} />
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
