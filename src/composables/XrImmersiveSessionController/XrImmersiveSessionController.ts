import { useXrImmersiveSessionStore } from '@/stores/XrImmersiveSession'
import { storeToRefs } from 'pinia'

export default function useXrImmersiveSessionController() {
  const xrImmersiveSessionStore = useXrImmersiveSessionStore()
  const { requestSession, endSession } = xrImmersiveSessionStore
  const { context, session, refSpace, hasActiveSession } = storeToRefs(xrImmersiveSessionStore)

  return {
    context,
    session,
    refSpace,
    hasActiveSession,
    requestSession,
    endSession,
  }
}
