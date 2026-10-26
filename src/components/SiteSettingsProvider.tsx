import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSiteSettings, type SiteSettings } from '../lib/site-settings'

type SettingsContextValue = { settings: SiteSettings | null; isLoading: boolean; error: boolean; refresh: () => void }
const SettingsContext = createContext<SettingsContextValue>({ settings: null, isLoading: true, error: false, refresh: () => undefined })

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(false)
    getSiteSettings()
      .then((result) => { if (active) { setSettings(result); setIsLoading(false) } })
      .catch(() => { if (active) { setSettings(null); setError(true); setIsLoading(false) } })
    return () => { active = false }
  }, [attempt])

  return <SettingsContext.Provider value={{ settings, isLoading, error, refresh: () => setAttempt((value) => value + 1) }}>{children}</SettingsContext.Provider>
}

export function useSiteSettings() {
  return useContext(SettingsContext).settings
}

export function useSiteSettingsStatus() {
  const { isLoading, error, refresh } = useContext(SettingsContext)
  return { isLoading, error, refresh }
}
