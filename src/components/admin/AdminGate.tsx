import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { supabase } from '../../lib/supabase'

type GateState = 'checking' | 'authorized' | 'signed-out' | 'unauthorized' | 'error'

function GateLoading({ label }: { label: string }) {
  return <main className="admin-gate-loading"><span className="admin-spinner" aria-hidden="true" /><p>{label}</p></main>
}

export function AdminGate() {
  const { session, isLoading } = useAuth()
  const userId = session?.user.id
  const location = useLocation()
  const [state, setState] = useState<GateState>('checking')
  const [authorizedUserId, setAuthorizedUserId] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const wasUnauthorized = useRef(false)

  useEffect(() => {
    if (isLoading) return
    if (!userId) {
      setState(wasUnauthorized.current ? 'unauthorized' : 'signed-out')
      setAuthorizedUserId(null)
      return
    }
    const currentUserId: string = userId

    let active = true
    setState('checking')
    setAuthorizedUserId(null)
    async function verify() {
      const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', currentUserId).maybeSingle()
      if (!active) return
      if (error) { setState('error'); return }
      if (!data) {
        wasUnauthorized.current = true
        await supabase.auth.signOut()
        if (active) setState('unauthorized')
        return
      }
      setAuthorizedUserId(currentUserId)
      setState('authorized')
    }
    void verify().catch(() => { if (active) setState('error') })
    return () => { active = false }
  }, [userId, isLoading, attempt])

  if (isLoading) return <GateLoading label="Checking administrator access…" />
  if (!userId) return <Navigate to="/admin/login" replace state={wasUnauthorized.current ? { notAuthorized: true } : { from: location.pathname }} />
  if (state === 'error') return <main className="admin-gate-error"><h1>We couldn’t verify administrator access.</h1><p>Please check your connection and try again.</p><button className="admin-button admin-button-primary" type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button></main>
  if (state === 'authorized' && authorizedUserId === userId) return <Outlet />
  return <GateLoading label="Checking administrator access…" />
}
