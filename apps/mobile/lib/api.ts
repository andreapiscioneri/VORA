import { Platform } from 'react-native'
import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'

// A simulator/emulator can reach the host machine directly; a physical device on
// the same Wi-Fi cannot resolve "localhost" to the dev machine, so it must use the
// dev machine's LAN IP instead. Expo already knows that IP (it's how the device
// fetches the JS bundle from Metro) — it's exposed as `hostUri`, e.g. "192.168.1.23:8081".
function resolveDevHost(): string {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost
  const lanHost = hostUri?.split(':')[0]
  if (lanHost && lanHost !== 'localhost' && lanHost !== '127.0.0.1') {
    return lanHost
  }
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost'
}

// A standalone build (no Metro/dev server around) has no LAN dev host to
// resolve at all — EXPO_PUBLIC_API_URL, baked in at build time, points it at
// a real deployment instead (see apps/mobile/AGENTS.md sideloading notes).
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? `http://${resolveDevHost()}:3100/api`

export class ApiError extends Error {
  status: number
  // Best-effort parse of the H3 error body's `data` field (e.g. `{ reason:
  // 'pending_approval' }` on a gated login) — undefined when the response
  // wasn't JSON or carried no `data`, same shape web's $fetch exposes.
  data?: unknown
  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.status = status
    this.data = data
  }
}

// SecureStore backs onto Keychain (iOS) / Keystore (Android) — encrypted
// storage that survives app restarts, unlike relying on RN's fetch cookie
// jar (which nuxt-auth-utils' web session cookie depended on before this;
// see server/utils/mobileTokens.ts on the web side for the token scheme
// these keys hold). Module-level in-memory cache avoids an async SecureStore
// read before every single request — only the persisted store is the
// source of truth across app launches.
const ACCESS_TOKEN_KEY = 'vora.accessToken'
const REFRESH_TOKEN_KEY = 'vora.refreshToken'

let accessToken: string | null = null
let refreshToken: string | null = null
let loaded = false

async function ensureLoaded() {
  if (loaded) return
  ;[accessToken, refreshToken] = await Promise.all([SecureStore.getItemAsync(ACCESS_TOKEN_KEY), SecureStore.getItemAsync(REFRESH_TOKEN_KEY)])
  loaded = true
}

export async function setTokens(next: { accessToken: string; refreshToken: string }): Promise<void> {
  accessToken = next.accessToken
  refreshToken = next.refreshToken
  loaded = true
  await Promise.all([SecureStore.setItemAsync(ACCESS_TOKEN_KEY, next.accessToken), SecureStore.setItemAsync(REFRESH_TOKEN_KEY, next.refreshToken)])
}

export async function clearTokens(): Promise<void> {
  accessToken = null
  refreshToken = null
  loaded = true
  await Promise.all([SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY), SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)])
}

export async function hasStoredSession(): Promise<boolean> {
  await ensureLoaded()
  return accessToken !== null && refreshToken !== null
}

export async function getStoredRefreshToken(): Promise<string | null> {
  await ensureLoaded()
  return refreshToken
}

// A refresh can be triggered by several concurrent requests hitting 401 at
// once (e.g. a screen firing off multiple fetches on mount) — without this,
// each would race to call /auth/mobile/refresh with the same (single-use,
// rotating) refresh token, and only the first would succeed; the rest would
// consume an already-rotated token and fail. Sharing one in-flight promise
// means every caller waits on the same refresh and retries once it lands.
let refreshPromise: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  await ensureLoaded()
  if (!refreshToken) return false

  try {
    const res = await fetch(`${API_BASE}/auth/mobile/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) {
      await clearTokens()
      return false
    }
    const data = (await res.json()) as { accessToken: string; refreshToken: string }
    await setTokens(data)
    return true
  } catch {
    return false
  }
}

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
  await ensureLoaded()

  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init?.headers as Record<string, string>) }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })

  // Only a request that was actually carrying a token is worth retrying
  // after a refresh — a 401 on a request with no token yet (logged out)
  // means "not authenticated", not "expired", and refreshing can't fix that.
  if (res.status === 401 && accessToken && !isRetry) {
    const refreshed = await refreshSession()
    if (refreshed) return request<T>(path, init, true)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    try {
      const parsed = JSON.parse(text) as { statusMessage?: string; data?: unknown }
      throw new ApiError(res.status, parsed.statusMessage ?? text, parsed.data)
    } catch (e) {
      if (e instanceof ApiError) throw e
      throw new ApiError(res.status, text)
    }
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
