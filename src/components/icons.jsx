/* Minimal inline SVG icons (no icon dependency). stroke/fill inherit currentColor. */

export function Icon({ type, ...props }) {
  const I = ICONS[type] || ICONS.link
  return <I {...props} />
}

const S = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'currentColor' }

const ICONS = {
  kick: (p) => (
    <svg {...S} {...p}>
      <path d="M3 3h5v6l4-6h6l-6 9 6 9h-6l-4-6v6H3z" />
    </svg>
  ),
  twitch: (p) => (
    <svg {...S} {...p}>
      <path d="M4 2 3 6v13h4v3h3l3-3h4l4-4V2zm15 11-2 2h-4l-3 3v-3H7V4h12zM11 7h2v5h-2zm5 0h2v5h-2z" />
    </svg>
  ),
  youtube: (p) => (
    <svg {...S} {...p}>
      <path d="M22 7.4a3 3 0 0 0-2.1-2.1C18 4.8 12 4.8 12 4.8s-6 0-7.9.5A3 3 0 0 0 2 7.4 31 31 0 0 0 1.6 12 31 31 0 0 0 2 16.6a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22.4 12 31 31 0 0 0 22 7.4M10 15.2V8.8l5.2 3.2z" />
    </svg>
  ),
  x: (p) => (
    <svg {...S} {...p}>
      <path d="M18.2 2H21l-6.6 7.5L22 22h-6.1l-4.8-6.2L5.6 22H3l7-8L2.3 2h6.2l4.3 5.7zm-2.1 18h1.6L8 3.6H6.3z" />
    </svg>
  ),
  discord: (p) => (
    <svg {...S} {...p}>
      <path d="M20 4.5A17 17 0 0 0 15.7 3l-.2.4a13 13 0 0 1 3.7 1.9 15 15 0 0 0-12.4 0A13 13 0 0 1 10.5 3.4L10.3 3A17 17 0 0 0 6 4.5C3 9 2.2 13.4 2.6 17.7A17 17 0 0 0 7.7 20l.6-1a11 11 0 0 1-1.9-.9l.5-.4a12 12 0 0 0 10.2 0l.5.4a11 11 0 0 1-1.9.9l.6 1a17 17 0 0 0 5.1-2.3c.5-5-.8-9.3-3.4-13.2M9.2 15c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.7.9 1.6 1.9-.7 1.9-1.6 1.9m5.6 0c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.7.9 1.6 1.9-.7 1.9-1.6 1.9" />
    </svg>
  ),
  instagram: (p) => (
    <svg {...S} {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  copy: (p) => (
    <svg {...S} {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  ),
  check: (p) => (
    <svg {...S} {...p} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  arrow: (p) => (
    <svg {...S} {...p} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  menu: (p) => (
    <svg {...S} {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  close: (p) => (
    <svg {...S} {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  link: (p) => (
    <svg {...S} {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  ),
  bolt: (p) => (
    <svg {...S} {...p}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  ),
  swords: (p) => (
    <svg {...S} {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l8 8M3 3v4M3 3h4M21 3l-8 8m8-8v4m0-4h-4M6.5 14.5 4 17l3 3 2.5-2.5M17.5 14.5 20 17l-3 3-2.5-2.5M4 17l-1.5 1.5M20 17l1.5 1.5" />
    </svg>
  ),
  crown: (p) => (
    <svg {...S} {...p}>
      <path d="M3 7l4.5 4L12 4l4.5 7L21 7l-1.6 11H4.6zM4.6 20h14.8v1.5H4.6z" />
    </svg>
  ),
  chevron: (p) => (
    <svg {...S} {...p} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  gift: (p) => (
    <svg {...S} {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" />
      <path d="M5 12v8h14v-8M12 8v12M12 8s-4.5.2-5.5-2C5.8 4.4 7.5 3 9 3.5c2 .7 3 4.5 3 4.5s1-3.8 3-4.5c1.5-.5 3.2.9 2.5 2.5-1 2.2-5.5 2-5.5 2z" />
    </svg>
  ),
}
