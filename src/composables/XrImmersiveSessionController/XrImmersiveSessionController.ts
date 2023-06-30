import { useXrImmersiveSessionStore } from '@/stores/XrImmersiveSession'
import { storeToRefs } from 'pinia'

export default function useXrImmersiveSessionController() {
  const xrImmersiveSessionStore = useXrImmersiveSessionStore()
  const { requestSession, endSession, initScene } = xrImmersiveSessionStore
  const { debugPosition, context, session, refSpace, hasActiveSession } = storeToRefs(xrImmersiveSessionStore)

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
