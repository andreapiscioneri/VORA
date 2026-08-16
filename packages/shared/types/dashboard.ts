// One entry per widget the dashboard can render, in the user's chosen
// order. `visible` controls whether it renders at all; `size` controls the
// simple normal/wide grid span (§13: reorder, hide, add, resize, responsive).
export interface DashboardWidgetLayout {
  key: string
  visible: boolean
  size: 'normal' | 'wide'
}

export interface DashboardLayout {
  widgets: DashboardWidgetLayout[]
}

// Mirrors the widgets rendered by pages/dashboard/index.vue today, in their
// current order and sizing, so existing users see no visual change until
// they enter customize mode and change something themselves.
export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  widgets: [
    { key: 'today', visible: true, size: 'wide' },
    { key: 'priorities', visible: true, size: 'normal' },
    { key: 'crm', visible: true, size: 'normal' },
    { key: 'projects', visible: true, size: 'wide' },
  ],
}
