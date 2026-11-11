<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleAlert, Eye, EyeOff } from '@lucide/vue'
import FormField from '@/components/ui/FormField.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { errorMessage, fieldErrors } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ login: '', password: '' })
const errors = ref({})
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function submit() {
  loading.value = true
  errors.value = {}
  error.value = ''
  try {
    await auth.login(form)
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/today'
    router.replace(redirect)
  } catch (e) {
    errors.value = fieldErrors(e)
    if (!Object.keys(errors.value).length) error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">Welcome back</h1>
    <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">Sign in to pick up where you left off.</p>

    <div
      v-if="error"
      class="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
      role="alert"
    >
      <CircleAlert class="mt-0.5 size-4 shrink-0" /> {{ error }}
    </div>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="submit">
      <FormField v-slot="{ id, invalid, describedBy }" label="Email or phone" :error="errors.login">
        <input
          :id="id"
          v-model.trim="form.login"
          class="input"
          type="text"
          autocomplete="username"
          placeholder="you@example.com"
          required
          autofocus
          :aria-invalid="invalid"
          :aria-describedby="describedBy"
        />
      </FormField>

      <FormField v-slot="{ id, invalid, describedBy }" :error="errors.password">
        <div class="mb-1.5 flex items-center justify-between">
          <label :for="id" class="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Password</label>
          <RouterLink to="/forgot-password" class="text-[13px] font-medium text-accent-600 hover:text-accent-500 dark:text-accent-400">
            Forgot password?
          </RouterLink>
        </div>
        <div class="relative">
          <input
            :id="id"
            v-model="form.password"
            class="input pr-10"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
            :aria-invalid="invalid"
            :aria-describedby="describedBy"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <component :is="showPassword ? EyeOff : Eye" class="size-4" />
          </button>
        </div>
      </FormField>

      <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="loading">
        <Spinner v-if="loading" /> Sign in
      </button>
    </form>

    <p class="mt-8 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
      New to ToWork?
      <RouterLink to="/register" class="font-medium text-accent-600 hover:text-accent-500 dark:text-accent-400">Create an account</RouterLink>
    </p>
  </div>
</template>
