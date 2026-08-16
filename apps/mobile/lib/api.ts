import { Platform } from 'react-native'
import Constants from 'expo-constants'

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

export const API_BASE = `http://${resolveDevHost()}:3100/api`

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new ApiError(res.status, text)
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
