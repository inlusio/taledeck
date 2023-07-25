import useImmersiveScene from '@/composables/ImmersiveScene/ImmersiveScene'
import type { DialogHotspotLocation } from '@/models/DialogHotspot/DialogHotspot'
import { useImmersiveSessionStore } from '@/stores/ImmersiveSession'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { computed } from 'vue'

export default function useImmersiveSession(
  onRender = (_width: number, _height: number, _coords: Array<DialogHotspotLocation>) => {},
) {
  const immersiveSessionStore = useImmersiveSessionStore()
  const { requestSession } = immersiveSessionStore
  const { context, session, refSpace, isPresenting } = storeToRefs(immersiveSessionStore)
  const { mount, unmount, clear, update } = useImmersiveScene(context, session, refSpace, onRender)

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
