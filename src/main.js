import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './lib/api'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// An expired/revoked token anywhere logs the user out and sends them to sign in.
setUnauthorizedHandler(() => {
  const auth = useAuthStore(pinia)
  if (!auth.isAuthenticated) return
  auth.clear()
  const current = router.currentRoute.value
  router.replace({ name: 'login', query: current.meta.auth ? { redirect: current.fullPath } : {} })
})

app.mount('#app')
