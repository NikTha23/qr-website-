export type User = {
  id: number
  email: string
  created_at: string
}

export type QRCodeRow = {
  id: number
  public_code: string
  display_name: string
  folder: string
  qr_type: string
  payload: string
  redirect_url: string | null
  scan_count: number
  created_at: string
  image_url: string | null
  dynamic_link: string | null
}

export type AnalyticsOverview = {
  total_qrs: number
  total_scans: number
  scans_last_7_days: number
}

export type AnalyticsPoint = {
  date: string
  scans: number
}

export type ScanLogRow = {
  id: number
  ip_address: string | null
  device: string | null
  created_at: string
}
