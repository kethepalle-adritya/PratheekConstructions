import { Link } from 'react-router-dom'
import { BrandOrnament } from './BrandOrnament'
import { useSiteSettings } from './SiteSettingsProvider'

export function Footer() {
  const settings = useSiteSettings()
  const companyName = settings?.company_name || 'Pratheek Construction & Developers'
  const callNumber = settings?.phones?.[0]
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link className="brand brand-footer" to="/">
            <span className="brand-mark" aria-hidden="true">P</span>
            <span className="brand-copy">
              <span className="brand-name">{companyName}</span>
              <span className="brand-subtitle">Hyderabad, India</span>
            </span>
          </Link>
          <p>{settings?.tagline || 'Thoughtfully planned homes for the way you want to live.'}</p>
        </div>
        <div className="footer-column">
          <span className="footer-label">Explore</span>
          <Link to="/projects">Our projects</Link>
          <Link to="/about">About us</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="footer-column footer-contact">
          <span className="footer-label">Get in touch</span>
          {callNumber && <a href={`tel:${callNumber}`}>Call {callNumber}</a>}
          {settings?.address && <span>{settings.address}</span>}
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {companyName}</span>
        <BrandOrnament className="footer-ornament" />
        <span>Built with care in Hyderabad</span>
      </div>
    </footer>
  )
}
