import { StoreId } from '@/models/Store'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useXrSessionStore = defineStore(StoreId.XrSession, () => {
  const removeResizeObserver = ref<(() => void) | null>(null)

  return { removeResizeObserver }
})
