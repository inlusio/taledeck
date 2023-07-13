import useImmersiveScene from '@/composables/ImmersiveScene/ImmersiveScene'
import type { DialogHotspotLocation } from '@/models/DialogHotspot/DialogHotspot'
import { useXrApiStore } from '@/stores/XrApi'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { computed, ref, watch } from 'vue'

const sessionMode: XRSessionMode = 'immersive-vr'
const sessionOptions: XRSessionInit = {
  optionalFeatures: ['dom-overlay'],
  requiredFeatures: ['local'],
}

export default function useImmersiveSession(
  onRender = (_width: number, _height: number, _coords: Array<DialogHotspotLocation>) => {},
) {
  const xrApiStore = useXrApiStore()
  const { createWebGLContext } = xrApiStore
  const { api } = storeToRefs(xrApiStore)

  const context = ref<WebGL2RenderingContext | null>(null)
  const session = ref<XRSession | null>(null)
  const refSpace = ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>(undefined)
  const removeResizeObserver = ref<(() => void) | null>(null)

  const { renderer, mountScene, unmountScene } = useImmersiveScene(context, session, refSpace, onRender)

  const isPresenting = ref<boolean>(false)
  const isSessionReady = computed<boolean>(() => {
    return [context, session, refSpace].every(({ value }: Ref<unknown>) => value != null)
  })

  const requestSession = async (overlayEl: HTMLDivElement | null) => {
    if (overlayEl == null) {
      throw new Error('XR Session could not be initiated (DOM elements not found).')
    }

    const options: XRSessionInit = { ...sessionOptions, domOverlay: { root: overlayEl } }

    context.value = createWebGLContext(undefined, undefined, { xrCompatible: true })
    session.value = (await api.value?.requestSession(sessionMode, options)) || null
    refSpace.value = await session.value!.requestReferenceSpace('local')

    console.log(session.value!.domOverlayState)
  }

  const endSession = () => {
    if (session.value) {
      session.value.end()
    }

    unmountScene()
  }

  const onSessionStarted = () => {
    renderer.value!.xr.removeEventListener('sessionstart', onSessionStarted)
    isPresenting.value = true
  }

  const onSessionEnded = () => {
    renderer.value!.xr.removeEventListener('sessionend', onSessionStarted)
    isPresenting.value = false

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

  return {
    isPresenting,
    isSessionReady,
    requestSession,
    endSession,
    mountScene,
    unmountScene,
  }
}
