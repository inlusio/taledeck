import { useXrSessionStore } from '@/stores/XrSession'
import { useResizeObserver } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import type { PerspectiveCamera } from 'three'
import { computed, watch } from 'vue'
import type { Ref } from 'vue'

export default function useXrSessionController(
  context: Ref<WebGL2RenderingContext | null>,
  session: Ref<XRSession | null>,
  refSpace: Ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>,
  camera: PerspectiveCamera,
) {
  const xrSessionStore = useXrSessionStore()
  const { removeResizeObserver } = storeToRefs(xrSessionStore)

  const hasActiveSession = computed<boolean>(() => {
    return [session, context, refSpace].every(({ value }: Ref<unknown>) => value != null)
  })

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
    hasActiveSession,
    removeResizeObserver,
    addResizeObserver,
    endSession,
    onSessionEnded,
  }
}
