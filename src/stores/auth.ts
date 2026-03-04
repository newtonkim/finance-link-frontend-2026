import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))

  function login() {
    /* ... */
  }
  function logout() {
    /* ... */
  }

  return { user, token, login, logout }
})
