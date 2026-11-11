<script setup>
defineProps({
  icon: { type: [Object, Function], required: true },
  title: { type: String, required: true },
  description: String,
  tone: { type: String, default: 'accent' }, // accent | green
})
</script>

<template>
  <div class="flex flex-col items-center px-6 py-16 text-center">
    <div class="relative mb-5">
      <div
        class="absolute inset-0 -z-10 scale-150 rounded-full blur-2xl"
        :class="tone === 'green' ? 'bg-green-500/15' : 'bg-accent-500/15'"
      />
      <div
        class="flex size-14 items-center justify-center rounded-2xl border bg-white shadow-soft dark:bg-zinc-900"
        :class="tone === 'green' ? 'border-green-500/20 text-green-500' : 'border-accent-500/20 text-accent-500'"
      >
        <component :is="icon" class="size-6" />
      </div>
    </div>
    <h3 class="text-[15px] font-semibold tracking-tight">{{ title }}</h3>
    <p v-if="description" class="mt-1.5 max-w-xs text-[13px] text-zinc-500 dark:text-zinc-400">{{ description }}</p>
    <div v-if="$slots.default" class="mt-5"><slot /></div>
  </div>
</template>
