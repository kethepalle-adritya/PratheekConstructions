import { useEffect, useState } from 'react'
import { getPublishedProjects, type PublicProject } from '../lib/queries'

type ProjectState = {
  projects: PublicProject[]
  isLoading: boolean
  error: string | null
  reload: () => void
}

export function usePublishedProjects(): ProjectState {
  const [projects, setProjects] = useState<PublicProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)
    getPublishedProjects()
      .then((data) => { if (active) setProjects(data) })
      .catch(() => { if (active) setError('We couldn’t load projects right now. Please try again.') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [attempt])

  return { projects, isLoading, error, reload: () => setAttempt((value) => value + 1) }
}
