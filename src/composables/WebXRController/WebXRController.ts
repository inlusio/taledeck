import { useWebXRStore } from '@/stores/WebXR'
import { storeToRefs } from 'pinia'

export default function useWebXRController() {
  const webXRStore = useWebXRStore()
  const { hasXR, hasImmersiveAR } = storeToRefs(webXRStore)

  return { hasXR, hasImmersiveAR }
}
