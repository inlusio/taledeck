import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
import useScene from '@/composables/Scene/Scene'
import type { DialogHotspotLocation } from '@/models/DialogHotspot/DialogHotspot'
import type { SceneObjects } from '@/models/Scene/Scene'
import Reticulum from '@/util/Reticulum/Reticulum'
import { Frustum, Matrix4, Texture, WebGLRenderer } from 'three'
import type { Ref } from 'vue'
import { ref } from 'vue'

const renderer = ref<WebGLRenderer | null>(null)
const viewFrustum = new Frustum()
const viewProjectionMatrix = new Matrix4()

export default function useImmersiveScene(
  context: Ref<WebGL2RenderingContext | null>,
  session: Ref<XRSession | null>,
  refSpace: Ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>,
  onRender = (_width: number, _height: number, _coords: Array<DialogHotspotLocation>) => {},
) {
  let obj: SceneObjects
  let reticulum: Reticulum | undefined

  const { hotspots } = useDialogHotspot()
  const { getHotspotCoords, createObjects, createReticulum, updateHotspots, updateSkyMaterial } = useScene(
    true,
    renderer,
  )

  const onAnimationFrame = (_time: DOMHighResTimeStamp, frame: XRFrame) => {
    if (renderer.value == null || context.value == null || refSpace.value == null || frame == null) {
      throw new Error('Scene could not be rendered!')
    }

    const session = frame.session
    const pose = frame.getViewerPose(refSpace.value)
    const layer = session.renderState.baseLayer

    if (pose) {
      const view = pose.views[0]
      updateFrustum(view.projectionMatrix)

      if (layer) {
        context.value.bindFramebuffer(context.value.FRAMEBUFFER, layer.framebuffer)
        context.value.clear(context.value.COLOR_BUFFER_BIT | context.value.DEPTH_BUFFER_BIT)

        const { x, y, width, height } = layer.getViewport(view) as XRViewport
        context.value.viewport(x, y, width, height)
      }

      renderScene()
    }
  }

  const renderScene = () => {
    if (renderer.value == null || context.value == null || session.value == null) {
      throw new Error('Scene could not be rendered!')
    }

    reticulum!.update()
    renderer.value.render(obj.scene, obj.camera)

    onRender(
      renderer.value.domElement.clientWidth,
      renderer.value.domElement.clientHeight,
      getHotspotCoords(renderer.value.domElement, obj.camera, obj.hotspots, viewFrustum),
    )
  }

  const createRenderer = () => {
    if (context.value == null || session.value == null || refSpace.value == null) {
      throw new Error('Renderer could not be initialized!')
    }

    renderer.value = new WebGLRenderer({
      antialias: true,
      alpha: true,
      context: context.value,
      canvas: context.value.canvas,
    })
    renderer.value.setPixelRatio(window.devicePixelRatio)
    renderer.value.autoClear = false
    renderer.value.xr.enabled = true
    renderer.value.xr.setReferenceSpace(refSpace.value)
    renderer.value.xr.setReferenceSpaceType('local')
    renderer.value.xr.setSession(session.value as XRSession)
    renderer.value.xr.setAnimationLoop(onAnimationFrame)

    renderer.value.xr.addEventListener('sessionStarted', () => {
      console.log('XR session started')
    })
  }

  const createBaseLayer = async () => {
    if (context.value == null || session.value == null) {
      throw new Error('Renderer could not be initialized!')
    }

    const baseLayer = new XRWebGLLayer(session.value, context.value)
    await session.value.updateRenderState({ baseLayer })
  }

  const updateFrustum = (projectionMatrix: Float32Array) => {
    if (projectionMatrix != null) {
      viewProjectionMatrix.fromArray(projectionMatrix)
      viewFrustum.setFromProjectionMatrix(viewProjectionMatrix)
    }
  }

  const mountScene = async (texture: Texture) => {
    obj = createObjects()
    createRenderer()
    reticulum = createReticulum(obj.camera)
    await createBaseLayer()

    updateSkyMaterial(obj.sky, texture)
    await updateHotspots(obj.hotspots, hotspots.value, reticulum)
  }

  const unmountScene = () => {
    reticulum?.destroy()
  }

  return { renderer, mountScene, unmountScene }
}
