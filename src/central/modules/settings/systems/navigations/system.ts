import { defineAsyncComponent } from 'vue'

export const settingSystemsRoutes = {
  developmentSettings: {
    path: 'developmentSettings',
    component: defineAsyncComponent(() => import('../developmentSettings/developmentSettings.vue')),
    title: 'development settings',
    description: 'system under maintaince  settings',
  },
  notifications: {
    path: 'developmentSet2tings',
    component: defineAsyncComponent(() => import('../notifications/notifications.vue')),
    title: 'Notification settings',
    description: 'Configure how you receive alerts and updates',
  },
}
