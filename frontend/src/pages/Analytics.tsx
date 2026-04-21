import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/client'
import type { AnalyticsOverview, AnalyticsPoint, QRCodeRow } from '../types/api'

export function Analytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [qrs, setQrs] = useState<QRCodeRow[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [series, setSeries] = useState<AnalyticsPoint[]>([])
  const [loading, setLoading] = useState(true)

  const loadOverview = useCallback(async () => {
    const { data } = await api.get<AnalyticsOverview>('/api/analytics/overview')
    setOverview(data)
  }, [])

  const loadQrs = useCallback(async () => {
    const { data } = await api.get<QRCodeRow[]>('/api/qr')
    setQrs(data)
    setSelected((prev) => (prev !== null ? prev : data[0]?.id ?? null))
  }, [])

  const loadSeries = useCallback(
    async (id: number) => {
      const { data } = await api.get<AnalyticsPoint[]>(
        `/api/analytics/qr/${id}/series`,
      )
      setSeries(data)
    },
    [],
  )

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        await Promise.all([loadOverview(), loadQrs()])
      } finally {
        setLoading(false)
      }
    })()
  }, [loadOverview, loadQrs])

  useEffect(() => {
    if (selected != null) void loadSeries(selected)
  }, [selected, loadSeries])

  if (loading || !overview) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Analytics
        </h1>
        <p className="text-slate-500">
          Overview and per-QR scan trends (last 30 days).
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          ['Total QR codes', overview.total_qrs],
          ['All-time scans', overview.total_scans],
          ['Scans (7 days)', overview.scans_last_7_days],
        ].map(([label, value]) => (
          <motion.div
            key={String(label)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Scan trend
          </h2>
          <select
            value={selected ?? ''}
            onChange={(e) => setSelected(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            {qrs.map((q) => (
              <option key={q.id} value={q.id}>
                {q.display_name} ({q.qr_type})
              </option>
            ))}
          </select>
        </div>
        {qrs.length === 0 ? (
          <p className="text-sm text-slate-500">Create a QR code to see data.</p>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="scans"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
