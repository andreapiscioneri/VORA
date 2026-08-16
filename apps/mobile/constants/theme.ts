export const spacing = (n: number) => n * 4

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999,
}

const primary = '#39FF14'
const primaryMuted = '#1F8A0C'
const danger = '#FF4D4D'
const warning = '#FFB020'

export const darkColors = {
  primary,
  primaryMuted,
  danger,
  warning,
  background: '#0A0A0A',
  surface: '#141414',
  border: '#3A3A3A',
  textPrimary: '#FFFFFF',
  textSecondary: '#8A8A8A',
  tabBarBackground: '#141414',
  tabBarBorder: '#3A3A3A',
  tabBarInactive: '#8A8A8A',
}

export const lightColors = {
  primary,
  primaryMuted,
  danger,
  warning,
  background: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#E5E5E5',
  textPrimary: '#0A0A0A',
  textSecondary: '#6B6B6B',
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E5E5E5',
  tabBarInactive: '#8A8A8A',
}

export type ThemeColors = typeof darkColors
