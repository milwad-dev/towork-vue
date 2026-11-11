import axios from 'axios'

export const TOKEN_KEY = 'towork.token'

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '') + '/',
  headers: { Accept: 'application/json' },
  timeout: 20000,
})

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable */
  }
}

const timezone = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return null
  }
})()

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Lets the API compute "today", "overdue" and stats in the user's local day.
  if (timezone) config.headers['X-Timezone'] = timezone
  // Paths are relative to the versioned base URL.
  if (config.url?.startsWith('/')) config.url = config.url.slice(1)
  return config
})

let onUnauthorized = null
/** Register a handler for 401 responses (set up by the auth store). */
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized && !error.config?.skipAuthRedirect) {
      onUnauthorized()
    }
    return Promise.reject(error)
  },
)

/** Field errors from a Laravel 422 response: `{ field: 'first message' }`. */
export function fieldErrors(error) {
  const errors = error?.response?.data?.errors
  if (!errors) return {}
  return Object.fromEntries(
    Object.entries(errors).map(([key, messages]) => [key, Array.isArray(messages) ? messages[0] : messages]),
  )
}

/** A friendly, single-line message for any failed request. */
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) {
    return error?.code === 'ECONNABORTED'
      ? 'The server took too long to respond.'
      : "Can't reach the server. Check your connection."
  }
  const { status, data } = error.response
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.'
  if (status >= 500) return 'The server had a problem. Please try again.'
  return data?.message || fallback
}
