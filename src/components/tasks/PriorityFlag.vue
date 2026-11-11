<script setup>
import { Flag } from '@lucide/vue'
import { priorityOf } from '@/lib/constants'
defineProps({ priority: Number, size: { type: String, default: 'size-3.5' } })
</script>

<template>
  <Flag :class="[size, priorityOf(priority).flag]" :fill="priority >= 3 ? 'currentColor' : 'none'" :aria-label="`${priorityOf(priority).label} priority`" />
</template>
