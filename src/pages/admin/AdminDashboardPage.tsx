import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminDashboardData, type AdminDashboardData } from '../../lib/admin-queries'

const projectStats = [
  { key: 'total', label: 'Total projects', tone: 'navy' },
  { key: 'ongoing', label: 'Ongoing', tone: 'teal' },
  { key: 'upcoming', label: 'Upcoming', tone: 'terracotta' },
  { key: 'completed', label: 'Completed', tone: 'grey' },
] as const

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(false)
    getAdminDashboardData().then((result) => { if (active) setData(result) }).catch(() => { if (active) setError(true) }).finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [attempt])

  return (
    <main className="admin-dashboard-page">
      <div className="admin-page-heading"><div><p className="admin-eyebrow">Your overview</p><h1>Dashboard</h1><p>Here’s what’s happening across your projects.</p></div><Link className="admin-button admin-button-primary" to="/admin/projects">Manage projects <span aria-hidden="true">↗</span></Link></div>
      {error ? <div className="admin-data-error" role="alert"><strong>We couldn’t load the dashboard.</strong><span>Please try again in a moment.</span><button className="admin-button admin-button-secondary" type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button></div> : <>
        <section className="admin-stats-grid" aria-label="Project counts">{projectStats.map((stat) => <article className={`admin-stat-card admin-stat-${stat.tone}`} key={stat.key}><span>{stat.label}</span><strong>{isLoading ? <i className="admin-skeleton-number" /> : data?.counts[stat.key] ?? 0}</strong></article>)}<article className="admin-stat-card admin-stat-enquiries"><span>Enquiries in last 7 days</span><strong>{isLoading ? <i className="admin-skeleton-number" /> : data?.enquiriesLast7Days ?? 0}</strong></article></section>
        <section className="admin-panel latest-enquiries-panel"><div className="admin-panel-heading"><div><p className="admin-eyebrow">Recent activity</p><h2>Latest enquiries</h2></div><span className="admin-panel-note">Most recent first</span></div>
          {isLoading ? <div className="admin-table-skeleton"><span /><span /><span /><span /></div> : data?.latestEnquiries.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Phone</th><th>Project</th><th>Status</th><th>Received</th></tr></thead><tbody>{data.latestEnquiries.map((enquiry) => <tr key={enquiry.id}><td className="admin-strong-cell">{enquiry.name}</td><td><a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a></td><td>{enquiry.project_name || 'General enquiry'}</td><td><span className={`admin-enquiry-status status-${enquiry.status}`}>{enquiry.status.replaceAll('_', ' ')}</span></td><td>{formatSubmittedAt(enquiry.created_at)}</td></tr>)}</tbody></table></div> : <div className="admin-empty-state"><span aria-hidden="true">✉</span><h3>No enquiries yet</h3><p>New website enquiries will appear here.</p></div>}
        </section>
      </>}
    </main>
  )
}
