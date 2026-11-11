<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CircleAlert } from '@lucide/vue'
import FormField from '@/components/ui/FormField.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { errorMessage, fieldErrors } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
const errors = ref({})
const error = ref('')
const loading = ref(false)

/** 0–4 strength meter: length, letters, numbers, symbols/mixed case. */
const strength = computed(() => {
  const p = form.password
  if (!p) return 0
  let s = 0
  if (p.length >= 8) s++
  if (/[a-zA-Z]/.test(p) && /\d/.test(p)) s++
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++
  if (/[^a-zA-Z0-9]/.test(p) || p.length >= 14) s++
  return s
})
const strengthLabel = computed(() => ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][strength.value])
const strengthColor = computed(() => ['bg-zinc-300', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-500'][strength.value])

async function submit() {
  errors.value = {}
  error.value = ''
  if (form.password !== form.password_confirmation) {
    errors.value = { password_confirmation: 'Passwords do not match.' }
    return
  }
  loading.value = true
  try {
    const payload = { ...form }
    if (!payload.phone) delete payload.phone
    await auth.register(payload)
    router.replace({ name: 'verify-email', query: { welcome: '1' } })
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
    <h1 class="text-2xl font-semibold tracking-tight">Create your account</h1>
    <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">Start organizing your work in under a minute.</p>

    <div
      v-if="error"
      class="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
      role="alert"
    >
      <CircleAlert class="mt-0.5 size-4 shrink-0" /> {{ error }}
    </div>

    <form class="mt-8 space-y-4" novalidate @submit.prevent="submit">
      <FormField v-slot="{ id, invalid, describedBy }" label="Full name" :error="errors.name">
        <input :id="id" v-model.trim="form.name" class="input" autocomplete="name" placeholder="Jane Doe" autofocus :aria-invalid="invalid" :aria-describedby="describedBy" />
      </FormField>
      <FormField v-slot="{ id, invalid, describedBy }" label="Email" :error="errors.email">
        <input :id="id" v-model.trim="form.email" class="input" type="email" autocomplete="email" placeholder="you@example.com" :aria-invalid="invalid" :aria-describedby="describedBy" />
      </FormField>
      <FormField v-slot="{ id, invalid, describedBy }" label="Phone (optional)" :error="errors.phone" hint="Lets you sign in with your phone number too.">
        <input :id="id" v-model.trim="form.phone" class="input" type="tel" autocomplete="tel" placeholder="+1 555 000 1234" :aria-invalid="invalid" :aria-describedby="describedBy" />
      </FormField>
      <FormField v-slot="{ id, invalid, describedBy }" label="Password" :error="errors.password">
        <input :id="id" v-model="form.password" class="input" type="password" autocomplete="new-password" :aria-invalid="invalid" :aria-describedby="describedBy" />
        <div v-if="form.password" class="mt-2 flex items-center gap-2" aria-live="polite">
          <div class="flex flex-1 gap-1">
            <span v-for="i in 4" :key="i" class="h-1 flex-1 rounded-full transition-colors" :class="i <= strength ? strengthColor : 'bg-zinc-200 dark:bg-zinc-800'" />
          </div>
          <span class="w-16 text-right text-xs text-zinc-500">{{ strengthLabel }}</span>
        </div>
      </FormField>
      <FormField v-slot="{ id, invalid, describedBy }" label="Confirm password" :error="errors.password_confirmation">
        <input :id="id" v-model="form.password_confirmation" class="input" type="password" autocomplete="new-password" :aria-invalid="invalid" :aria-describedby="describedBy" />
      </FormField>

      <button type="submit" class="btn btn-primary btn-lg mt-2 w-full" :disabled="loading">
        <Spinner v-if="loading" /> Create account
      </button>
    </form>

    <p class="mt-8 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
      Already have an account?
      <RouterLink to="/login" class="font-medium text-accent-600 hover:text-accent-500 dark:text-accent-400">Sign in</RouterLink>
    </p>
  </div>
</template>
