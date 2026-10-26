import { useSiteSettings } from './SiteSettingsProvider'
import { buildWhatsAppUrl } from '../lib/contact-links'

export function FloatingWhatsApp() {
  const settings = useSiteSettings()
  const href = buildWhatsAppUrl(settings?.whatsapp_number, 'Hi, I would like to know more about your projects.')
  if (!href) return null
  return <a className="floating-whatsapp" href={href} target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp"><span aria-hidden="true">◉</span><span className="floating-whatsapp-label">Chat with us</span></a>
}
