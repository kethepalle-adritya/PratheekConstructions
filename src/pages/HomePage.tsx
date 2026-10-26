import { Link } from 'react-router-dom'
import { BrandOrnament } from '../components/BrandOrnament'
import { GeneralEnquiryForm } from '../components/GeneralEnquiryForm'
import { LeafWatermark } from '../components/LeafWatermark'
import { ProjectCard } from '../components/ProjectCard'
import { useSiteSettings } from '../components/SiteSettingsProvider'
import { usePublishedProjects } from '../hooks/usePublishedProjects'

const reasons = [
  { icon: '⌂', title: 'Quality construction', text: 'Careful attention to the details that make a home feel considered.' },
  { icon: '✳', title: 'Vastu-friendly layouts', text: 'Planning that respects traditional preferences for everyday living.' },
  { icon: '◇', title: 'Transparent process', text: 'Clear communication as you explore a home and its details.' },
  { icon: '⌖', title: 'Prime locations', text: 'Residential projects in established and growing Hyderabad neighbourhoods.' },
]

function ProjectSkeleton() {
  return <div className="project-card project-skeleton" aria-hidden="true"><div className="skeleton-image" /><div className="skeleton-lines"><span /><span /><span /></div></div>
}

export function HomePage() {
  const settings = useSiteSettings()
  const { projects, isLoading, error, reload } = usePublishedProjects()
  const featured = projects.filter((project) => project.is_featured).sort((a, b) => a.display_order - b.display_order)
  const ongoing = projects.filter((project) => project.status === 'ongoing').length
  const completed = projects.filter((project) => project.status === 'completed').length

  return (
    <main>
      <section className="home-hero">
        <LeafWatermark className="watermark hero-watermark" />
        <div className="home-hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">Thoughtfully built in Hyderabad</p>
            <h1>{settings?.company_name || 'Pratheek Construction & Developers'}</h1>
            <BrandOrnament className="section-ornament hero-ornament" />
            <p className="hero-tagline">{settings?.tagline || 'Residential projects, thoughtfully planned for everyday living.'}</p>
            <div className="hero-actions">
              <Link className="button button-teal" to="/projects">View projects <span aria-hidden="true">↗</span></Link>
              <a className="button button-outline" href="#general-enquiry">Enquire now <span aria-hidden="true">↓</span></a>
            </div>
            <p className="hero-location"><span aria-hidden="true">⌖</span> Hyderabad, Telangana</p>
          </div>
          <div className="hero-art" aria-label="Illustration of a thoughtfully designed home">
            <div className="hero-art-circle" />
            <div className="hero-art-arch"><div className="hero-building"><div className="building-roof" /><div className="building-body"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div><div className="building-door" /></div></div>
            <div className="hero-art-ground" />
            <span className="hero-art-caption">A considered place to call home</span>
          </div>
        </div>
        <div className="hero-bottom-mark"><span />Homes made for living<span /></div>
      </section>

      <section className="stats-band" aria-label="Project overview">
        <div className="stats-inner">
          <div className="stats-intro"><span className="stats-label">Our work at a glance</span><span>Real projects, in every stage.</span></div>
          <div className="stat-item"><strong>{isLoading ? '—' : projects.length}</strong><span>Published projects</span></div>
          <div className="stat-item"><strong>{isLoading ? '—' : ongoing}</strong><span>Ongoing</span></div>
          <div className="stat-item"><strong>{isLoading ? '—' : completed}</strong><span>Completed</span></div>
        </div>
      </section>

      <section className="section featured-section">
        <div className="section-heading">
          <p className="eyebrow">Find your next chapter</p>
          <h2>Featured projects</h2>
          <BrandOrnament className="section-ornament" />
          <p>Explore homes shaped around comfort, thoughtful planning and their neighbourhoods.</p>
        </div>
        {error ? <div className="data-message"><p>{error}</p><button className="text-button" onClick={reload}>Try again</button></div> : isLoading ? (
          <div className="project-grid">{[1, 2, 3].map((item) => <ProjectSkeleton key={item} />)}</div>
        ) : featured.length ? (
          <div className="project-grid">{featured.slice(0, 3).map((project) => <ProjectCard key={project.id} project={project} />)}</div>
        ) : (
          <div className="empty-card"><span className="empty-card-mark">⌂</span><h3>New projects are on the way</h3><p>When a project is ready to share, you’ll find it here.</p><Link className="text-button" to="/projects">Browse all projects <span aria-hidden="true">↗</span></Link></div>
        )}
        <div className="center-link"><Link className="button button-outline-dark" to="/projects">View all projects <span aria-hidden="true">↗</span></Link></div>
      </section>

      <section className="why-section">
        <LeafWatermark className="watermark why-watermark" />
        <div className="section section-inner">
          <div className="section-heading">
            <p className="eyebrow">The Pratheek approach</p>
            <h2>Considered at every step</h2>
            <BrandOrnament className="section-ornament" />
            <p>A home is a meaningful choice. We aim to make the process feel clear and thoughtful.</p>
          </div>
          <div className="reasons-grid">
            {reasons.map((reason, index) => <article className="reason-card" key={reason.title}><span className="reason-number">0{index + 1}</span><span className="reason-icon" aria-hidden="true">{reason.icon}</span><h3>{reason.title}</h3><p>{reason.text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="about-teaser section">
        <div className="about-teaser-art"><LeafWatermark className="watermark about-watermark" /><span className="about-monogram">P</span><span className="about-art-caption">Made for life’s everyday moments</span></div>
        <div className="about-teaser-copy">
          <p className="eyebrow">A little about us</p>
          <h2>Homes with room for what matters</h2>
          <BrandOrnament className="section-ornament about-ornament" />
          <p>{settings?.about_text || 'We plan residential projects in Hyderabad with care for the details, the process and the people who will call them home.'}</p>
          <Link className="text-button" to="/about">Get to know us <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className="enquiry-section" id="general-enquiry">
        <LeafWatermark className="watermark enquiry-watermark" />
        <div className="enquiry-section-inner">
          <div className="enquiry-intro">
            <p className="eyebrow">Start a conversation</p>
            <h2>Let’s find the right home for you.</h2>
            <BrandOrnament className="section-ornament enquiry-ornament" />
            <p>Share a few details and our team will get in touch to understand what you’re looking for.</p>
            <span className="enquiry-note">Your details are used only to respond to your enquiry.</span>
          </div>
          <div className="enquiry-form-card">
            <h3>Send us an enquiry</h3>
            <GeneralEnquiryForm projects={projects} />
          </div>
        </div>
      </section>
    </main>
  )
}
