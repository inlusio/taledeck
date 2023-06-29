import { useXrSessionStore } from '@/stores/XrSession'
import { useResizeObserver } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'

export default function useXrSessionController(
  context: Ref<WebGL2RenderingContext | null>,
  session: Ref<XRSession | null>,
  refSpace: Ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>,
) {
  const xrSessionStore = useXrSessionStore()
  const { removeResizeObserver } = storeToRefs(xrSessionStore)

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
      })
      removeResizeObserver.value = stop
    }
  }

  return {
    removeResizeObserver,
    addResizeObserver,
    endSession,
    onSessionEnded,
  }
}
