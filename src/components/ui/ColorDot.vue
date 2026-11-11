<script setup>
import { computed } from 'vue'
import { colorOf } from '@/lib/constants'

const props = defineProps({ color: String, size: { type: String, default: 'size-2' } })
const cls = computed(() => colorOf(props.color).dot)
</script>

<template>
  <span class="inline-block shrink-0 rounded-full" :class="[cls, size]" aria-hidden="true" />
</template>
