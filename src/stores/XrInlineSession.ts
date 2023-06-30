import useXrInlineViewerHelper from '@/composables/XrInlineViewerHelper/XrInlineViewerHelper'
import useXrScene from '@/composables/XrScene/XrScene'
import useXrSessionController from '@/composables/XrSessionController/XrSessionController'
import { StoreId } from '@/models/Store'
import { useXrApiStore } from '@/stores/XrApi'
import { defineStore, storeToRefs } from 'pinia'
import { ref, watch } from 'vue'

const sessionMode: XRSessionMode = 'inline'
const sessionOptions: XRSessionInit = {
  optionalFeatures: [],
  requiredFeatures: ['viewer'],
}

export const useXrInlineSessionStore = defineStore(StoreId.XrInlineSession, () => {
  const xrApiStore = useXrApiStore()
  const { createWebGLContext } = xrApiStore
  const { api } = storeToRefs(xrApiStore)

  const context = ref<WebGL2RenderingContext | null>(null)
  const session = ref<XRSession | null>(null)
  const refSpace = ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>(undefined)

  const { refSpace: rotatedRefSpace } = useXrInlineViewerHelper(context, refSpace)
  const { camera, debugPosition, initScene } = useXrScene(false, context, session, refSpace)
  const { hasActiveSession, addResizeObserver, endSession, onSessionEnded } = useXrSessionController(
    context,
    session,
    refSpace,
    camera,
  )

  const requestSession = async (targetEl: HTMLDivElement) => {
    if (targetEl == null) {
      throw new Error('XR Session could not be initiated (DOM elements not found).')
    }

    try {
      context.value = createWebGLContext(targetEl, undefined, { xrCompatible: true })
      session.value = (await api.value?.requestSession(sessionMode, sessionOptions)) || null
      refSpace.value = await session.value!.requestReferenceSpace('viewer')

      session.value!.addEventListener('end', onSessionEnded)
      addResizeObserver()
    } catch (e) {
      console.error(e)
    }
  }

  watch(
    () => rotatedRefSpace.value,
    () => {
      if (rotatedRefSpace.value != null) {
        refSpace.value = rotatedRefSpace.value
      }
    },
    { immediate: true },
  )

  return {
    context,
    session,
    refSpace,
    hasActiveSession,
    requestSession,
    endSession,
    debugPosition,
    initScene,
  }
})
