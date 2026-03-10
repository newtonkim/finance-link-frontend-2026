import { defineStore } from 'pinia'
import { ref } from 'vue'
import { logoutApi, type AuthSuccessData, type AuthUser } from '@/central/api/auth'
import { setBearerToken } from 'septor-store';
import { storeUserLogedinData, storeUserPermissions } from '@/Global';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref(localStorage.getItem('token'))

  function setAuthSession(data: AuthSuccessData) {
    token.value = data.access_token
    user.value = data.user

    localStorage.setItem('token', data.access_token)
    localStorage.setItem('auth_user', JSON.stringify(data.user))
    setBearerToken({token: data.access_token,...data.user})
    storeUserLogedinData(data.user)
    storeUserPermissions({data:data?.permissions})
  }

  function hydrateAuth() {
    const rawUser = localStorage.getItem('auth_user')
    if (!rawUser) {
      return
    }

    try {
      user.value = JSON.parse(rawUser) as AuthUser
    } catch {
      localStorage.removeItem('auth_user')
      user.value = null
    }
  }

  async function logout() {
    try {
      if (token.value) {
        await logoutApi()
      }
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('auth_user')
    }
  }

  return { user, token, setAuthSession, hydrateAuth, logout }
})
