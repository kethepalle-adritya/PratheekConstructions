export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string | null {
  const digits = phone?.replace(/\D/g, '')
  if (!digits) return null
  const internationalNumber = digits.length === 10 ? `91${digits}` : digits
  return `https://wa.me/${internationalNumber}?text=${encodeURIComponent(message)}`
}

export function buildDirectionsUrl(query: string | null | undefined): string | null {
  const value = query?.trim()
  if (!value) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`
}

export function buildGoogleMapsEmbedUrl(query: string | null | undefined): string | null {
  const value = query?.trim()
  if (!value) return null
  return `https://maps.google.com/maps?q=${encodeURIComponent(value)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
}
