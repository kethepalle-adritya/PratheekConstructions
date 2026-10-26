import { useParams, Link } from 'react-router-dom'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { BrandOrnament } from '../components/BrandOrnament'
import { FloorPlanTabs } from '../components/FloorPlanTabs'
import { EnquiryForm } from '../components/GeneralEnquiryForm'
import { LeafWatermark } from '../components/LeafWatermark'
import { LandmarkList } from '../components/LandmarkList'
import { ProjectGallery } from '../components/ProjectGallery'
import { SpecAccordion } from '../components/SpecAccordion'
import { useSiteSettings } from '../components/SiteSettingsProvider'
import { buildDirectionsUrl, buildGoogleMapsEmbedUrl, buildWhatsAppUrl } from '../lib/contact-links'
import { StatusBadge } from '../components/StatusBadge'
import { useProjectDetail } from '../hooks/useProjectDetail'
import type { ProjectStatus } from '../lib/database.types'

const approachHighlights = [
  { title: 'Quality construction', icon: '✳' },
  { title: 'Vastu-friendly layouts', icon: '⌂' },
  { title: 'Transparent process', icon: '◇' },
  { title: 'Prime locations', icon: '⌖' },
]

function ProjectLoading() {
  return <main className="project-loading" aria-label="Loading project"><div className="project-loading-hero"><span /><span /><span /></div><div className="project-loading-content"><span /><span /><span /></div></main>
}

function NotFound() {
  return <main className="project-not-found"><LeafWatermark className="watermark" /><p className="eyebrow">Project not found</p><h1>We couldn’t find that project.</h1><p>It may no longer be available, or the address may have changed.</p><Link className="button button-teal" to="/projects">Browse projects <span aria-hidden="true">↗</span></Link></main>
}

function getPrimaryAction(status: ProjectStatus) {
  if (status === 'completed') return { label: 'Enquire about similar projects', href: '/projects?status=ongoing', kind: 'link' as const }
  if (status === 'upcoming') return { label: 'Register your interest', href: '#project-enquiry', kind: 'link' as const }
  return { label: 'Enquire now', href: '#project-enquiry', kind: 'link' as const }
}

function ProjectActionLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  return href.startsWith('#') ? <a className={className} href={href}>{children}</a> : <Link className={className} to={href}>{children}</Link>
}

