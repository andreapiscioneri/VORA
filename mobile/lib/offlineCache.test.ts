import AsyncStorage from '@react-native-async-storage/async-storage'
import { readCache, writeCache } from './offlineCache'

afterEach(async () => {
  await AsyncStorage.clear()
  jest.restoreAllMocks()
})

describe('offlineCache', () => {
  it('round-trips data written then read under the same key', async () => {
    await writeCache('tasks', [{ id: '1', title: 'Write report' }])
    const result = await readCache<{ id: string; title: string }[]>('tasks')
    expect(result).toEqual([{ id: '1', title: 'Write report' }])
  })

  it('returns null for a key that was never written', async () => {
    expect(await readCache('never-written')).toBeNull()
  })

  it('keeps separate keys independent', async () => {
    await writeCache('tasks', ['a'])
    await writeCache('contacts', ['b'])
    expect(await readCache('tasks')).toEqual(['a'])
    expect(await readCache('contacts')).toEqual(['b'])
  })

  it('returns null instead of throwing when the stored value is corrupted JSON', async () => {
    await AsyncStorage.setItem('vora:cache:broken', '{not valid json')
    expect(await readCache('broken')).toBeNull()
  })

  it('does not throw when the underlying storage write fails', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('quota exceeded'))
    await expect(writeCache('tasks', ['a'])).resolves.toBeUndefined()
  })

  it('does not throw when the underlying storage read fails', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage unavailable'))
    await expect(readCache('tasks')).resolves.toBeNull()
  })
})
