import useXrSessionController from '@/composables/XrSessionController/XrSessionController'
import { StoreId } from '@/models/Store'
import { useXrApiStore } from '@/stores/XrApi'
import { defineStore, storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { computed, ref, watch } from 'vue'

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

  const requestSession = async (canvasEl: HTMLCanvasElement) => {
    if (canvasEl == null) {
      throw new Error('XR Session could not be initiated (DOM elements not found).')
    }

    context.value = createWebGLContext(canvasEl, { xrCompatible: true })
    session.value = (await api.value?.requestSession(sessionMode, sessionOptions)) || null
    refSpace.value = await session.value!.requestReferenceSpace('viewer')

    session.value!.addEventListener('end', onSessionEnded)
    addResizeObserver()
  }

  return { context, session, refSpace, hasActiveSession, requestSession, endSession }
})
