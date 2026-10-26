import { useEffect, useState } from 'react'
import { getPublishedProjectBySlug, type PublicProjectDetail } from '../lib/queries'

type ProjectDetailState = {
  project: PublicProjectDetail | null
  isLoading: boolean
  error: string | null
  reload: () => void
}

export function useProjectDetail(slug: string | undefined): ProjectDetailState {
  const [project, setProject] = useState<PublicProjectDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    if (!slug) {
      setProject(null)
      setIsLoading(false)
      return () => { active = false }
    }

    setIsLoading(true)
    setError(null)
    getPublishedProjectBySlug(slug)
      .then((data) => { if (active) setProject(data) })
      .catch(() => { if (active) setError('We couldn’t load this project right now. Please try again.') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [slug, attempt])

  return { project, isLoading, error, reload: () => setAttempt((value) => value + 1) }
}
