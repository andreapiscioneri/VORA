import AsyncStorage from '@react-native-async-storage/async-storage'

const PREFIX = 'vora:cache:'

// Best-effort read/write around AsyncStorage: a cache is a nice-to-have, so
// a storage failure (quota, corrupted JSON, disabled storage) degrades to
// "no cache" rather than crashing the screen that's asking for it.
export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(data))
  } catch {
    // non-fatal — the next successful fetch will just try again
  }
}
