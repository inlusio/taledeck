import { useUiStore } from '@/stores/Ui'
import { storeToRefs } from 'pinia'

export default function useUiController() {
  const uiStore = useUiStore()
  const { interactionOccured } = storeToRefs(uiStore)

  return { interactionOccured }
}
