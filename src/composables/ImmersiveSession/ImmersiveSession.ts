import useImmersiveScene from '@/composables/ImmersiveScene/ImmersiveScene'
import { useImmersiveSessionStore } from '@/stores/ImmersiveSession'
import { storeToRefs } from 'pinia'
import type { ComputedRef, Ref } from 'vue'
import { computed } from 'vue' //@ts-ignore
import type YarnBound from 'yarn-bound/src'

export default function useImmersiveSession(
  onRender: (width: number, height: number) => void,
  runner: ComputedRef<YarnBound>,
) {
  // TODO: Avoid using this component to only get information. This should only be requested once (like the attached store)
  const immersiveSessionStore = useImmersiveSessionStore()
  const { requestSession } = immersiveSessionStore
  const { context, session, refSpace, isPresenting } = storeToRefs(immersiveSessionStore)
  const { mount, unmount, clear, update } = useImmersiveScene(context, session, refSpace, onRender, runner)

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
