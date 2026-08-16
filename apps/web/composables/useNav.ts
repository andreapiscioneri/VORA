export interface NavItem {
  key: string
  label: string
  icon: string
  to: string
}

export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'nav.overview',
    items: [{ key: 'dashboard', label: 'nav.dashboard', icon: 'grid', to: '/dashboard' }],
  },
  {
    title: 'nav.relationships',
    items: [
      { key: 'contacts', label: 'nav.contacts', icon: 'users', to: '/contacts' },
      { key: 'crm', label: 'nav.crm', icon: 'trending-up', to: '/crm' },
    ],
  },
  {
    title: 'nav.time',
    items: [
      { key: 'calendar', label: 'nav.calendar', icon: 'calendar', to: '/calendar' },
      { key: 'tasks', label: 'nav.tasks', icon: 'check-square', to: '/tasks' },
      { key: 'appointments', label: 'nav.appointments', icon: 'clock', to: '/appointments' },
    ],
  },
  {
    title: 'nav.communications',
    items: [{ key: 'inbox', label: 'nav.inbox', icon: 'inbox', to: '/inbox' }],
  },
  {
    title: 'nav.work',
    items: [
      { key: 'projects', label: 'nav.projects', icon: 'folder', to: '/projects' },
      { key: 'timesheets', label: 'nav.timesheets', icon: 'timer', to: '/timesheets' },
      { key: 'helpdesk', label: 'nav.helpdesk', icon: 'life-buoy', to: '/helpdesk' },
      { key: 'knowledge', label: 'nav.knowledge', icon: 'book-open', to: '/knowledge' },
      { key: 'expenses', label: 'nav.expenses', icon: 'credit-card', to: '/expenses' },
      { key: 'leave', label: 'nav.leave', icon: 'umbrella', to: '/leave' },
      { key: 'employees', label: 'nav.employees', icon: 'users', to: '/employees' },
      { key: 'wellbeing', label: 'nav.wellbeing', icon: 'heart', to: '/wellbeing' },
      { key: 'auditLog', label: 'nav.auditLog', icon: 'shield', to: '/audit-log' },
    ],
  },
  {
    title: 'nav.marketing',
    items: [
      { key: 'website', label: 'nav.website', icon: 'globe', to: '/website' },
      { key: 'social', label: 'nav.social', icon: 'megaphone', to: '/social' },
      { key: 'campaigns', label: 'nav.campaigns', icon: 'mail', to: '/campaigns' },
      { key: 'templates', label: 'nav.templates', icon: 'book-open', to: '/marketing/templates' },
      { key: 'segments', label: 'nav.segments', icon: 'flag', to: '/marketing/segments' },
      { key: 'automations', label: 'nav.automations', icon: 'sparkles', to: '/marketing/automations' },
    ],
  },
]

export const launcherApps: NavItem[] = navGroups.flatMap((g) => g.items).concat([
  { key: 'settings', label: 'nav.settings', icon: 'settings', to: '/settings' },
])
