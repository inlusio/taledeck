import { storeToRefs } from 'pinia'
import { useXrApiStore } from '@/stores/XrApi'

export default function useXrApiController() {
  const xrApiStore = useXrApiStore()
  const { api, hasXr, hasImmersiveXr } = storeToRefs(xrApiStore)

  return {
    api,
    hasXr,
    hasImmersiveXr,
  }
}
