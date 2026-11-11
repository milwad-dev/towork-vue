import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'

/**
 * Store factory for the small, per-user collections that are loaded in full
 * (categories and labels). Both endpoints share the same shape.
 */
export function defineCollectionStore(id, endpoint) {
  return defineStore(id, () => {
    const items = ref([])
    const loaded = ref(false)
    const loading = ref(false)
    let refreshTimer = null

    function sort() {
      items.value.sort((a, b) => a.name.localeCompare(b.name))
    }

    async function fetch() {
      loading.value = true
      try {
        const { data } = await api.get(endpoint)
        items.value = data.data
        sort()
        loaded.value = true
      } finally {
        loading.value = false
      }
    }

    /** Debounced refresh, used to keep task counts fresh after task changes. */
    function refreshSoon(delay = 600) {
      clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => fetch().catch(() => {}), delay)
    }

    function find(itemId) {
      return items.value.find((i) => i.id === Number(itemId)) ?? null
    }

    async function create(payload) {
      const { data } = await api.post(endpoint, payload)
      items.value.push(data.data)
      sort()
      return data.data
    }

    async function update(itemId, payload) {
      const { data } = await api.put(`${endpoint}/${itemId}`, payload)
      const idx = items.value.findIndex((i) => i.id === itemId)
      if (idx !== -1) items.value[idx] = data.data
      sort()
      return data.data
    }

    async function remove(itemId) {
      await api.delete(`${endpoint}/${itemId}`)
      items.value = items.value.filter((i) => i.id !== itemId)
    }

    function reset() {
      items.value = []
      loaded.value = false
    }

    return { items, loaded, loading, fetch, refreshSoon, find, create, update, remove, reset }
  })
}

export const useCategoriesStore = defineCollectionStore('categories', '/categories')
export const useLabelsStore = defineCollectionStore('labels', '/labels')
