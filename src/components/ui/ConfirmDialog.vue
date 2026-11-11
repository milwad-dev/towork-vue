<script setup>
import { useConfirm } from '@/composables/useConfirm'
import Modal from './Modal.vue'

const { state, resolve } = useConfirm()
</script>

<template>
  <Modal :open="state.open" :title="state.title" :description="state.message" size="max-w-sm" @close="resolve(false)">
    <template #footer>
      <button type="button" class="btn btn-secondary" @click="resolve(false)">Cancel</button>
      <button
        type="button"
        class="btn"
        :class="state.danger ? 'btn-danger' : 'btn-primary'"
        autofocus
        @click="resolve(true)"
      >
        {{ state.confirmLabel }}
      </button>
    </template>
  </Modal>
</template>
