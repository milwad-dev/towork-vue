<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, CircleAlert, KeyRound, MailCheck } from '@lucide/vue'
import CodeInput from '@/components/ui/CodeInput.vue'
import FormField from '@/components/ui/FormField.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { api, errorMessage, fieldErrors } from '@/lib/api'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const ui = useUiStore()

/** 'email' → 'code' → 'password' */
const step = ref('email')
const form = reactive({ email: '', code: '', password: '', password_confirmation: '' })
const errors = ref({})
const error = ref('')
const loading = ref(false)

async function run(fn) {
  loading.value = true
  errors.value = {}
  error.value = ''
  try {
    await fn()
  } catch (e) {
    errors.value = fieldErrors(e)
    if (!Object.keys(errors.value).length) error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

const sendCode = () =>
  run(async () => {
    await api.post('/auth/forgot-password', { email: form.email })
    step.value = 'code'
  })

const resend = () =>
  run(async () => {
    await api.post('/auth/forgot-password', { email: form.email })
    ui.toast('A new code is on its way.', { type: 'info' })
  })

const checkCode = () =>
  run(async () => {
    await api.post('/auth/reset-password/check', { email: form.email, code: form.code })
    step.value = 'password'
  })

const reset = () =>
  run(async () => {
    if (form.password !== form.password_confirmation) {
      errors.value = { password_confirmation: 'Passwords do not match.' }
      return
    }
    await api.post('/auth/reset-password', { ...form })
    ui.toast('Password updated. You can sign in now.')
    router.replace({ name: 'login' })
  })
</script>

<template>
  <div>
    <div class="mb-6 flex size-11 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
      <component :is="step === 'code' ? MailCheck : KeyRound" class="size-5" />
    </div>

    <template v-if="step === 'email'">
      <h1 class="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
      <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">Enter your email and we'll send you a 6-digit code.</p>
    </template>
    <template v-else-if="step === 'code'">
      <h1 class="text-2xl font-semibold tracking-tight">Check your inbox</h1>
      <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        If an account exists for <span class="font-medium text-zinc-700 dark:text-zinc-200">{{ form.email }}</span>, we sent it a code. It expires in 60 minutes.
      </p>
    </template>
    <template v-else>
      <h1 class="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">Use at least 8 characters, including letters and numbers.</p>
    </template>

    <div
      v-if="error"
      class="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
      role="alert"
    >
      <CircleAlert class="mt-0.5 size-4 shrink-0" /> {{ error }}
    </div>

    <form v-if="step === 'email'" class="mt-8 space-y-5" novalidate @submit.prevent="sendCode">
      <FormField v-slot="{ id, invalid, describedBy }" label="Email" :error="errors.email">
        <input :id="id" v-model.trim="form.email" class="input" type="email" autocomplete="email" autofocus :aria-invalid="invalid" :aria-describedby="describedBy" />
      </FormField>
      <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="loading || !form.email"><Spinner v-if="loading" /> Send code</button>
    </form>

    <form v-else-if="step === 'code'" class="mt-8 space-y-5" novalidate @submit.prevent="checkCode">
      <div>
        <CodeInput v-model="form.code" :invalid="!!errors.code" @complete="(v) => ((form.code = v), checkCode())" />
        <p v-if="errors.code" class="field-error">{{ errors.code }}</p>
      </div>
      <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="loading || form.code.length !== 6"><Spinner v-if="loading" /> Continue</button>
      <p class="text-center text-[13px] text-zinc-500">
        Didn't get it?
        <button type="button" class="font-medium text-accent-600 hover:text-accent-500 dark:text-accent-400" :disabled="loading" @click="resend">Resend code</button>
        ·
        <button type="button" class="font-medium text-accent-600 hover:text-accent-500 dark:text-accent-400" @click="step = 'email'">Change email</button>
      </p>
    </form>

    <form v-else class="mt-8 space-y-4" novalidate @submit.prevent="reset">
      <FormField v-slot="{ id, invalid, describedBy }" label="New password" :error="errors.password">
        <input :id="id" v-model="form.password" class="input" type="password" autocomplete="new-password" autofocus :aria-invalid="invalid" :aria-describedby="describedBy" />
      </FormField>
      <FormField v-slot="{ id, invalid, describedBy }" label="Confirm new password" :error="errors.password_confirmation">
        <input :id="id" v-model="form.password_confirmation" class="input" type="password" autocomplete="new-password" :aria-invalid="invalid" :aria-describedby="describedBy" />
      </FormField>
      <p v-if="errors.code" class="field-error">{{ errors.code }}</p>
      <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="loading"><Spinner v-if="loading" /> Update password</button>
    </form>

    <RouterLink to="/login" class="mt-8 flex items-center justify-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
      <ArrowLeft class="size-4" /> Back to sign in
    </RouterLink>
  </div>
</template>
