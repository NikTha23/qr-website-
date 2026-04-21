import axios from 'axios'

const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL: base,
})

/** Plain client for refresh calls (avoids interceptor recursion). */
const refreshClient = axios.create({ baseURL: base })

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('token')
  if (t) {
    config.headers.Authorization = `Bearer ${t}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean }
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/api/auth/refresh')
    ) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) {
        localStorage.removeItem('token')
        return Promise.reject(error)
      }
      try {
        const { data } = await refreshClient.post<{
          access_token: string
          expires_in: number
        }>('/api/auth/refresh', { refresh_token: refresh })
        localStorage.setItem('token', data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  },
)
