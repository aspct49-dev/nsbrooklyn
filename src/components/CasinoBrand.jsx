/* One brand lockup, same footprint everywhere it's used.
   Sized in em — set font-size on a wrapper to scale the whole thing:
   - `brandParts` set → icon + styled wordmark text (e.g. Case + Battle)
   - otherwise the casino's wordmark image (inverted to white if flagged). */
export default function CasinoBrand({ casino }) {
  if (casino.brandParts) {
    return (
      <span className="casino-brand">
        <img className="cb-cube" src={casino.brandIcon} alt="" />
        <span className="cb-wordmark">
          {casino.brandParts.map((p) => (
            <span key={p.text} style={{ color: p.color }}>{p.text}</span>
          ))}
        </span>
      </span>
    )
  }
  return (
    <span className="casino-brand">
      <img
        className={`cb-logoimg ${casino.logoInvert ? 'invert' : ''}`}
        src={casino.logo}
        alt={casino.name}
      />
    </span>
  )
}
