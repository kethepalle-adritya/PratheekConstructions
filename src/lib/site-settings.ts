import { supabase } from './supabase'

export type SiteSettings = {
  company_name: string
  tagline: string | null
  phones: string[] | null
  address: string | null
  whatsapp_number: string | null
  footer_disclaimer: string | null
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('company_name, tagline, phones, address, whatsapp_number, footer_disclaimer')
    .eq('id', 1)
    .maybeSingle()

  if (error) throw error
  return data
}
