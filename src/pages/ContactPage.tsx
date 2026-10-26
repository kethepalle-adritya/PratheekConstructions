import { Link } from 'react-router-dom'
import { BrandOrnament } from '../components/BrandOrnament'
import { GeneralEnquiryForm } from '../components/GeneralEnquiryForm'
import { useSiteSettings, useSiteSettingsStatus } from '../components/SiteSettingsProvider'
import { usePublishedProjects } from '../hooks/usePublishedProjects'
import { buildDirectionsUrl, buildGoogleMapsEmbedUrl, buildWhatsAppUrl } from '../lib/contact-links'

export function ContactPage() {
  const settings = useSiteSettings()
  const settingsStatus = useSiteSettingsStatus()
  const { projects, error: projectsError, reload } = usePublishedProjects()
  const phones = settings?.phones ?? []
  const whatsappUrl = buildWhatsAppUrl(settings?.whatsapp_number, 'Hi, I would like to know more about your projects.')
  const directionsQuery = settings?.address?.trim()
  const directionsUrl = buildDirectionsUrl(directionsQuery)
  const mapEmbedUrl = buildGoogleMapsEmbedUrl(directionsQuery)
  const socialLinks = [
    { label: 'Instagram', href: settings?.instagram_url },
    { label: 'Facebook', href: settings?.facebook_url },
    { label: 'YouTube', href: settings?.youtube_url },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href))

  return (
    <main className="contact-page">
      <section className="page-hero contact-page-hero"><div className="page-hero-inner"><p className="eyebrow">We’re here to help</p><h1>Let’s talk about home.</h1><BrandOrnament className="section-ornament" /><p>Reach out to the Pratheek team. We’ll be glad to hear what you’re looking for.</p></div></section>
      <section className="contact-content-section"><div className="contact-content-inner"><div className="contact-details-column"><p className="eyebrow">Get in touch</p><h2>We’re only a conversation away.</h2><BrandOrnament className="section-ornament contact-ornament" />
        {phones.length > 0 && <div className="contact-info-card"><span className="contact-info-icon" aria-hidden="true">☎</span><div><h3>Call us</h3>{phones.map((phone) => <a className="contact-info-link" key={phone} href={`tel:${phone}`}>{phone}</a>)}</div></div>}
        {settings?.email && <div className="contact-info-card"><span className="contact-info-icon" aria-hidden="true">✉</span><div><h3>Email</h3><a className="contact-info-link" href={`mailto:${settings.email}`}>{settings.email}</a></div></div>}
        {settings?.address && <div className="contact-info-card"><span className="contact-info-icon" aria-hidden="true">⌖</span><div><h3>Office</h3><p>{settings.address}</p>{directionsUrl && <a className="contact-directions" href={directionsUrl} target="_blank" rel="noreferrer">Get directions ↗</a>}</div></div>}
        {mapEmbedUrl && (
          <div className="contact-map-card">
            <iframe
              title="Office Location Map"
              src={mapEmbedUrl}
              width="100%"
              height="220"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        )}
        {settings?.office_hours && <div className="contact-info-card"><span className="contact-info-icon" aria-hidden="true">◷</span><div><h3>Office hours</h3><p>{settings.office_hours}</p></div></div>}
        {whatsappUrl && <a className="whatsapp-button contact-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer"><span aria-hidden="true">◉</span> Chat with us on WhatsApp</a>}
        {socialLinks.length > 0 && <div className="contact-socials"><span>Follow along</span>{socialLinks.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</div>}
        {!phones.length && !settings?.email && !settings?.address && !settings?.office_hours && <p className="contact-pending">Contact details will be added here soon. You can still send us an enquiry.</p>}
      </div>
      <div className="contact-form-card"><p className="eyebrow">Send a note</p><h2>How can we help?</h2><p className="contact-form-intro">Tell us a little about what you’re looking for and we’ll be in touch.</p>{settingsStatus.error && <p className="contact-data-note" role="status">Some contact details could not be loaded. You can still send us a message here.</p>}{projectsError && <p className="contact-data-note" role="status">Project choices could not be loaded. You can still submit an enquiry. <button className="text-button" type="button" onClick={reload}>Try again</button></p>}<GeneralEnquiryForm projects={projects} /></div></div></section>
      <section className="contact-project-prompt"><span>Already have a project in mind?</span><Link className="text-button" to="/projects">Explore our projects <span aria-hidden="true">↗</span></Link></section>
    </main>
  )
}
