import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { auth: true },
    children: [
      { path: '', redirect: { name: 'today' } },
      { path: 'today', name: 'today', component: () => import('@/views/TasksView.vue'), props: { mode: 'today' }, meta: { title: 'Today' } },
      { path: 'upcoming', name: 'upcoming', component: () => import('@/views/TasksView.vue'), props: { mode: 'upcoming' }, meta: { title: 'Upcoming' } },
      { path: 'tasks', name: 'tasks', component: () => import('@/views/TasksView.vue'), props: { mode: 'all' }, meta: { title: 'All tasks' } },
      { path: 'categories/:id(\\d+)', name: 'category', component: () => import('@/views/TasksView.vue'), props: (r) => ({ mode: 'category', id: Number(r.params.id) }), meta: { title: 'Category' } },
      { path: 'labels/:id(\\d+)', name: 'label', component: () => import('@/views/TasksView.vue'), props: (r) => ({ mode: 'label', id: Number(r.params.id) }), meta: { title: 'Label' } },
      { path: 'board', name: 'board', component: () => import('@/views/BoardView.vue'), meta: { title: 'Board' } },
      { path: 'calendar', name: 'calendar', component: () => import('@/views/CalendarView.vue'), meta: { title: 'Calendar' } },
      { path: 'dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { title: 'Dashboard' } },
      { path: 'settings', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { title: 'Settings' } },
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: 'login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { guest: true, title: 'Sign in' } },
      { path: 'register', name: 'register', component: () => import('@/views/auth/RegisterView.vue'), meta: { guest: true, title: 'Create account' } },
      { path: 'forgot-password', name: 'forgot-password', component: () => import('@/views/auth/ForgotPasswordView.vue'), meta: { guest: true, title: 'Reset password' } },
      { path: 'verify-email', name: 'verify-email', component: () => import('@/views/auth/VerifyEmailView.vue'), meta: { auth: true, title: 'Verify email' } },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { title: 'Not found' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()

  if (to.matched.some((r) => r.meta.auth) && !auth.isAuthenticated) {
    return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'today' }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · ToWork` : 'ToWork'
})

export { routes }
export default router
