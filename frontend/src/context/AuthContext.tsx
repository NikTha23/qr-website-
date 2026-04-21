import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import axios from 'axios'
import { api } from '../api/client'
import type { User } from '../types/api'

const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

type AuthContextValue = {
  user: User | null
  loading: boolean
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token'),
  )

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem('token')
    if (!t) {
      setUser(null)
      return
    }
    try {
      const { data } = await api.get<User>('/api/auth/me')
      setUser(data)
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      setToken(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await refreshUser()
      setLoading(false)
    })()
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{
      access_token: string
      refresh_token: string
      expires_in: number
    }>('/api/auth/login', {
      email,
      password,
    })
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    setToken(data.access_token)
    await refreshUser()
  }, [refreshUser])

  const register = useCallback(
    async (email: string, password: string) => {
      await api.post('/api/auth/register', { email, password })
      await login(email, password)
    },
    [login],
  )

  const logout = useCallback(async () => {
    const rt = localStorage.getItem('refresh_token')
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setUser(null)
    if (rt) {
      try {
        await axios.post(`${base}/api/auth/logout`, { refresh_token: rt })
      } catch {
        /* ignore */
      }
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      token,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, token, login, register, logout, refreshUser],
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
