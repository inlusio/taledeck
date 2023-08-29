import useImmersiveScene from '@/composables/ImmersiveScene/ImmersiveScene'
import type { ReactiveDialog } from '@/models/Dialog/Dialog'
import { useImmersiveSessionStore } from '@/stores/ImmersiveSession'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { computed } from 'vue'

export default function useImmersiveSession(onRender: (width: number, height: number) => void, dialog: ReactiveDialog) {
  // TODO: Avoid using this component to only get information. This should only be requested once (like the attached store)
  const immersiveSessionStore = useImmersiveSessionStore()
  const { requestSession } = immersiveSessionStore
  const { context, session, refSpace, isPresenting } = storeToRefs(immersiveSessionStore)
  const { mount, unmount, clear, update } = useImmersiveScene(context, session, refSpace, onRender, dialog)

  const isSessionReady = computed<boolean>(() => {
    return [context, session, refSpace].every(({ value }: Ref<unknown>) => value != null)
  })

  const endSession = () => {
    if (session.value) {
      session.value.end()
    }

    unmount()
  }

  return {
    isPresenting,
    isSessionReady,
    requestSession,
    endSession,
    mount,
    unmount,
    clear,
    update,
  }
}
