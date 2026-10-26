import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { useSiteSettings } from '../SiteSettingsProvider'

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { session, signOut } = useAuth()
  const settings = useSiteSettings()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar${menuOpen ? ' is-open' : ''}`}>
        <NavLink to="/admin" end className="admin-brand" onClick={() => setMenuOpen(false)}><span className="admin-brand-mark">P</span><span><strong>Pratheek</strong><small>Admin workspace</small></span></NavLink>
        <nav className="admin-side-nav" aria-label="Administrator navigation">
          <NavLink to="/admin" end onClick={() => setMenuOpen(false)}><span aria-hidden="true">⌂</span>Dashboard</NavLink>
          <NavLink to="/admin/projects" onClick={() => setMenuOpen(false)}><span aria-hidden="true">▦</span>Projects</NavLink>
        </nav>
        <div className="admin-sidebar-bottom"><Link to="/" target="_blank">View public site ↗</Link><div className="admin-user-row"><span className="admin-avatar">{session?.user.email?.slice(0, 1).toUpperCase() || 'A'}</span><span className="admin-user-email">{session?.user.email || 'Administrator'}</span><button type="button" onClick={handleSignOut} aria-label="Sign out" title="Sign out">↗</button></div><span className="admin-company-name">{settings?.company_name || 'Pratheek Construction & Developers'}</span></div>
      </aside>
      <div className="admin-main-column"><header className="admin-topbar"><button className="admin-menu-toggle" type="button" aria-label="Toggle administrator menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /><span /></button><span className="admin-topbar-label">Administrator workspace</span><button className="admin-topbar-signout" type="button" onClick={handleSignOut}>Sign out</button></header><div className="admin-content"><Outlet /></div></div>
      {menuOpen && <button className="admin-sidebar-scrim" aria-label="Close administrator menu" onClick={() => setMenuOpen(false)} />}
    </div>
  )
}
