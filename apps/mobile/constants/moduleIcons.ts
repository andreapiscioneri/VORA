import type { IconName } from '../components/Icon'

// One glyph per MODULE_NAV_ITEMS key, shown in the hamburger menu and the
// "Altro" tab so each module is recognizable at a glance instead of a
// uniform chevron. Reuses icons across conceptually related modules
// (e.g. training/knowledge both read "book-open") since the shared icon
// set is deliberately small and self-built (see components/Icon.tsx).
export const MODULE_ICONS: Record<string, IconName> = {
  voraAi: 'sparkles',
  attendance: 'clock',
  contacts: 'users',
  crm: 'trending-up',
  projects: 'folder',
  timesheets: 'timer',
  helpdesk: 'life-buoy',
  knowledge: 'book-open',
  leave: 'umbrella',
  expenses: 'credit-card',
  employees: 'users',
  orgChart: 'users',
  recruiting: 'user-plus',
  performanceReviews: 'trending-up',
  training: 'book-open',
  welfare: 'heart',
  payroll: 'credit-card',
  social: 'megaphone',
  marketing: 'mail',
  website: 'globe',
  wellbeing: 'wind',
  auditLog: 'shield',
  notifications: 'bell',
  settings: 'settings',
}
