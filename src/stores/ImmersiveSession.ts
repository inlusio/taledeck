import { referenceSpaceType, sessionMode, sessionOptions } from '@/models/Session/Session'
import { StoreId } from '@/models/Store'
import { useXrApiStore } from '@/stores/XrApi'
import { defineStore, storeToRefs } from 'pinia'
import { WebGLRenderer } from 'three'
import { ref, watch } from 'vue'

export const useImmersiveSessionStore = defineStore(StoreId.ImmersiveSession, () => {
  const xrApiStore = useXrApiStore()
  const { createWebGLContext } = xrApiStore
  const { api } = storeToRefs(xrApiStore)

  const isPresenting = ref<boolean>(false)
  const renderer = ref<WebGLRenderer | null>(null)
  const context = ref<WebGL2RenderingContext | null>(null)
  const session = ref<XRSession | null>(null)
  const refSpace = ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>(undefined)

  const removeResizeObserver = ref<(() => void) | null>(null)

  const requestSession = async () => {
    context.value = createWebGLContext(undefined, undefined, { xrCompatible: true })
    session.value = (await api.value?.requestSession(sessionMode, sessionOptions)) || null
    refSpace.value = await session.value!.requestReferenceSpace(referenceSpaceType)
  }

  const onSessionStarted = () => {
    isPresenting.value = true
    renderer.value!.xr.removeEventListener('sessionstart', onSessionStarted)
  }

  const onSessionEnded = () => {
    isPresenting.value = false
    renderer.value!.xr.removeEventListener('sessionend', onSessionStarted)

    if (removeResizeObserver.value) {
      removeResizeObserver.value()
    }

    context.value = null
    session.value = null
    refSpace.value = undefined
  }

  watch(
    () => renderer.value,
    (nV) => {
      if (nV) {
        nV.xr.addEventListener('sessionstart', onSessionStarted)
        nV.xr.addEventListener('sessionend', onSessionEnded)
      }
    },
    { immediate: true },
  )

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

  return { renderer, context, session, refSpace, isPresenting, requestSession }
})
