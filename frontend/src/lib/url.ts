export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path

  const explicitBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  const runtimeBase =
    typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : ''
  const base = explicitBase || runtimeBase

  if (!base) return path
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
