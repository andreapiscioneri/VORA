import * as Haptics from 'expo-haptics'
import { haptics } from './haptics'

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Warning: 'warning', Success: 'success', Error: 'error' },
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}))

afterEach(() => {
  jest.clearAllMocks()
})

describe('haptics', () => {
  it('tap triggers a light impact', () => {
    haptics.tap()
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
  })

  it('press triggers a medium impact', () => {
    haptics.press()
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium)
  })

  it('success/warning/error trigger the matching notification type', () => {
    haptics.success()
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success)

    haptics.warning()
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning)

    haptics.error()
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error)
  })

  it('selection triggers a selection change', () => {
    haptics.selection()
    expect(Haptics.selectionAsync).toHaveBeenCalled()
  })
})
