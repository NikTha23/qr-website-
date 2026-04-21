import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import { api } from '../api/client'
import {
  buildEmbedForPreview,
  normalizePayload,
  type ContentType,
} from '../lib/qrPayload'
import { assetUrl } from '../lib/url'
import type { QRCodeRow } from '../types/api'

const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export function Generator() {
  const [displayName, setDisplayName] = useState('Launch campaign')
  const [folder, setFolder] = useState('Marketing')
  const [qrType, setQrType] = useState<'static' | 'dynamic'>('dynamic')
  const [contentType, setContentType] = useState<ContentType>('url')
  const [payload, setPayload] = useState('https://example.com')
  const [redirectUrl, setRedirectUrl] = useState('https://example.com')
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<QRCodeRow | null>(null)

  const embedPreview = useMemo(() => {
    if (qrType === 'dynamic') {
      return buildEmbedForPreview('dynamic', contentType, payload, apiBase)
    }
    return normalizePayload(contentType, payload)
  }, [qrType, contentType, payload])

  useEffect(() => {
    void QRCode.toDataURL(embedPreview, { margin: 1, width: 240 }).then(
      setPreview,
    )
  }, [embedPreview])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    setCreated(null)
    try {
      const body: Record<string, unknown> = {
        display_name: displayName,
        folder,
        qr_type: qrType,
        content_type: contentType,
        payload: qrType === 'static' ? payload : payload || ' ',
      }
      if (qrType === 'dynamic') {
        body.redirect_url = redirectUrl
      }
      const { data } = await api.post<QRCodeRow>('/api/qr/generate', body)
      setCreated(data)
    } catch (err: unknown) {
      const detail =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : null
      setError(
        typeof detail === 'object' && detail !== null && 'detail' in detail
          ? JSON.stringify((detail as { detail: unknown }).detail)
          : 'Could not generate QR',
      )
    } finally {
      setBusy(false)
    }
  }

  async function downloadPng() {
    if (!created?.image_url) return
    const url = assetUrl(created.image_url)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `${created.display_name || 'qr'}.png`
    a.click()
  }

  async function downloadSvg() {
    const embed = created
      ? created.qr_type === 'dynamic' && created.dynamic_link
        ? created.dynamic_link
        : created.payload
      : embedPreview
    const svg = await QRCode.toString(embed, { type: 'svg' })
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const u = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = u
    a.download = `${created?.display_name || 'qr'}.svg`
    a.click()
    URL.revokeObjectURL(u)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          QR generator
        </h1>
        <p className="text-slate-500">
          Static codes embed data directly. Dynamic codes route through your
          tracked link.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Display name
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Folder / event
              </label>
              <input
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              QR mode
            </label>
            <div className="mt-2 flex gap-2">
              {(['static', 'dynamic'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setQrType(t)}
                  className={[
                    'flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition',
                    qrType === t
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                  ].join(' ')}
                >
                  {t === 'static' ? 'Static' : 'Dynamic (tracked)'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Content type
            </label>
            <select
              value={contentType}
              onChange={(e) =>
                setContentType(e.target.value as ContentType)
              }
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="text">Text</option>
              <option value="url">URL</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
          </div>

          {qrType === 'static' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Content
              </label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                required
              />
            </div>
          )}

          {qrType === 'dynamic' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Destination URL
              </label>
              <input
                type="url"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Optional label / note (stored with the QR)
              </p>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                rows={2}
                placeholder="e.g. Spring promo landing"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? 'Generating…' : 'Generate & save'}
          </button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="space-y-4 rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 shadow-inner dark:border-slate-800 dark:from-slate-900 dark:to-slate-950"
        >
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Live preview
            </p>
            <div className="mx-auto mt-4 flex h-64 w-64 items-center justify-center rounded-2xl bg-white shadow-lg dark:bg-slate-900">
              {preview ? (
                <img src={preview} alt="Preview" className="h-56 w-56" />
              ) : (
                <div className="h-48 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              )}
            </div>
          </div>

          {created && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                Saved · {created.display_name}
              </p>
              {created.dynamic_link && (
                <p className="mt-1 break-all text-xs text-emerald-800 dark:text-emerald-300">
                  Tracked link: {created.dynamic_link}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void downloadPng()}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={() => void downloadSvg()}
                  className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
                >
                  Download SVG
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
