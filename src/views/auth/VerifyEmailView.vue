<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleAlert, MailCheck } from '@lucide/vue'
import CodeInput from '@/components/ui/CodeInput.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { errorMessage, fieldErrors } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()
const route = useRoute()

const code = ref('')
const error = ref('')
const loading = ref(false)
const cooldown = ref(0)
let timer = null

function startCooldown(seconds = 30) {
  cooldown.value = seconds
  clearInterval(timer)
  timer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) clearInterval(timer)
  }, 1000)
}

onMounted(() => {
  if (auth.isVerified) router.replace('/today')
  // A code was already sent on registration.
  if (route.query.welcome) startCooldown()
})
onBeforeUnmount(() => clearInterval(timer))

async function verify(value) {
  if (typeof value === 'string') code.value = value
  if (code.value.length !== 6 || loading.value) return
  loading.value = true
  error.value = ''
  try {
    await auth.verifyEmail(code.value)
    ui.toast('Email verified. Welcome aboard!')
    router.replace('/today')
  } catch (e) {
    error.value = fieldErrors(e).code || errorMessage(e)
  } finally {
    loading.value = false
  }
}

async function resend() {
  error.value = ''
  try {
    await auth.sendVerification()
    ui.toast('A new code is on its way.', { type: 'info' })
    startCooldown()
  } catch (e) {
    if (e.response?.status === 409) {
      ui.toast('Your email is already verified.')
      router.replace('/today')
      return
    }
    error.value = errorMessage(e)
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex size-11 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
      <MailCheck class="size-5" />
    </div>
    <h1 class="text-2xl font-semibold tracking-tight">{{ route.query.welcome ? 'One last step' : 'Verify your email' }}</h1>
    <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
      Enter the 6-digit code we sent to
      <span class="font-medium text-zinc-700 dark:text-zinc-200">{{ auth.user?.email }}</span>.
    </p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="verify">
      <div>
        <CodeInput v-model="code" :invalid="!!error" :disabled="loading" @complete="verify" />
        <p v-if="error" class="field-error flex items-center gap-1.5" role="alert"><CircleAlert class="size-3.5" /> {{ error }}</p>
      </div>
      <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="loading || code.length !== 6"><Spinner v-if="loading" /> Verify email</button>
    </form>

    <div class="mt-6 flex items-center justify-between text-[13px]">
      <button type="button" class="font-medium text-accent-600 hover:text-accent-500 disabled:text-zinc-400 dark:text-accent-400" :disabled="cooldown > 0" @click="resend">
        {{ cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code' }}
      </button>
      <RouterLink to="/today" class="font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">Do this later →</RouterLink>
    </div>
  </div>
</template>
