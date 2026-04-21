import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { buildEmbedForPreview } from '../lib/qrPayload'
import { useAuth } from '../context/AuthContext'

const apiBase = import.meta.env.VITE_API_URL || window.location.origin

export function Landing() {
  const { user } = useAuth()
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    const data = buildEmbedForPreview(
      'dynamic',
      'url',
      'https://example.com',
      apiBase,
    )
    void QRCode.toDataURL(data, { margin: 1, width: 220 }).then(setPreview)
  }, [])

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent dark:from-indigo-500/10" />
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl dark:bg-violet-600/10" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl dark:bg-cyan-500/10" />

      <section className="relative mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-24 pt-16 md:flex-row md:items-center md:pt-24">
        <motion.div
          className="flex-1 space-y-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            QR SaaS for modern teams
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl">
            Beautiful QR codes.
            <span className="block bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              Tracked in real time.
            </span>
          </h1>
          <p className="max-w-xl text-lg text-slate-600 dark:text-slate-400">
            Generate static or dynamic QR codes with a premium dashboard, scan
            analytics, device insights, and exports your team will love.
          </p>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <Link
                to="/generator"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500"
              >
                Open generator
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500"
                >
                  Start free
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
          <div className="grid gap-4 pt-4 sm:grid-cols-3">
            {[
              ['Live preview', 'See changes instantly'],
              ['Dynamic links', 'Track every scan'],
              ['Analytics', 'Charts & breakdowns'],
            ].map(([t, d]) => (
              <motion.div
                key={t}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {d}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="flex flex-1 justify-center"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.1 }}
        >
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-indigo-500/40 to-cyan-400/30 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/40 bg-white/90 p-8 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                Animated preview
              </p>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/80"
              >
                {preview ? (
                  <img src={preview} alt="QR preview" className="h-48 w-48" />
                ) : (
                  <div className="h-40 w-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
                )}
              </motion.div>
              <p className="mt-4 text-center text-xs text-slate-500">
                Dynamic QR · live redirect &amp; analytics
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

