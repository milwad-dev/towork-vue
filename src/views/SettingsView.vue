<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BadgeCheck, MailWarning, Monitor, Moon, Settings, Sun } from '@lucide/vue'
import FormField from '@/components/ui/FormField.vue'
import Modal from '@/components/ui/Modal.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { errorMessage, fieldErrors } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

// Profile
const profile = reactive({ name: auth.user?.name ?? '', email: auth.user?.email ?? '', phone: auth.user?.phone ?? '' })
const profileErrors = ref({})
const savingProfile = ref(false)
async function saveProfile() {
  savingProfile.value = true
  profileErrors.value = {}
  const emailChanged = profile.email !== auth.user?.email
  try {
    await auth.updateProfile({ ...profile, phone: profile.phone || null })
    ui.toast(emailChanged ? 'Profile saved. Please verify your new email.' : 'Profile saved')
  } catch (e) {
    profileErrors.value = fieldErrors(e)
    if (!Object.keys(profileErrors.value).length) ui.toast(errorMessage(e), { type: 'error' })
  } finally {
    savingProfile.value = false
  }
}

// Password
const password = reactive({ current_password: '', password: '', password_confirmation: '' })
const passwordErrors = ref({})
const savingPassword = ref(false)
async function savePassword() {
  passwordErrors.value = {}
  if (password.password !== password.password_confirmation) {
    passwordErrors.value = { password_confirmation: 'Passwords do not match.' }
    return
  }
  savingPassword.value = true
  try {
    await auth.updatePassword({ ...password })
    Object.assign(password, { current_password: '', password: '', password_confirmation: '' })
    ui.toast('Password updated')
  } catch (e) {
    passwordErrors.value = fieldErrors(e)
    if (!Object.keys(passwordErrors.value).length) ui.toast(errorMessage(e), { type: 'error' })
  } finally {
    savingPassword.value = false
  }
}

// Verification
const sending = ref(false)
async function sendCode() {
  sending.value = true
  try {
    await auth.sendVerification()
    router.push('/verify-email')
  } catch (e) {
    ui.toast(errorMessage(e), { type: 'error' })
  } finally {
    sending.value = false
  }
}

// Delete account
const deleteOpen = ref(false)
const deleteForm = reactive({ confirm: '', password: '' })
const deleteError = ref('')
const deleting = ref(false)
async function deleteAccount() {
  deleting.value = true
  deleteError.value = ''
  try {
    await auth.deleteAccount(deleteForm.password)
    ui.toast('Your account has been deleted.', { type: 'info' })
    router.replace({ name: 'register' })
  } catch (e) {
    deleteError.value = fieldErrors(e).password || errorMessage(e)
  } finally {
    deleting.value = false
  }
}

const themes = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]
</script>

