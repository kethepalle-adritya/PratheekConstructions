import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/admin/AuthProvider'
import { useSiteSettings } from '../../components/SiteSettingsProvider'
import { supabase } from '../../lib/supabase'

type LoginLocationState = { from?: string; notAuthorized?: boolean }

export function AdminLoginPage() {
  const settings = useSiteSettings()
  const { session, isLoading, signIn, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const locationState = location.state as LoginLocationState | null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(locationState?.notAuthorized ? 'Not authorised. This account is not listed as an administrator.' : '')
  const [busy, setBusy] = useState(false)

  if (!isLoading && session) return <Navigate to="/admin" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const signInError = await signIn(email.trim(), password)
      if (signInError) {
        setError('We couldn’t sign you in. Check your email and password, then try again.')
        return
      }

      const { data: { session: newSession } } = await supabase.auth.getSession()
      if (!newSession) {
        setError('Your sign-in could not be confirmed. Please try again.')
        return
      }
      const { data, error: verificationError } = await supabase.from('admin_users').select('user_id').eq('user_id', newSession.user.id).maybeSingle()
      if (verificationError) {
        setError('We couldn’t verify administrator access. Please try again in a moment.')
        return
      }
      if (!data) {
        await signOut()
        setError('Not authorised. This account is not listed as an administrator.')
        return
      }
      navigate(locationState?.from?.startsWith('/admin') ? locationState.from : '/admin', { replace: true })
    } catch {
      setError('We couldn’t complete your sign-in. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link to="/" className="admin-login-brand"><span className="admin-login-monogram">P</span><span>{settings?.company_name || 'Pratheek Construction & Developers'}</span></Link>
        <p className="admin-eyebrow">Secure administrator access</p>
        <h1>Welcome back</h1>
        <p className="admin-login-description">Sign in to manage projects and review enquiries.</p>
        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label>Email address<input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" /></label>
          {error && <p className="admin-form-error" role="alert">{error}</p>}
          <button className="admin-button admin-button-primary admin-login-submit" type="submit" disabled={busy || isLoading}>{busy ? 'Signing in…' : 'Sign in'} <span aria-hidden="true">↗</span></button>
        </form>
        <Link className="admin-back-link" to="/">← Back to the website</Link>
      </section>
    </main>
  )
}
