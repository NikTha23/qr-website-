import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../api/client'
import type { QRCodeRow } from '../types/api'
import { assetUrl } from '../lib/url'

export function Dashboard() {
  const [items, setItems] = useState<QRCodeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get<QRCodeRow[]>('/api/qr')
      setItems(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function remove(id: number) {
    if (!confirm('Delete this QR code?')) return
    await api.delete(`/api/qr/${id}`)
    void load()
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setMsg('Copied to clipboard')
      setTimeout(() => setMsg(null), 2000)
    } catch {
      setMsg('Copy failed')
    }
  }

  async function shareRow(row: QRCodeRow) {
    const link =
      row.dynamic_link ||
      row.payload ||
      assetUrl(row.image_url || '') ||
      ''
    const title = row.display_name
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url: link })
      } catch {
        /* dismissed */
      }
    } else {
      void copyText(link)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Your QR codes
          </h1>
          <p className="text-slate-500">
            Organized by folder · static &amp; dynamic
          </p>
        </div>
        {msg && (
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {msg}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-700">
          No QR codes yet. Open the generator to create your first one.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((row, i) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                    {row.folder}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                    {row.display_name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {row.qr_type === 'dynamic' ? 'Dynamic' : 'Static'} ·{' '}
                    {row.scan_count} scans
                  </p>
                </div>
                {assetUrl(row.image_url) && (
                  <img
                    src={assetUrl(row.image_url)!}
                    alt=""
                    className="h-16 w-16 rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {row.dynamic_link && (
                  <button
                    type="button"
                    onClick={() => void copyText(row.dynamic_link!)}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    Copy link
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void shareRow(row)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Share
                </button>
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
