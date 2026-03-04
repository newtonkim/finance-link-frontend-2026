import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const isSidebarOpen = ref(true)
  const theme = ref('light')

  function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  return { isSidebarOpen, theme, toggleSidebar }
})
