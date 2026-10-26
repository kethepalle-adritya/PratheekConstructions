import { Link, useSearchParams } from 'react-router-dom'
import { BrandOrnament } from '../components/BrandOrnament'
import { ProjectCard } from '../components/ProjectCard'
import { LeafWatermark } from '../components/LeafWatermark'
import { usePublishedProjects } from '../hooks/usePublishedProjects'
import type { ProjectStatus } from '../lib/database.types'

const filters = [
  { value: 'all', label: 'All projects' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
] as const

const statusOrder: Record<ProjectStatus, number> = { ongoing: 0, upcoming: 1, completed: 2 }

export function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { projects, isLoading, error, reload } = usePublishedProjects()
  const requestedFilter = searchParams.get('status') || 'all'
  const activeFilter = filters.some((filter) => filter.value === requestedFilter) ? requestedFilter : 'all'
  const visibleProjects = projects
    .filter((project) => activeFilter === 'all' || project.status === activeFilter)
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.display_order - b.display_order)

  return (
    <main className="projects-page">
      <section className="page-hero page-hero-compact">
        <div className="page-hero-inner">
          <p className="eyebrow">Made for everyday living</p>
          <h1>Our projects</h1>
          <BrandOrnament className="section-ornament" />
          <p>Explore homes by Pratheek Construction &amp; Developers across Hyderabad.</p>
        </div>
        <LeafWatermark className="watermark page-watermark" />
      </section>
      <section className="section listing-section">
        <div className="listing-toolbar">
          <div className="filter-tabs" role="group" aria-label="Filter projects by status">
            {filters.map((filter) => <button key={filter.value} type="button" aria-pressed={activeFilter === filter.value} className={`filter-tab${activeFilter === filter.value ? ' is-selected' : ''}`} onClick={() => setSearchParams(filter.value === 'all' ? {} : { status: filter.value })}>{filter.label}</button>)}
          </div>
          {!isLoading && !error && <span className="listing-count">{visibleProjects.length} {visibleProjects.length === 1 ? 'project' : 'projects'}</span>}
        </div>
        {error ? <div className="data-message"><p>{error}</p><button className="text-button" onClick={reload}>Try again</button></div> : isLoading ? (
          <div className="project-grid">{[1, 2, 3].map((item) => <div className="project-card project-skeleton" aria-hidden="true" key={item}><div className="skeleton-image" /><div className="skeleton-lines"><span /><span /><span /></div></div>)}</div>
        ) : visibleProjects.length ? (
          <div className="project-grid">{visibleProjects.map((project) => <ProjectCard key={project.id} project={project} />)}</div>
        ) : (
          <div className="empty-card listing-empty"><span className="empty-card-mark">⌂</span><h3>{activeFilter === 'all' ? 'More projects are on the way' : `No ${activeFilter} projects to show yet`}</h3><p>We’ll share more details here as projects become available.</p>{activeFilter !== 'all' && <button className="text-button" onClick={() => setSearchParams({})}>See all projects <span aria-hidden="true">↗</span></button>}<Link className="empty-contact" to="/contact">Have a question? Get in touch</Link></div>
        )}
      </section>
    </main>
  )
}
