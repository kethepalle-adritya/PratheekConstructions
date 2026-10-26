import { useEffect, useState } from 'react'
import { getAdminEnquiries, getAdminProjects, getAllAdminEnquiries, updateAdminEnquiry, type AdminEnquiryFilters, type AdminEnquiryRecord } from '../../lib/admin-queries'
import type { EnquiryStatus, ProjectRow } from '../../lib/database.types'

const pageSize = 25
const statuses: { value: EnquiryStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'site_visit', label: 'Site visit' },
  { value: 'closed', label: 'Closed' },
]

function csvCell(value: string | null | undefined) {
  const text = String(value ?? '').replace(/^[=+\-@]/, "'$&")
  return `"${text.replaceAll('"', '""')}"`
}

function exportCsv(rows: AdminEnquiryRecord[]) {
  const columns = ['Name', 'Phone', 'Email', 'Project', 'Interested in', 'Message', 'Status', 'Admin notes', 'Received at']
  const values = rows.map((row) => [row.name, row.phone, row.email, row.project_name || 'General enquiry', row.unit_interest, row.message, row.status, row.admin_notes, row.created_at])
  const content = [columns, ...values].map((line) => line.map((value) => csvCell(value)).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `pratheek-enquiries-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function AdminEnquiriesPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [rows, setRows] = useState<AdminEnquiryRecord[]>([])
  const [total, setTotal] = useState(0)
  const [projectId, setProjectId] = useState('all')
  const [status, setStatus] = useState<EnquiryStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const filters: AdminEnquiryFilters = { projectId: projectId === 'all' ? undefined : projectId, status, search: debouncedSearch }

  useEffect(() => {
    let active = true
    getAdminProjects().then((items) => { if (active) setProjects(items) }).catch(() => { if (active) setFeedback('Project names could not be loaded for the filter.') })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError('')
    const activeFilters: AdminEnquiryFilters = { projectId: projectId === 'all' ? undefined : projectId, status, search: debouncedSearch }
    getAdminEnquiries(activeFilters, page, pageSize).then((result) => {
      if (active) { setRows(result.rows); setTotal(result.total) }
    }).catch(() => { if (active) setError('We couldn’t load enquiries. Please try again.') }).finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [projectId, status, debouncedSearch, page, attempt])

  async function changeStatus(row: AdminEnquiryRecord, nextStatus: EnquiryStatus) {
    setBusyId(row.id); setFeedback('')
    try {
      await updateAdminEnquiry(row.id, { status: nextStatus })
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, status: nextStatus } : item))
      setFeedback('Enquiry status updated.')
    } catch { setFeedback('The enquiry status could not be updated.') }
    finally { setBusyId(null) }
  }

  async function saveNotes(row: AdminEnquiryRecord) {
    setBusyId(row.id); setFeedback('')
    try {
      await updateAdminEnquiry(row.id, { admin_notes: row.admin_notes })
      setFeedback('Admin notes saved.')
    } catch { setFeedback('Admin notes could not be saved.') }
    finally { setBusyId(null) }
  }

  async function handleExport() {
    setIsExporting(true); setFeedback('')
    try { const allRows = await getAllAdminEnquiries(filters); exportCsv(allRows); setFeedback(`Exported ${allRows.length} enquiries.`) }
    catch { setFeedback('The CSV export could not be prepared.') }
    finally { setIsExporting(false) }
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <main className="admin-enquiries-page">
      <div className="admin-page-heading"><div><p className="admin-eyebrow">Lead management</p><h1>Enquiries</h1><p>Review and follow up on messages sent from the public website.</p></div><button className="admin-button admin-button-primary" type="button" onClick={() => void handleExport()} disabled={isExporting || isLoading}>{isExporting ? 'Preparing CSV…' : 'Export CSV'} <span aria-hidden="true">↓</span></button></div>
      <section className="admin-panel enquiries-panel"><div className="enquiry-filters">
        <label>Project<select value={projectId} onChange={(event) => { setProjectId(event.target.value); setPage(1) }}><option value="all">All projects</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}{project.block_label ? ` – ${project.block_label}` : ''}</option>)}</select></label>
        <label>Status<select value={status} onChange={(event) => { setStatus(event.target.value as EnquiryStatus | 'all'); setPage(1) }}>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="enquiry-search">Search name or phone<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Type a name or phone number" /></label>
        <span className="enquiry-result-count">{isLoading ? 'Loading…' : `${total} ${total === 1 ? 'enquiry' : 'enquiries'}`}</span>
      </div>
      {feedback && <p className="admin-inline-feedback" role="status">{feedback}</p>}
      {error ? <div className="admin-data-error" role="alert"><strong>{error}</strong><button className="admin-button admin-button-secondary" type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button></div> : isLoading ? <div className="admin-table-skeleton"><span /><span /><span /><span /></div> : rows.length ? <div className="admin-table-wrap"><table className="admin-table admin-enquiries-table"><thead><tr><th>Enquiry</th><th>Project</th><th>Interest</th><th>Message</th><th>Status</th><th>Received</th><th>Admin notes</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className={busyId === row.id ? 'is-saving' : ''}><td><strong className="enquiry-person-name">{row.name}</strong><a className="enquiry-phone-link" href={`tel:${row.phone}`}>{row.phone}</a>{row.email && <a className="enquiry-email-link" href={`mailto:${row.email}`}>{row.email}</a>}</td><td>{row.project_name || 'General enquiry'}</td><td>{row.unit_interest || 'Not sure yet'}</td><td><div className="enquiry-message-cell">{row.message || '—'}</div></td><td><label><span className="sr-only">Status for {row.name}</span><select className="enquiry-status-select" value={row.status} disabled={busyId === row.id} onChange={(event) => void changeStatus(row, event.target.value as EnquiryStatus)}>{statuses.filter((item) => item.value !== 'all').map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label></td><td className="enquiry-date-cell">{formatDate(row.created_at)}</td><td><div className="enquiry-notes-editor"><textarea aria-label={`Admin notes for ${row.name}`} value={row.admin_notes || ''} rows={2} maxLength={2000} placeholder="Private follow-up notes" onChange={(event) => setRows((current) => current.map((item) => item.id === row.id ? { ...item, admin_notes: event.target.value || null } : item))} /><button className="admin-button admin-button-secondary" type="button" disabled={busyId === row.id} onClick={() => void saveNotes(row)}>Save notes</button></div></td></tr>)}</tbody></table></div> : <div className="admin-empty-state"><span aria-hidden="true">✉</span><h3>No enquiries match these filters</h3><p>Try another project, status or search term.</p><button className="admin-button admin-button-secondary" type="button" onClick={() => { setProjectId('all'); setStatus('all'); setSearch(''); setDebouncedSearch(''); setPage(1) }}>Clear filters</button></div>}
      {!error && !isLoading && total > pageSize && <div className="admin-pagination"><span>Page {page} of {pageCount}</span><div><button className="admin-button admin-button-secondary" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><button className="admin-button admin-button-secondary" type="button" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>Next</button></div></div>}
      </section>
    </main>
  )
}
