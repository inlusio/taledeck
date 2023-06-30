import useXrScene from '@/composables/XrScene/XrScene'
import useXrSessionController from '@/composables/XrSessionController/XrSessionController'
import { StoreId } from '@/models/Store'
import { useXrApiStore } from '@/stores/XrApi'
import { defineStore, storeToRefs } from 'pinia'
import { ref } from 'vue'

const sessionMode: XRSessionMode = 'immersive-vr'
const sessionOptions: XRSessionInit = {
  optionalFeatures: ['dom-overlay'],
  requiredFeatures: ['local'],
}

export const useXrImmersiveSessionStore = defineStore(StoreId.XrImmersiveSession, () => {
  const xrApiStore = useXrApiStore()
  const { createWebGLContext } = xrApiStore
  const { api } = storeToRefs(xrApiStore)

  const context = ref<WebGL2RenderingContext | null>(null)
  const session = ref<XRSession | null>(null)
  const refSpace = ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>(undefined)

  const { camera, debugPosition, initScene } = useXrScene(true, context, session, refSpace)
  const { hasActiveSession, addResizeObserver, endSession, onSessionEnded } = useXrSessionController(
    context,
    session,
    refSpace,
    camera,
  )

  const requestSession = async (overlayEl: HTMLDivElement | null) => {
    if (overlayEl == null) {
      throw new Error('XR Session could not be initiated (DOM elements not found).')
    }

    const options: XRSessionInit = { ...sessionOptions, domOverlay: { root: overlayEl } }

    context.value = createWebGLContext(undefined, undefined, { xrCompatible: true })
    session.value = (await api.value?.requestSession(sessionMode, options)) || null
    refSpace.value = await session.value!.requestReferenceSpace('local')

    session.value!.addEventListener('end', onSessionEnded)
    addResizeObserver()
  }

  return {
    debugPosition,
    context,
    session,
    refSpace,
    hasActiveSession,
    requestSession,
    endSession,
    initScene,
  }
})
