import useXrSessionController from '@/composables/XrSessionController/XrSessionController'
import { StoreId } from '@/models/Store'
import { useXrApiStore } from '@/stores/XrApi'
import { defineStore, storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { computed, ref, watch } from 'vue'

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

  const { addResizeObserver, endSession, onSessionEnded } = useXrSessionController(context, session, refSpace)

  const hasActiveSession = computed<boolean>(() => {
    return [session, context, refSpace].every(({ value }: Ref<unknown>) => value != null)
  })

  watch(
    () => [session.value, context.value],
    async (nValue) => {
      const [nSession, nContext] = nValue as [XRSession | null, WebGL2RenderingContext | null]

      if (nSession != null && nContext != null) {
        await nSession.updateRenderState({ baseLayer: new XRWebGLLayer(nSession, nContext) })
      }
    },
    { immediate: true },
  )

  const requestSession = async (canvasEl: HTMLCanvasElement | undefined, overlayEl: HTMLDivElement | null) => {
    if (overlayEl == null) {
      throw new Error('XR Session could not be initiated (DOM elements not found).')
    }

    const options: XRSessionInit = { ...sessionOptions, domOverlay: { root: overlayEl } }

    context.value = createWebGLContext(canvasEl, { xrCompatible: true })
    session.value = (await api.value?.requestSession(sessionMode, options)) || null
    refSpace.value = await session.value!.requestReferenceSpace('local')

    session.value!.addEventListener('end', onSessionEnded)
    addResizeObserver()
  }

  return { context, session, refSpace, hasActiveSession, requestSession, endSession }
})
