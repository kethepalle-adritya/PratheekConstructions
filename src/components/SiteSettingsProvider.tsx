import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSiteSettings, type SiteSettings } from '../lib/site-settings'

const SettingsContext = createContext<SiteSettings | null>(null)

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    let active = true
    getSiteSettings()
      .then((result) => { if (active) setSettings(result) })
      .catch(() => { if (active) setSettings(null) })
    return () => { active = false }
  }, [])

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
}

export function useSiteSettings() {
  return useContext(SettingsContext)
}
