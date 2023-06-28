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

  const session = ref<XRSession | null>(null)
  const refSpace = ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>(undefined)

  const context = computed<WebGL2RenderingContext | null>(() => {
    return session.value != null ? createWebGLContext({ xrCompatible: true }) : null
  })
  const hasActiveSession = computed<boolean>(() => {
    return [session, context, refSpace].every(({ value }: Ref<unknown>) => value != null)
  })

  watch(
    () => [session.value, context.value],
    async (nV) => {
      const [nSession, nContext] = nV as [XRSession | null, WebGL2RenderingContext | null]

      if (nSession == null || nContext == null) {
        return
      }

      console.info('XR Session initiated.')
      // console.info(`DOM Overlay type: "${session.value?.domOverlayState?.type}"`)

      refSpace.value = await session.value!.requestReferenceSpace('local')

      nSession.addEventListener('end', () => (session.value = null))
      await nSession.updateRenderState({ baseLayer: new XRWebGLLayer(nSession, nContext) })
    },
    { immediate: true },
  )

  const requestSession = async (overlayEl: HTMLDivElement) => {
    const options: XRSessionInit = {
      ...sessionOptions,
      domOverlay: { root: overlayEl },
    }

    try {
      session.value = (await api.value?.requestSession(sessionMode, options)) || null
    } catch (e) {
      console.error(`Failed to start XR session.`)
    }
  }

  const endSession = () => {
    if (session.value) {
      session.value.end()
    }
  }

  return { context, session, refSpace, hasActiveSession, requestSession, endSession }
})
