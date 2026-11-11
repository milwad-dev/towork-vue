<script setup>
import { colorOf } from '@/lib/constants'
defineProps({ label: { type: Object, required: true } })
</script>

<template>
  <span class="chip h-5 rounded-full px-2 text-[11px]" :class="colorOf(label.color).soft">{{ label.name }}</span>
</template>
