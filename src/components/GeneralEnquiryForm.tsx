import { useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { createEnquiry } from '../lib/queries'
import type { PublicProject, PublicProjectDetail } from '../lib/queries'

const LAST_SUBMISSION_KEY = 'pratheek-enquiry-last-submitted'
const PHONE_PATTERN = /^(?:\+91[\s-]?)?[6-9]\d{9}$/

type EnquiryFormProps = {
  projects?: PublicProject[]
  project?: PublicProjectDetail
  successMessage?: string
  submitLabel?: string
}

export function EnquiryForm({ projects = [], project, successMessage, submitLabel = 'Send enquiry' }: EnquiryFormProps) {
  const { pathname } = useLocation()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [interest, setInterest] = useState('')
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const activeProjects = projects.filter((item) => item.status !== 'completed')
  const interestOptions = project
    ? project.unit_types.map((unit) => ({ key: unit.id, value: unit.name, label: unit.name }))
    : activeProjects.map((item) => {
      const label = `${item.name}${item.block_label ? ` – ${item.block_label}` : ''}`
      return { key: item.id, value: label, label }
    })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (honeypot) return
    if (name.trim().length < 2 || name.trim().length > 100) {
      setError('Please enter your name (2 to 100 characters).')
      return
    }
    if (!PHONE_PATTERN.test(phone.trim())) {
      setError('Please enter a valid 10-digit Indian mobile number, with an optional +91 prefix.')
      return
    }
    if (email && (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setError('Please check your email address.')
      return
    }
    if (message.length > 1000) {
      setError('Please keep your message under 1,000 characters.')
      return
    }

    const previous = Number(sessionStorage.getItem(LAST_SUBMISSION_KEY) || 0)
    if (Date.now() - previous < 30_000) {
      setError('Please wait a little before sending another enquiry.')
      return
    }

    setBusy(true)
    try {
      await createEnquiry({
        project_id: project?.id ?? null,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        unit_interest: interest || 'Not sure yet',
        message: message.trim() || null,
        source_page: pathname,
      })
      sessionStorage.setItem(LAST_SUBMISSION_KEY, String(Date.now()))
      setSuccess(true)
      setName('')
      setPhone('')
      setEmail('')
      setInterest('')
      setMessage('')
    } catch {
      setError('We couldn’t send your enquiry just now. Please try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="enquiry-form" onSubmit={handleSubmit}>
      <label className="honeypot" aria-hidden="true">Website
        <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
      </label>
      <label>Full name <span aria-hidden="true">*</span>
        <input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
      </label>
      <label>Phone number <span aria-hidden="true">*</span>
        <input required type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit mobile number" />
      </label>
      <label>Email <span className="optional-label">Optional</span>
        <input type="email" maxLength={150} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
      </label>
      <label>Interested in
        <select value={interest} onChange={(event) => setInterest(event.target.value)}>
          <option value="">Not sure yet</option>
          {interestOptions.map((option) => <option key={option.key} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="form-message">Message <span className="optional-label">Optional</span>
        <textarea maxLength={1000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell us what you’re looking for" />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      {success && <p className="form-success" role="status">{successMessage || 'Thank you. Your enquiry has been sent, and our team will be in touch.'}</p>}
      <button className="button button-maroon form-submit" type="submit" disabled={busy}>{busy ? 'Sending…' : submitLabel} <span aria-hidden="true">↗</span></button>
    </form>
  )
}

export function GeneralEnquiryForm({ projects }: { projects: PublicProject[] }) {
  return <EnquiryForm projects={projects} />
}
