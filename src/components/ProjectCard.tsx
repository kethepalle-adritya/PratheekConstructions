import { Link } from 'react-router-dom'
import type { PublicProject } from '../lib/queries'
import { LeafWatermark } from './LeafWatermark'
import { StatusBadge } from './StatusBadge'

function getUnitSummary(project: PublicProject) {
  const bhk = [...new Set(project.unit_types.map((unit) => unit.bhk).filter((value): value is number => value !== null))].sort((a, b) => a - b)
  if (bhk.length) return `${bhk.join(' & ')} BHK`
  const names = [...new Set(project.unit_types.map((unit) => unit.name.trim()).filter(Boolean))]
  return names.length ? names.join(' · ') : 'Unit details coming soon'
}

export function ProjectCard({ project }: { project: PublicProject }) {
  return (
    <article className="project-card">
      <Link to={`/projects/${project.slug}`} className="project-card-image" aria-label={`View ${project.name}`}>
        {project.hero_image_url ? (
          <img src={project.hero_image_url} alt={`${project.name}${project.block_label ? `, ${project.block_label}` : ''}`} loading="lazy" />
        ) : (
          <div className="image-placeholder" aria-label="Project image coming soon">
            <LeafWatermark className="placeholder-leaf" />
            <div className="placeholder-building" aria-hidden="true"><span /><span /><span /></div>
            <span className="placeholder-label">A new place to call home</span>
          </div>
        )}
        <StatusBadge status={project.status} />
      </Link>
      <div className="project-card-content">
        <p className="card-location">{[project.locality, project.city].filter(Boolean).join(', ') || 'Hyderabad'}</p>
        <h3><Link to={`/projects/${project.slug}`}>{project.name}{project.block_label ? ` – ${project.block_label}` : ''}</Link></h3>
        <p className="card-description">{project.short_description || 'Discover a thoughtfully planned residential project in Hyderabad.'}</p>
        <div className="project-card-bottom">
          <span className="unit-summary">{getUnitSummary(project)}</span>
          <Link className="card-arrow" to={`/projects/${project.slug}`} aria-label={`Explore ${project.name}`}>↗</Link>
        </div>
      </div>
    </article>
  )
}
