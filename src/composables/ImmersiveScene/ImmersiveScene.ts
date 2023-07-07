import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
import useScene from '@/composables/Scene/Scene'
import type { SceneObjects } from '@/models/Scene/Scene'
import { PerspectiveCamera, Texture, WebGLRenderer } from 'three'
import type { Ref } from 'vue'
import { reactive } from 'vue'
import Reticulum from '@/util/Reticulum/Reticulum'

export default function useImmersiveScene(
  context: Ref<WebGL2RenderingContext | null>,
  session: Ref<XRSession | null>,
  refSpace: Ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>,
) {
  const { hotspots } = useDialogHotspot()
  const { createObjects, updateHotspots, updateSkyMaterial } = useScene()

  let obj: SceneObjects
  let renderer: WebGLRenderer | undefined
  let reticulum: Reticulum | undefined

  const debugPosition = reactive<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 })

  const onAnimationFrame = (_time: DOMHighResTimeStamp, frame: XRFrame) => {
    if (context.value == null || refSpace.value == null || frame == null) {
      return
    }

    const pose = frame.getViewerPose(refSpace.value)
    const session = frame.session
    const layer = session.renderState.baseLayer

    if (pose && layer) {
      const view = pose.views[0]

      context.value.bindFramebuffer(context.value.FRAMEBUFFER, layer.framebuffer)
      context.value.clear(context.value.COLOR_BUFFER_BIT | context.value.DEPTH_BUFFER_BIT)

      const { x, y, width, height } = layer.getViewport(view) as XRViewport
      context.value.viewport(x, y, width, height)

      renderScene()
    }
  }

  const renderScene = () => {
    if (renderer == null || context.value == null || session.value == null) {
      throw new Error('Scene could not be rendered!')
    }

    reticulum!.update()
    renderer.render(obj.scene, obj.camera)
  }

  const createRenderer = () => {
    if (context.value == null || session.value == null || refSpace.value == null) {
      throw new Error('Renderer could not be initialized!')
    }

    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      context: context.value,
      canvas: context.value.canvas,
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.autoClear = false
    renderer.xr.enabled = true
    renderer.xr.setReferenceSpace(refSpace.value)
    renderer.xr.setReferenceSpaceType('local')
    renderer.xr.setSession(session.value as XRSession)
    renderer.xr.setAnimationLoop(onAnimationFrame)

    renderer.xr.addEventListener('sessionStarted', () => {
      console.log('XR session started')
    })
  }

  const createReticulum = (camera: PerspectiveCamera) => {
    const reticleInnerRadius = 0.02 * 3
    const reticleOuterRadius = 0.024 * 3
    const reticleRingWidth = reticleOuterRadius - reticleInnerRadius
    const fuseInnerRadius = reticleOuterRadius + 4 * reticleRingWidth
    const fuseOuterRadius = fuseInnerRadius + 4 * reticleRingWidth

    reticulum = new Reticulum(camera, {
      proximity: true,
      reticle: {
        color: 0xcc0000,
        speed: 4,
        restPoint: 80,
        innerRadius: 0.0008,
        outerRadius: 0.006,
        hover: {
          innerRadius: reticleInnerRadius,
          outerRadius: reticleOuterRadius,
        },
      },
      fuse: {
        duration: 2,
        hideAfterEnd: false,
        innerRadius: fuseInnerRadius,
        outerRadius: fuseOuterRadius,
      },
    })
  }

  const createBaseLayer = async () => {
    if (context.value == null || session.value == null) {
      throw new Error('Renderer could not be initialized!')
    }

    const baseLayer = new XRWebGLLayer(session.value, context.value)
    await session.value.updateRenderState({ baseLayer })
  }

  const initScene = async (texture: Texture) => {
    obj = createObjects()
    createRenderer()
    createReticulum(obj.camera)
    await createBaseLayer()

    updateSkyMaterial(obj.sky, texture)
    await updateHotspots(obj.hotspots, hotspots.value, reticulum)
  }

  return { debugPosition, initScene }
}
