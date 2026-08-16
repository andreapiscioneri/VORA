import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'

interface SessionUser {
  id: string
  email: string
  name: string
  organizationId: string
  organizationName: string
  role: string
}

interface AuthContextValue {
  user: SessionUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, organizationName: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  const checkSession = async () => {
    try {
      const { user: sessionUser } = await api.get<{ user: SessionUser | null }>('/auth/me')
      setUser(sessionUser)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  const login = async (email: string, password: string) => {
    const { user: loggedInUser } = await api.post<{ user: SessionUser }>('/auth/login', { email, password })
    setUser(loggedInUser)
  }

  const register = async (name: string, email: string, password: string, organizationName: string) => {
    await api.post('/auth/register', { name, email, password, organizationName })
    await checkSession()
  }

  const logout = async () => {
    await api.post('/auth/logout', {})
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export { ApiError }
