import { supabase } from './supabase'
import type { SiteSettingsRow } from './database.types'

export type SiteSettings = SiteSettingsRow

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (error) throw error
  return data
}
