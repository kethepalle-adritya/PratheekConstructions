import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteAdminProject, getAdminProjects, updateAdminProject, type AdminProjectUpdate } from '../../lib/admin-queries'
import type { ProjectRow, ProjectStatus } from '../../lib/database.types'

const statuses: { value: ProjectStatus; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
]

export function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(false)
    getAdminProjects().then((rows) => { if (active) setProjects(rows) }).catch(() => { if (active) setError(true) }).finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [attempt])

  async function saveProject(id: string, updates: AdminProjectUpdate) {
    setSavingId(id)
    setRowError(null)
    try {
      await updateAdminProject(id, updates)
      setProjects((current) => current.map((project) => project.id === id ? { ...project, ...updates } : project).sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name)))
    } catch {
      setRowError('A project change could not be saved. Please try again.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(project: ProjectRow) {
    const confirmed = window.confirm(`Delete “${project.name}”${project.block_label ? ` – ${project.block_label}` : ''}? This permanently removes the project and its related project details.`)
    if (!confirmed) return
    setSavingId(project.id)
    setRowError(null)
    try {
      await deleteAdminProject(project.id)
      setProjects((current) => current.filter((item) => item.id !== project.id))
    } catch {
      setRowError('The project could not be deleted. Please try again.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <main className="admin-projects-page">
      <div className="admin-page-heading"><div><p className="admin-eyebrow">Your portfolio</p><h1>Projects</h1><p>Manage the projects shown on your public website.</p></div><Link className="admin-button admin-button-primary" to="/admin/projects/new"><span aria-hidden="true">＋</span> Add project</Link></div>
      {rowError && <p className="admin-row-error" role="alert">{rowError}</p>}
      <section className="admin-panel admin-projects-panel">
        <div className="admin-panel-heading"><div><h2>All projects</h2><p>Changes to publishing and status are reflected on the public site.</p></div>{!isLoading && !error && <span className="admin-panel-count">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>}</div>
        {error ? <div className="admin-data-error" role="alert"><strong>We couldn’t load projects.</strong><span>Please check your connection and try again.</span><button className="admin-button admin-button-secondary" type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button></div> : isLoading ? <div className="admin-table-skeleton"><span /><span /><span /><span /><span /></div> : projects.length ? (
          <div className="admin-table-wrap"><table className="admin-table admin-projects-table"><thead><tr><th>Project</th><th>Status</th><th>Published</th><th>Featured</th><th>Order</th><th>Actions</th></tr></thead><tbody>{projects.map((project) => <tr key={project.id} className={savingId === project.id ? 'is-saving' : ''}>
            <td><Link className="admin-strong-cell admin-project-name" to={`/admin/projects/${project.id}`}>{project.name}</Link>{project.block_label && <span className="admin-project-block">{project.block_label}</span>}<span className="admin-project-slug">/{project.slug}</span></td>
            <td><label className="admin-status-select-label"><span className="sr-only">Status for {project.name}</span><select value={project.status} disabled={savingId === project.id} onChange={(event) => saveProject(project.id, { status: event.target.value as ProjectStatus })}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label></td>
            <td><label className="admin-toggle"><input type="checkbox" checked={project.is_published} disabled={savingId === project.id} onChange={(event) => saveProject(project.id, { is_published: event.target.checked })} /><span className="admin-toggle-track" aria-hidden="true" /><span>{project.is_published ? 'Published' : 'Unpublished'}</span><span className="sr-only">Toggle publication for {project.name}</span></label></td>
            <td><label className="admin-toggle admin-feature-toggle"><input type="checkbox" checked={project.is_featured} disabled={savingId === project.id} onChange={(event) => saveProject(project.id, { is_featured: event.target.checked })} /><span className="admin-toggle-track" aria-hidden="true" /><span>{project.is_featured ? 'Featured' : 'Standard'}</span><span className="sr-only">Toggle featured status for {project.name}</span></label></td>
            <td><label className="admin-order-label"><span className="sr-only">Display order for {project.name}</span><input key={`${project.id}-${project.display_order}`} type="number" defaultValue={project.display_order} disabled={savingId === project.id} onBlur={(event) => { const parsed = Number(event.target.value); if (Number.isFinite(parsed) && parsed !== project.display_order) void saveProject(project.id, { display_order: parsed }) }} /></label></td>
            <td><div className="admin-row-actions"><Link to={`/admin/projects/${project.id}`}>Edit</Link><a className={project.is_published ? '' : 'is-disabled'} href={project.is_published ? `/projects/${project.slug}` : undefined} target={project.is_published ? '_blank' : undefined} rel="noreferrer" aria-disabled={!project.is_published} title={project.is_published ? 'View public project page' : 'Publish this project to make it visible on the website'}>View on site</a><button className="admin-unpublish-action" type="button" disabled={savingId === project.id} onClick={() => saveProject(project.id, { is_published: !project.is_published })}>{project.is_published ? 'Unpublish' : 'Publish'}</button><button className="admin-delete-action" type="button" disabled={savingId === project.id} onClick={() => void handleDelete(project)}>Delete</button></div></td>
          </tr>)}</tbody></table></div>
        ) : <div className="admin-empty-state"><span aria-hidden="true">▦</span><h3>No projects yet</h3><p>Add your first project to start building the public portfolio.</p><Link className="admin-button admin-button-primary" to="/admin/projects/new">Add a project</Link></div>}
      </section>
    </main>
  )
}