<template>
  <div class="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
    <header class="mb-8 flex items-start gap-3">
      <div class="mt-1 flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80"><Settings class="size-5 text-accent-500" /></div>
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>
        <p class="text-[13px] text-zinc-500 dark:text-zinc-400">Manage your account and preferences.</p>
      </div>
    </header>

    <div class="space-y-6">
      <!-- Email status -->
      <div
        v-if="!auth.isVerified"
        class="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10"
      >
        <MailWarning class="size-5 text-amber-600 dark:text-amber-400" />
        <div class="min-w-0 flex-1">
          <p class="text-[13px] font-semibold text-amber-900 dark:text-amber-200">Your email isn't verified</p>
          <p class="text-xs text-amber-800/80 dark:text-amber-300/80">We'll send a 6-digit code to {{ auth.user?.email }}.</p>
        </div>
        <button type="button" class="btn btn-sm bg-amber-600 text-white hover:bg-amber-500" :disabled="sending" @click="sendCode">
          <Spinner v-if="sending" /> Send code
        </button>
      </div>

      <!-- Profile -->
      <section class="card">
        <div class="border-b border-zinc-100 p-5 dark:border-zinc-800">
          <h2 class="text-[15px] font-semibold">Profile</h2>
          <p class="text-xs text-zinc-500">Your name and contact details.</p>
        </div>
        <form class="space-y-4 p-5" @submit.prevent="saveProfile">
          <div class="flex items-center gap-4">
            <span class="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-semibold text-white">{{ auth.initials }}</span>
            <div>
              <p class="font-medium">{{ auth.user?.name }}</p>
              <p class="flex items-center gap-1 text-xs text-zinc-500">
                <BadgeCheck v-if="auth.isVerified" class="size-3.5 text-green-500" /> {{ auth.isVerified ? 'Verified account' : 'Unverified' }}
              </p>
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <FormField v-slot="{ id, invalid, describedBy }" label="Name" :error="profileErrors.name">
              <input :id="id" v-model.trim="profile.name" class="input" autocomplete="name" :aria-invalid="invalid" :aria-describedby="describedBy" />
            </FormField>
            <FormField v-slot="{ id, invalid, describedBy }" label="Phone" :error="profileErrors.phone">
              <input :id="id" v-model.trim="profile.phone" class="input" type="tel" autocomplete="tel" placeholder="Optional" :aria-invalid="invalid" :aria-describedby="describedBy" />
            </FormField>
          </div>
          <FormField v-slot="{ id, invalid, describedBy }" label="Email" :error="profileErrors.email" hint="Changing your email will require verifying it again.">
            <input :id="id" v-model.trim="profile.email" class="input" type="email" autocomplete="email" :aria-invalid="invalid" :aria-describedby="describedBy" />
          </FormField>
          <div class="flex justify-end">
            <button type="submit" class="btn btn-primary" :disabled="savingProfile"><Spinner v-if="savingProfile" /> Save profile</button>
          </div>
        </form>
      </section>

      <!-- Appearance -->
      <section class="card">
        <div class="border-b border-zinc-100 p-5 dark:border-zinc-800">
          <h2 class="text-[15px] font-semibold">Appearance</h2>
          <p class="text-xs text-zinc-500">Choose how ToWork looks on this device.</p>
        </div>
        <div class="grid grid-cols-3 gap-3 p-5" role="radiogroup" aria-label="Theme">
          <button
            v-for="t in themes"
            :key="t.value"
            type="button"
            role="radio"
            :aria-checked="ui.theme === t.value"
            class="flex flex-col items-center gap-2 rounded-xl border p-4 text-[13px] font-medium transition"
            :class="ui.theme === t.value ? 'border-accent-500 bg-accent-500/5 text-accent-700 ring-2 ring-accent-500/20 dark:text-accent-300' : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60'"
            @click="ui.theme = t.value"
          >
            <component :is="t.icon" class="size-5" /> {{ t.label }}
          </button>
        </div>
      </section>

      <!-- Password -->
      <section class="card">
        <div class="border-b border-zinc-100 p-5 dark:border-zinc-800">
          <h2 class="text-[15px] font-semibold">Password</h2>
          <p class="text-xs text-zinc-500">Use at least 8 characters, including letters and numbers.</p>
        </div>
        <form class="space-y-4 p-5" @submit.prevent="savePassword">
          <FormField v-slot="{ id, invalid, describedBy }" label="Current password" :error="passwordErrors.current_password">
            <input :id="id" v-model="password.current_password" class="input" type="password" autocomplete="current-password" :aria-invalid="invalid" :aria-describedby="describedBy" />
          </FormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <FormField v-slot="{ id, invalid, describedBy }" label="New password" :error="passwordErrors.password">
              <input :id="id" v-model="password.password" class="input" type="password" autocomplete="new-password" :aria-invalid="invalid" :aria-describedby="describedBy" />
            </FormField>
            <FormField v-slot="{ id, invalid, describedBy }" label="Confirm new password" :error="passwordErrors.password_confirmation">
              <input :id="id" v-model="password.password_confirmation" class="input" type="password" autocomplete="new-password" :aria-invalid="invalid" :aria-describedby="describedBy" />
            </FormField>
          </div>
          <div class="flex justify-end">
            <button type="submit" class="btn btn-primary" :disabled="savingPassword || !password.current_password || !password.password">
              <Spinner v-if="savingPassword" /> Update password
            </button>
          </div>
        </form>
      </section>

      <!-- Danger zone -->
      <section class="card border-red-200 dark:border-red-500/20">
        <div class="flex flex-wrap items-center gap-4 p-5">
          <div class="min-w-0 flex-1">
            <h2 class="text-[15px] font-semibold text-red-600 dark:text-red-400">Delete account</h2>
            <p class="text-xs text-zinc-500">Permanently delete your account, tasks, categories and labels. This cannot be undone.</p>
          </div>
          <button type="button" class="btn btn-danger" @click="deleteOpen = true">Delete account</button>
        </div>
      </section>
    </div>

    <Modal
      :open="deleteOpen"
      title="Delete your account?"
      description="All of your data will be permanently removed. This cannot be undone."
      @close="deleteOpen = false"
    >
      <form id="delete-form" class="space-y-4" @submit.prevent="deleteAccount">
        <FormField v-slot="{ id }" label="Type DELETE to confirm">
          <input :id="id" v-model="deleteForm.confirm" class="input" autocomplete="off" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Your password" :error="deleteError">
          <input :id="id" v-model="deleteForm.password" class="input" type="password" autocomplete="current-password" :aria-invalid="invalid" />
        </FormField>
      </form>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="deleteOpen = false">Cancel</button>
        <button type="submit" form="delete-form" class="btn btn-danger" :disabled="deleteForm.confirm !== 'DELETE' || !deleteForm.password || deleting">
          <Spinner v-if="deleting" /> Delete forever
        </button>
      </template>
    </Modal>
  </div>
</template>
