import { defineStore } from 'pinia'
import type { Ref } from 'vue'
import { ref } from 'vue'
import { StoreId } from '@/models/Store'

export const useWebXRStore = defineStore(StoreId.WebXR, () => {
  const hasXR = ref<boolean | undefined>(undefined)
  const hasImmersiveAR = ref<boolean | undefined>(undefined)

  const xrSession = ref<XRSession | undefined>(undefined)

  const requestSession = async (overlayEl: Ref<HTMLDivElement>) => {
    if (!hasXR.value || !hasImmersiveAR.value) {
      return
    }

    if (!xrSession.value) {
      try {
        xrSession.value = await navigator.xr!.requestSession('immersive-ar', {
          optionalFeatures: ['dom-overlay'],
          requiredFeatures: ['local', 'hit-test'],
          domOverlay: { root: overlayEl.value },
        })

        // onSessionStarted
      } catch (e) {
        console.error(e)
        // onRequestSessionError
      }
    } else {
      xrSession.value.end()
    }
  }

  // watch xrSession:
  // undef > value --> onSessionStarted

  const checkXR = async () => {
    if (!window.isSecureContext) {
      hasXR.value = false
      console.warn('WebXR unavailable. Please use secure context')
    }

    if (navigator.xr) {
      navigator.xr.addEventListener('devicechange', checkImmersiveAR)
      await checkImmersiveAR()
    } else {
      hasXR.value = false
      console.warn('WebXR unavailable for this browser')
    }
  }

  const checkImmersiveAR = async () => {
    if (!navigator.xr) {
      return
    }

    hasImmersiveAR.value = await navigator.xr.isSessionSupported('immersive-ar')
  }

  checkXR()

  return { hasXR, hasImmersiveAR, requestSession }
})
