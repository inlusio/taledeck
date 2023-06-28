import { StoreId } from '@/models/Store'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export const useXrApiStore = defineStore(StoreId.XrApi, () => {
  const api = ref<XRSystem | undefined>(undefined)

  const hasImmersiveAr = ref<boolean | undefined>(undefined)
  const hasImmersiveVr = ref<boolean | undefined>(undefined)

  const hasXr = computed<boolean>(() => api.value != null)
  const hasImmersiveXr = computed<boolean>(() => !!hasImmersiveAr.value || !!hasImmersiveVr.value)

  watch(
    () => api.value,
    async () => {
      if (api.value == null) {
        return
      }

      console.info('XR API initiated.')

      api.value.addEventListener('devicechange', onDeviceChanged)
      await onDeviceChanged()
    },
    { immediate: true },
  )

  const onDeviceChanged = async () => {
    hasImmersiveAr.value = await api.value?.isSessionSupported('immersive-ar')
    hasImmersiveVr.value = await api.value?.isSessionSupported('immersive-vr')
  }

  const createWebGLContext = (glAttribs: WebGLContextAttributes = {}): WebGL2RenderingContext => {
    glAttribs = glAttribs || { alpha: false }

    const webglCanvas = document.createElement('canvas')
    const result = webglCanvas.getContext('webgl2', glAttribs)

    if (!result) {
      throw new Error(`This browser does not support WebGL 2.`)
    }

    return result
  }

  const init = () => {
    if (!window.isSecureContext) {
      console.warn('XR unavailable. Please use secure context.')
      return
    }

    if (navigator.xr) {
      api.value = navigator.xr
    } else {
      console.warn('XR unavailable for this browser.')
    }
  }

  init()

  return { api, hasXr, hasImmersiveXr, createWebGLContext }
})
