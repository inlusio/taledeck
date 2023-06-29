import { useXrInlineSessionStore } from '@/stores/XrInlineSession'
import { storeToRefs } from 'pinia'

export default function useXrInlineSessionController() {
  const xrInlineSessionStore = useXrInlineSessionStore()
  const { requestSession, endSession } = xrInlineSessionStore
  const { context, session, refSpace, hasActiveSession } = storeToRefs(xrInlineSessionStore)

  return {
    context,
    session,
    refSpace,
    hasActiveSession,
    requestSession,
    endSession,
  }
}
