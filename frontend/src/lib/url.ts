export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(
    /\/$/,
    '',
  )
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
