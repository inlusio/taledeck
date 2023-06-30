import { useXrInlineSessionStore } from '@/stores/XrInlineSession'
import { storeToRefs } from 'pinia'

export default function useXrInlineSessionController() {
  const xrInlineSessionStore = useXrInlineSessionStore()
  const { requestSession, endSession, initScene } = xrInlineSessionStore
  const { debugPosition, context, session, refSpace, hasActiveSession } = storeToRefs(xrInlineSessionStore)

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
