import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useSiteSettings } from './SiteSettingsProvider'

const links = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const settings = useSiteSettings()
  const companyName = settings?.company_name || 'Pratheek Construction & Developers'
  const callNumber = settings?.phones?.[0]

  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label="Main navigation">
        <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark" aria-hidden="true">P</span>
          <span className="brand-copy">
          <span className="brand-name">{companyName}</span>
          <span className="brand-subtitle">Hyderabad, India</span>
          </span>
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>
        <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
          {callNumber && <a className="button button-maroon nav-call" href={`tel:${callNumber}`}>
            Call Now <span aria-hidden="true">↗</span>
          </a>}
        </div>
      </nav>
    </header>
  )
}
