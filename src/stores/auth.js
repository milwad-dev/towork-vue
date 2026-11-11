import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api, getToken, setToken } from '@/lib/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getToken())
  const user = ref(null)
  const ready = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const isVerified = computed(() => !!user.value?.email_verified_at)
  const initials = computed(() => {
    const name = user.value?.name?.trim() || ''
    const parts = name.split(/\s+/).filter(Boolean)
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
  })

  function setSession(data) {
    token.value = data.token
    user.value = data.user
    setToken(data.token)
  }

  function clear() {
    token.value = null
    user.value = null
    setToken(null)
  }

  /** Load the current user once at startup (if we have a token). */
  async function init() {
    if (ready.value) return
    if (token.value) {
      try {
        const { data } = await api.get('/me', { skipAuthRedirect: true })
        user.value = data.data
      } catch (e) {
        if (e.response?.status === 401) clear()
      }
    }
    ready.value = true
  }

  async function login(payload) {
    const { data } = await api.post('/auth/login', payload)
    setSession(data.data)
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload)
    setSession(data.data)
  }

  async function logout() {
    try {
      await api.post('/auth/logout', null, { skipAuthRedirect: true })
    } catch {
      /* token might already be invalid */
    }
    clear()
  }

  async function updateProfile(payload) {
    const { data } = await api.put('/me', payload)
    user.value = data.data
  }

  async function updatePassword(payload) {
    await api.put('/me/password', payload)
  }

  async function deleteAccount(password) {
    await api.delete('/me', { data: { password } })
    clear()
  }

  async function sendVerification() {
    await api.post('/auth/email/verification-notification')
  }

  async function verifyEmail(code) {
    const { data } = await api.post('/auth/email/verify', { code })
    user.value = data.data
  }

  return {
    token,
    user,
    ready,
    isAuthenticated,
    isVerified,
    initials,
    init,
    login,
    register,
    logout,
    clear,
    updateProfile,
    updatePassword,
    deleteAccount,
    sendVerification,
    verifyEmail,
  }
})