export function ProjectDetailPage() {
  const { slug } = useParams()
  const settings = useSiteSettings()
  const { project, isLoading, error, reload } = useProjectDetail(slug)
  const [mapView, setMapView] = useState<'google' | 'brochure'>('google')

  if (isLoading) return <ProjectLoading />
  if (error) return <main className="project-load-error"><p>{error}</p><button type="button" className="text-button" onClick={reload}>Try again</button></main>
  if (!project) return <NotFound />

  const title = `${project.name}${project.block_label ? ` – ${project.block_label}` : ''}`
  const buildingImage = project.project_images.find((image) => image.category === 'exterior')?.image_url || project.hero_image_url
  const highlights = [...(project.highlights ?? []).filter(Boolean), ...approachHighlights.map((item) => item.title)]
    .filter((item, index, all) => all.indexOf(item) === index)
    .slice(0, 4)
  const action = getPrimaryAction(project.status)
  const phoneNumbers = project.contact_phones?.length ? project.contact_phones : settings?.phones ?? []
  const whatsappNumber = project.whatsapp_number || settings?.whatsapp_number
  const mapQuery = project.maps_query || [project.address, project.locality, project.city].filter(Boolean).join(', ')
  const directionsUrl = buildDirectionsUrl(mapQuery)
  const mapEmbedUrl = buildGoogleMapsEmbedUrl(mapQuery)
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, `Hi, I'm interested in ${project.name}${project.block_label ? ` ${project.block_label}` : ''}`)
  const hasGallery = project.project_images.some((image) => ['exterior', 'gallery', 'amenity'].includes(image.category))
  const projectTheme = {
    ...(project.theme_primary ? { '--color-teal': project.theme_primary } : {}),
    ...(project.theme_secondary ? { '--color-wood': project.theme_secondary } : {}),
    ...(project.theme_accent ? { '--color-terracotta': project.theme_accent } : {}),
    ...(project.theme_background ? { '--color-cream': project.theme_background, '--color-paper': project.theme_background } : {}),
    ...(project.theme_text ? { '--color-navy': project.theme_text } : {}),
  } as CSSProperties

  return (
    <main className="project-detail-page" style={projectTheme}>
      <section className={`project-detail-hero${project.hero_image_url ? ' has-image' : ' no-image'}`}>
        {project.hero_image_url ? <img className="project-detail-hero-image" src={project.hero_image_url} alt={`${title} residential building`} fetchPriority="high" /> : <LeafWatermark className="watermark project-hero-watermark" />}
        <div className="project-detail-hero-overlay" />
        <div className="project-detail-hero-content">
          <div className="project-hero-meta"><StatusBadge status={project.status} />{project.locality && <span className="hero-locality">{project.locality}{project.city ? `, ${project.city}` : ''}</span>}</div>
          <h1>{title}</h1>
          {project.tagline && <p className="project-detail-tagline">{project.tagline}</p>}
          {project.short_description && <p className="project-detail-description">{project.short_description}</p>}
          {project.rera_number && <p className="project-rera">RERA No: {project.rera_number}</p>}
          {!!project.highlights?.length && <div className="project-highlight-chips">{project.highlights.map((highlight) => <span key={highlight}>{highlight}</span>)}</div>}
          <div className="project-hero-actions"><a className="button button-peach" href="#floor-plans">View floor plans <span aria-hidden="true">↓</span></a><ProjectActionLink className="button project-hero-secondary" href={action.href}>{action.label} <span aria-hidden="true">↗</span></ProjectActionLink></div>
        </div>
      </section>

      <nav className="project-in-page-nav" aria-label="On this page">
        <div className="project-in-page-nav-inner"><span className="project-nav-title">{project.name}</span><a href="#project-about">About</a><a href="#floor-plans">Floor plans</a>{project.specifications.length > 0 && <a href="#specifications">Specifications</a>}{hasGallery && <a href="#gallery">Gallery</a>}<a href="#location">Location</a><ProjectActionLink className="project-nav-cta" href={action.href}>{action.label}</ProjectActionLink></div>
      </nav>

      <section className="project-about-section" id="project-about">
        <div className="project-about-inner">
          <div className="project-about-image-wrap">
            {buildingImage ? <img className="project-about-image" src={buildingImage} alt={`${title} building exterior`} loading="lazy" /> : <div className="project-building-placeholder"><LeafWatermark className="watermark" /><span className="placeholder-building" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span><span>Thoughtfully planned homes</span></div>}
            <div className="about-image-caption"><span className="about-caption-mark">P</span><span>{project.locality || project.city || 'Hyderabad'}</span></div>
          </div>
          <div className="project-about-copy"><p className="eyebrow">A place to call your own</p><h2>About {project.name}</h2><BrandOrnament className="section-ornament project-section-ornament" /><p>{project.about_text || project.short_description || 'Discover a residential project designed for comfortable everyday living.'}</p>{project.address && <p className="project-about-address">{project.address}</p>}</div>
        </div>
        <div className="project-highlights-grid">{highlights.map((highlight, index) => <article className="project-highlight-card" key={highlight}><span aria-hidden="true">{approachHighlights.find((item) => item.title === highlight)?.icon || ['✳', '⌂', '◇', '⌖'][index % 4]}</span><h3>{highlight}</h3></article>)}</div>
      </section>

      <section className="project-floor-section" id="floor-plans">
        <div className="project-section-heading"><p className="eyebrow">Find a layout that fits</p><h2>Floor plans</h2><BrandOrnament className="section-ornament" /><p>Explore the layouts and room sizes available for this project.</p></div>
        <FloorPlanTabs images={project.project_images} units={project.unit_types} brochureUrl={project.brochure_url} />
      </section>

      {project.specifications.length > 0 && <section className="project-spec-section" id="specifications"><div className="project-section-heading"><p className="eyebrow">The details that matter</p><h2>Specifications</h2><BrandOrnament className="section-ornament" /><p>Materials and finishes listed for this project.</p></div><SpecAccordion specifications={project.specifications} /></section>}

      <ProjectGallery images={project.project_images} projectName={title} />

      <section className="project-location-section" id="location">
        <div className="project-section-heading"><p className="eyebrow">A neighbourhood to grow into</p><h2>Location</h2><BrandOrnament className="section-ornament" /><p>Explore the address and nearby places around this project.</p></div>
        <div className="project-location-grid">
          <div className="location-map-card">
            {project.location_map_url && mapEmbedUrl && (
              <div className="location-map-toggle" role="group" aria-label="Map view mode">
                <button
                  type="button"
                  className={mapView === 'google' ? 'is-active' : ''}
                  onClick={() => setMapView('google')}
                >
                  Google Map
                </button>
                <button
                  type="button"
                  className={mapView === 'brochure' ? 'is-active' : ''}
                  onClick={() => setMapView('brochure')}
                >
                  Route Diagram
                </button>
              </div>
            )}
            {mapView === 'google' && mapEmbedUrl ? (
              <iframe
                title={`Google Map for ${title}`}
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : project.location_map_url ? (
              <>
                <img src={project.location_map_url} alt={`Location map for ${title}`} loading="lazy" />
                <span className="not-to-scale">Not to scale</span>
              </>
            ) : mapEmbedUrl ? (
              <iframe
                title={`Google Map for ${title}`}
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="location-map-placeholder">
                <LeafWatermark className="watermark" />
                <span className="map-pin" aria-hidden="true">⌖</span>
                <span>Location map coming soon</span>
              </div>
            )}
          </div>
          <div className="location-details"><p className="eyebrow">Find us</p><h3>{project.locality || project.city || 'Project address'}</h3>{project.address && <p className="location-address">{project.address}{project.pincode ? `, ${project.pincode}` : ''}</p>}{directionsUrl && <a className="button button-teal directions-button" href={directionsUrl} target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a>}{project.nearby_landmarks.length > 0 && <div className="landmarks-block"><h4>Nearby landmarks</h4><LandmarkList landmarks={project.nearby_landmarks} /></div>}</div>
        </div>
      </section>

      <section className="project-enquiry-section" id="project-enquiry">
        {project.status === 'completed' ? (
          <div className="completed-enquiry"><span className="completed-enquiry-icon" aria-hidden="true">⌂</span><p className="eyebrow">This project is completed</p><h2>Looking for something similar?</h2><p>Contact us to explore our ongoing projects and ask about available homes.</p><Link className="button button-teal" to="/projects?status=ongoing">Explore ongoing projects <span aria-hidden="true">↗</span></Link></div>
        ) : (
          <div className="project-enquiry-inner"><div className="project-enquiry-copy"><p className="eyebrow">{project.status === 'upcoming' ? 'Register your interest' : 'Start a conversation'}</p><h2>{project.status === 'upcoming' ? 'Be the first to hear about this project.' : 'Interested in this home?'}</h2><BrandOrnament className="section-ornament project-section-ornament" /><p>Share a few details and our team will get back to you about {project.name}{project.block_label ? ` – ${project.block_label}` : ''}.</p>{phoneNumbers.length > 0 && <div className="project-contact-phones"><span>Talk to our team</span>{phoneNumbers.map((phone) => <a key={phone} href={`tel:${phone}`}>{phone}</a>)}</div>}{whatsappUrl && <a className="whatsapp-button" href={whatsappUrl} target="_blank" rel="noreferrer"><span aria-hidden="true">◉</span> Chat on WhatsApp</a>}</div><div className="project-enquiry-form-card"><h3>{project.status === 'upcoming' ? 'Register your interest' : 'Enquire about this project'}</h3><EnquiryForm project={project} submitLabel={project.status === 'upcoming' ? 'Register interest' : 'Send enquiry'} successMessage="Thank you for your interest. Our team will be in touch." /></div></div>
        )}
      </section>

      <section className="project-detail-cta"><div><p className="eyebrow">{project.status === 'completed' ? 'Looking for a similar home?' : 'Let’s talk about your next home'}</p><h2>{project.status === 'completed' ? 'Explore our ongoing projects.' : 'Have a question about this project?'}</h2>{project.rera_number && <p className="project-footer-rera">RERA No: {project.rera_number}</p>}</div><ProjectActionLink className="button button-maroon" href={action.href}>{action.label} <span aria-hidden="true">↗</span></ProjectActionLink></section>
    </main>
  )
}
