import { Link } from 'react-router-dom'
import { BrandOrnament } from '../components/BrandOrnament'
import { ProjectCard } from '../components/ProjectCard'
import { useSiteSettings, useSiteSettingsStatus } from '../components/SiteSettingsProvider'
import { usePublishedProjects } from '../hooks/usePublishedProjects'

const approach = [
  { title: 'Materials chosen with care', text: 'Teak doors, TMT steel and vitrified tiles are among the materials considered for our homes.' },
  { title: 'Vastu-friendly planning', text: 'We take Vastu preferences into account while planning residential layouts.' },
  { title: 'A clear process', text: 'We aim to communicate project information and next steps openly.' },
]

export function AboutPage() {
  const settings = useSiteSettings()
  const settingsStatus = useSiteSettingsStatus()
  const { projects, isLoading, error, reload } = usePublishedProjects()

  return (
    <main className="about-page">
      <section className="page-hero about-page-hero"><div className="page-hero-inner"><p className="eyebrow">Pratheek Construction &amp; Developers</p><h1>Homes with room for what matters</h1><BrandOrnament className="section-ornament" /><p>Thoughtful residential projects, built around everyday life in Hyderabad.</p></div></section>
      <section className="about-story-section"><div className="about-story-inner"><div className="about-story-mark"><span>P</span><BrandOrnament className="section-ornament" /></div><div className="about-story-copy"><p className="eyebrow">Our story</p><h2>Built with care, from the first plan.</h2><p>{settings?.about_text || 'Pratheek Construction & Developers plans residential projects in Hyderabad with care for the details and the people who will call them home.'}</p>{settingsStatus.error && <p className="about-data-note" role="status">The company story couldn’t be loaded just now. This is a short introduction while it’s unavailable.</p>}</div></div></section>
      <section className="about-approach-section"><div className="project-section-heading"><p className="eyebrow">Our approach</p><h2>Thoughtful by design</h2><BrandOrnament className="section-ornament" /><p>Practical choices and considerate planning help make a home feel right for everyday life.</p></div><div className="about-approach-grid">{approach.map((item, index) => <article className="about-approach-card" key={item.title}><span className="approach-index">0{index + 1}</span><span className="approach-icon" aria-hidden="true">{['⌂', '✳', '◇'][index]}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
      <section className="about-projects-section"><div className="project-section-heading"><p className="eyebrow">What we’re building</p><h2>Our projects</h2><BrandOrnament className="section-ornament" /><p>Explore published residential projects and their current status.</p></div>{error ? <div className="data-message"><p>{error}</p><button className="text-button" onClick={reload}>Try again</button></div> : isLoading ? <div className="project-grid">{[1, 2, 3].map((item) => <div className="project-card project-skeleton" key={item} aria-hidden="true"><div className="skeleton-image" /><div className="skeleton-lines"><span /><span /><span /></div></div>)}</div> : projects.length ? <div className="project-grid">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <div className="empty-card"><h3>Project details will appear here</h3><p>Published projects will be listed here as they become available.</p></div>}</section>
      <section className="about-people-section"><div className="about-people-heading"><p className="eyebrow">The people behind each plan</p><h2>Working together to shape homes.</h2></div><div className="about-people-grid"><article><span className="people-kicker">Promoters</span><h3>Pratheek Construction &amp; Developers</h3></article></div></section>
      <section className="about-contact-cta"><div><p className="eyebrow">We’d be glad to hear from you</p><h2>Let’s talk about what you’re looking for.</h2></div><Link className="button button-maroon" to="/contact">Contact us <span aria-hidden="true">↗</span></Link></section>
    </main>
  )
}
