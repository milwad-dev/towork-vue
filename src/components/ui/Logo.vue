<script setup>
import { useId } from 'vue'

defineProps({
  size: { type: String, default: 'size-7' },
  withText: { type: Boolean, default: true },
  textClass: { type: String, default: 'text-[15px]' },
})
// Unique per instance: a hidden copy (e.g. the desktop sidebar on mobile) would
// otherwise own the shared gradient id and the visible logo would render blank.
const gradientId = `towork-logo-${useId()}`
</script>

<template>
  <span class="inline-flex items-center gap-2.5">
    <svg :class="size" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#6366f1" />
          <stop offset="1" stop-color="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" :fill="`url(#${gradientId})`" />
      <path d="M19 33.5l8.5 8.5L45 23" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span v-if="withText" class="font-semibold tracking-tight" :class="textClass">ToWork</span>
  </span>
</template>
