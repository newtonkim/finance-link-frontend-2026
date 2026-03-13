import { defineAsyncComponent } from 'vue'

export const tenantSettings = {
  notifications: {
    path: 'developmentSet2tings',
    component: defineAsyncComponent(() => import('../tenatsSettings/notifications.vue')),
    title: 'Notification settings',
    description: 'Configure how you receive alerts and updates',
  },
}
