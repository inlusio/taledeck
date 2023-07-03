import useImmersiveScene from '@/composables/ImmersiveScene/ImmersiveScene'
import { StoreId } from '@/models/Store'
import { useXrApiStore } from '@/stores/XrApi'
import { useResizeObserver } from '@vueuse/core'
import { defineStore, storeToRefs } from 'pinia'
import { ref, watch } from 'vue'

const sessionMode: XRSessionMode = 'immersive-vr'
const sessionOptions: XRSessionInit = {
  optionalFeatures: ['dom-overlay'],
  requiredFeatures: ['local'],
}

export const useXrSessionStore = defineStore(StoreId.XrSession, () => {
  const xrApiStore = useXrApiStore()
  const { createWebGLContext } = xrApiStore
  const { api } = storeToRefs(xrApiStore)

  const context = ref<WebGL2RenderingContext | null>(null)
  const session = ref<XRSession | null>(null)
  const refSpace = ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>(undefined)
  const removeResizeObserver = ref<(() => void) | null>(null)

  const { camera, debugPosition, initScene } = useImmersiveScene(context, session, refSpace)

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

  const addResizeObserver = () => {
    if (context.value != null) {
      const { stop } = useResizeObserver(context.value!.canvas as HTMLCanvasElement, ([entry]) => {
        const { width, height } = entry.contentRect

        context.value!.canvas.width = width * window.devicePixelRatio
        context.value!.canvas.height = height * window.devicePixelRatio
        camera.aspect = width / height

        camera.updateProjectionMatrix()
      })

      removeResizeObserver.value = stop
    }
  }

  const endSession = () => {
    if (session.value) {
      session.value.end()
    }
  }

  const onSessionEnded = () => {
    if (removeResizeObserver.value) {
      removeResizeObserver.value()
    }

    context.value = null
    session.value = null
    refSpace.value = undefined
  }

  watch(
    () => [session.value, context.value],
    async (nValue) => {
      const [nSession, nContext] = nValue as [XRSession | null, WebGL2RenderingContext | null]

      if (nSession != null && nContext != null) {
        const baseLayer = new XRWebGLLayer(nSession, nContext)
        await nSession.updateRenderState({ baseLayer })
      }
    },
    { immediate: true },
  )

  return {
    debugPosition,
    context,
    session,
    refSpace,
    requestSession,
    endSession,
    initScene,
  }
})
