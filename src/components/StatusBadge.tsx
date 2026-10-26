import type { ProjectStatus } from '../lib/database.types'

const labels: Record<ProjectStatus, string> = {
  ongoing: 'Ongoing',
  upcoming: 'Upcoming',
  completed: 'Completed / Sold Out',
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={`status-badge status-${status}`}>{labels[status]}</span>
}
