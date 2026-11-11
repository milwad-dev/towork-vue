<script setup>
import { RouterView } from 'vue-router'
import { CalendarDays, Check, Flag, Kanban, Sparkles } from '@lucide/vue'
import Logo from '@/components/ui/Logo.vue'

const preview = [
  { title: 'Draft the v1 launch post', tag: 'Marketing', color: 'bg-pink-400', done: true },
  { title: 'Review pull requests', tag: 'Work', color: 'bg-sky-400', done: true, flag: true },
  { title: 'Plan sprint goals', tag: 'Work', color: 'bg-sky-400', due: 'Today' },
  { title: 'Book flights to Lisbon', tag: 'Travel', color: 'bg-amber-400', due: 'Fri' },
]
</script>

<template>
  <div class="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
    <!-- Form column -->
    <div class="flex flex-col px-6 py-8 sm:px-10">
      <RouterLink to="/" class="w-fit rounded-lg"><Logo /></RouterLink>
      <main class="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
      <p class="text-center text-xs text-zinc-400 dark:text-zinc-500">
        ToWork is free and open source ·
        <a href="https://github.com/milwad-dev/towork-vue" target="_blank" rel="noopener" class="underline-offset-2 hover:text-zinc-600 hover:underline dark:hover:text-zinc-300">GitHub</a>
      </p>
    </div>

    <!-- Brand panel -->
    <aside
      class="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-12 text-white lg:flex lg:flex-col lg:justify-between"
      aria-hidden="true"
    >
      <div class="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-violet-400/30 blur-3xl" />
      <div class="pointer-events-none absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-indigo-300/20 blur-3xl" />
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.07]"
        style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 22px 22px"
      />

      <div class="relative">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
          <Sparkles class="size-3.5" /> Version 1.0
        </span>
        <h2 class="mt-6 max-w-md text-4xl leading-tight font-semibold tracking-tight">
          Calm, focused task management for people who ship.
        </h2>
        <p class="mt-4 max-w-md text-[15px] text-indigo-100/90">
          Plan your day, organize projects, and track progress with lists, a Kanban board, and a calendar, all in one place.
        </p>
      </div>

      <!-- Mock app card -->
      <div class="relative mx-auto w-full max-w-md rounded-2xl bg-white/95 p-2 text-zinc-800 shadow-2xl ring-1 ring-black/5 backdrop-blur">
        <div class="flex items-center justify-between px-3 pt-2 pb-3">
          <div>
            <p class="text-sm font-semibold">Today</p>
            <p class="text-xs text-zinc-500">4 tasks · 2 done</p>
          </div>
          <div class="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-100">
            <div class="h-full w-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
          </div>
        </div>
        <ul>
          <li v-for="t in preview" :key="t.title" class="flex items-center gap-3 rounded-xl px-3 py-2.5 odd:bg-zinc-50">
            <span
              class="flex size-[18px] items-center justify-center rounded-full border-[1.5px]"
              :class="t.done ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-300'"
            >
              <Check v-if="t.done" class="size-3 text-white" stroke-width="3" />
            </span>
            <span class="flex-1 truncate text-[13px]" :class="t.done && 'text-zinc-400 line-through'">{{ t.title }}</span>
            <Flag v-if="t.flag" class="size-3.5 text-red-500" />
            <span v-if="t.due" class="text-xs font-medium text-indigo-600">{{ t.due }}</span>
            <span class="flex items-center gap-1.5 text-xs text-zinc-500"><span class="size-1.5 rounded-full" :class="t.color" />{{ t.tag }}</span>
          </li>
        </ul>
      </div>

      <div class="relative flex gap-8 text-sm text-indigo-100/90">
        <span class="flex items-center gap-2"><Kanban class="size-4" /> Kanban board</span>
        <span class="flex items-center gap-2"><CalendarDays class="size-4" /> Calendar</span>
        <span class="flex items-center gap-2"><Flag class="size-4" /> Priorities</span>
      </div>
    </aside>
  </div>
</template>
