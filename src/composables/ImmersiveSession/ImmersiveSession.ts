import useImmersiveScene from '@/composables/ImmersiveScene/ImmersiveScene'
import type { ReactiveDialog } from '@/models/Dialog/Dialog'
import { useImmersiveSessionStore } from '@/stores/ImmersiveSession'
import { storeToRefs } from 'pinia'
import { Texture } from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import type { Ref } from 'vue'
import { computed } from 'vue'

export default function useImmersiveSession(
  onRender: (width: number, height: number) => void,
  dialog: ReactiveDialog,
  texture: Ref<Texture | null>,
  model: Ref<GLTF | null>,
) {
  // TODO: Avoid using this component to only get information. This should only be requested once (like the attached store)
  const immersiveSessionStore = useImmersiveSessionStore()
  const { requestSession } = immersiveSessionStore
  const { context, session, refSpace, isPresenting } = storeToRefs(immersiveSessionStore)

  const { mount, unmount, isMounted } = useImmersiveScene(context, session, refSpace, onRender, dialog, texture, model)

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
    isMounted,
    requestSession,
    endSession,
    mount,
    unmount,
  }
}
