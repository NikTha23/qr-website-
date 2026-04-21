export type ContentType = 'text' | 'url' | 'email' | 'phone'

export function normalizePayload(contentType: ContentType, raw: string): string {
  const c = raw.trim()
  if (contentType === 'email') {
    return c.startsWith('mailto:') ? c : `mailto:${c}`
  }
  if (contentType === 'phone') {
    return c.startsWith('tel:') ? c : `tel:${c}`
  }
  if (contentType === 'url') {
    if (!c.startsWith('http://') && !c.startsWith('https://')) {
      return `https://${c}`
    }
    return c
  }
  return c
}

export function buildEmbedForPreview(
  qrType: 'static' | 'dynamic',
  contentType: ContentType,
  payload: string,
  apiBase: string,
): string {
  if (qrType === 'dynamic') {
    const b = apiBase.replace(/\/$/, '')
    return `${b}/r/preview`
  }
  return normalizePayload(contentType, payload)
}
