import type { SpecificationRow } from '../lib/database.types'

export function SpecAccordion({ specifications }: { specifications: SpecificationRow[] }) {
  return (
    <div className="spec-grid">
      {specifications.map((specification) => <details className="spec-item" key={specification.id}>
        <summary><span className="spec-icon" aria-hidden="true">{specification.icon || '✳'}</span><span>{specification.title}</span><span className="spec-toggle" aria-hidden="true">+</span></summary>
        <ul>{specification.details.map((detail, index) => <li key={`${specification.id}-${index}`}>{detail}</li>)}</ul>
      </details>)}
    </div>
  )
}
