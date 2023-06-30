import { useXrSessionStore } from '@/stores/XrSession'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { computed } from 'vue'

export default function useXrSessionController() {
  const xrSessionStore = useXrSessionStore()
  const { requestSession, endSession, initScene } = xrSessionStore
  const { debugPosition, context, session, refSpace } = storeToRefs(xrSessionStore)

  const hasActiveSession = computed<boolean>(() => {
    return [session, context, refSpace].every(({ value }: Ref<unknown>) => value != null)
  })

  return {
    context,
    session,
    refSpace,
    hasActiveSession,
    debugPosition,
    requestSession,
    endSession,
    initScene,
  }
}
