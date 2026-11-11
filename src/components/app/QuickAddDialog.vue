<script setup>
import Modal from '@/components/ui/Modal.vue'
import QuickAdd from '@/components/tasks/QuickAdd.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <Modal :open="ui.quickAddOpen" title="New task" bare size="max-w-xl" position="top" @close="ui.quickAddOpen = false">
    <div class="p-2">
      <QuickAdd :key="JSON.stringify(ui.quickAddDefaults)" :defaults="ui.quickAddDefaults" expanded @created="ui.quickAddOpen = false" @cancel="ui.quickAddOpen = false" />
    </div>
  </Modal>
</template>
