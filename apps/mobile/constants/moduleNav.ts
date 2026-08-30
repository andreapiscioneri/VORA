// Every module screen reachable from the authenticated app — the "Altro" tab
// (more.tsx) lists them all, and the dashboard hamburger menu (Screen.tsx)
// reuses the same list for quick access without a tab switch.
export const MODULE_NAV_ITEMS = [
  { key: 'contacts', route: '/contacts' },
  { key: 'crm', route: '/crm' },
  { key: 'projects', route: '/projects' },
  { key: 'timesheets', route: '/timesheets' },
  { key: 'helpdesk', route: '/helpdesk' },
  { key: 'knowledge', route: '/knowledge' },
  { key: 'leave', route: '/leave' },
  { key: 'expenses', route: '/expenses' },
  { key: 'employees', route: '/employees' },
  { key: 'social', route: '/social' },
  { key: 'marketing', route: '/marketing' },
  { key: 'website', route: '/website' },
  { key: 'wellbeing', route: '/wellbeing' },
  { key: 'auditLog', route: '/audit-log' },
  { key: 'notifications', route: '/notifications' },
  { key: 'settings', route: '/settings' },
] as const
