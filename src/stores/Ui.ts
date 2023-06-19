import { defineStore } from 'pinia'
import { ref } from 'vue'
import { StoreId } from '@/models/Store'

export const useUiStore = defineStore(StoreId.Ui, () => {
  const interactionOccured = ref<boolean | undefined>(undefined)

  return { interactionOccured }
})
