<script setup>
import { ArrowLeft } from '@lucide/vue'
import Logo from '@/components/ui/Logo.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
    <div class="pointer-events-none absolute top-1/3 left-1/2 -z-10 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-500/10 blur-3xl" />
    <Logo :with-text="false" size="size-12" />
    <p class="mt-8 bg-gradient-to-b from-zinc-900 to-zinc-400 bg-clip-text text-8xl font-bold tracking-tighter text-transparent dark:from-white dark:to-zinc-600">404</p>
    <h1 class="mt-2 text-xl font-semibold tracking-tight">This page took the day off</h1>
    <p class="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">The page you're looking for doesn't exist or was moved.</p>
    <RouterLink :to="auth.isAuthenticated ? '/today' : '/login'" class="btn btn-primary btn-lg mt-8">
      <ArrowLeft class="size-4" /> {{ auth.isAuthenticated ? 'Back to Today' : 'Go to sign in' }}
    </RouterLink>
  </div>
</template>
