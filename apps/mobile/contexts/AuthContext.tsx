import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import { api, ApiError, API_BASE, setTokens, clearTokens, hasStoredSession, getStoredRefreshToken } from '../lib/api'

const GOOGLE_OAUTH_REDIRECT = 'vora://oauth-callback'

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
  loginWithGoogle: () => Promise<void>
  register: (name: string, email: string, password: string, organizationName: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  const checkSession = async () => {
    try {
      if (!(await hasStoredSession())) {
        setUser(null)
        return
      }
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

  type TokenAuthResponse = { user: SessionUser; accessToken: string; refreshToken: string }

  const login = async (email: string, password: string) => {
    const result = await api.post<TokenAuthResponse>('/auth/mobile/login', { email, password })
    await setTokens(result)
    setUser(result.user)
  }

  // The OAuth exchange itself runs in a system browser (ASWebAuthenticationSession
  // / Chrome Custom Tabs), a separate cookie jar from this app's own `fetch` — so
  // the server hands back a short-lived one-time code via the vora:// redirect
  // instead of a session cookie (see server/api/auth/google-mobile.get.ts for the
  // full rationale). This function does the second half: trading that code for a
  // real session through the app's own fetch, exactly like login() above.
  const loginWithGoogle = async () => {
    const result = await WebBrowser.openAuthSessionAsync(`${API_BASE}/auth/google-mobile`, GOOGLE_OAUTH_REDIRECT)
    if (result.type !== 'success') return

    const url = new URL(result.url)
    const error = url.searchParams.get('error')
    const code = url.searchParams.get('code')
    if (error || !code) {
      throw new ApiError(401, 'auth.oauthFailed')
    }

    const exchanged = await api.post<TokenAuthResponse>('/auth/mobile/google-exchange', { code })
    await setTokens(exchanged)
    setUser(exchanged.user)
  }

  const register = async (name: string, email: string, password: string, organizationName: string) => {
    const result = await api.post<TokenAuthResponse>('/auth/mobile/register', { name, email, password, organizationName })
    await setTokens(result)
    setUser(result.user)
  }

  const logout = async () => {
    try {
      const refreshToken = await getStoredRefreshToken()
      await api.post('/auth/mobile/logout', { refreshToken })
    } finally {
      await clearTokens()
      setUser(null)
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export { ApiError }
