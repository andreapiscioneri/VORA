import { nextStatus } from './taskStatus'

describe('nextStatus', () => {
  it('advances todo to in_progress', () => {
    expect(nextStatus('todo')).toBe('in_progress')
  })

  it('advances in_progress to review', () => {
    expect(nextStatus('in_progress')).toBe('review')
  })

  it('advances review to completed', () => {
    expect(nextStatus('review')).toBe('completed')
  })

  it('leaves completed unchanged (terminal state)', () => {
    expect(nextStatus('completed')).toBe('completed')
  })

  it('leaves archived unchanged (terminal state)', () => {
    expect(nextStatus('archived')).toBe('archived')
  })
})
