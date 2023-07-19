import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
import useScene from '@/composables/Scene/Scene'
import type { DialogHotspotLocation } from '@/models/DialogHotspot/DialogHotspot'
import type { SceneObjects } from '@/models/Scene/Scene'
import { NUM_CONTROLLERS } from '@/models/Scene/Scene'
import { referenceSpaceType } from '@/models/Session/Session'
import type { TaleDeckScene } from '@/models/TaleDeck/TaleDeck'
import Reticulum from '@/util/Reticulum/Reticulum'
import { Frustum, Matrix4, Texture, Vector3, WebGLRenderer, XRTargetRaySpace } from 'three'
//@ts-ignore
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory'
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
  let controllers: Array<XRTargetRaySpace> = []

  const { hotspots } = useDialogHotspot()
  const { getHotspotCoords, createObjects, createReticulum, updateHotspots, updateCamera, updateSkyMaterial } =
    useScene(true, renderer)

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

      // console.log(renderer.value!.xr.getCamera().position.y)

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

    const result = new WebGLRenderer({
      antialias: true,
      alpha: true,
      context: context.value,
      canvas: context.value.canvas,
    })
    result.setPixelRatio(window.devicePixelRatio)
    result.autoClear = false
    result.xr.enabled = true
    result.xr.setReferenceSpace(refSpace.value!)
    result.xr.setReferenceSpaceType(referenceSpaceType)
    result.xr.setSession(session.value as XRSession)
    result.xr.setAnimationLoop(onAnimationFrame)

    result.xr.addEventListener('sessionStarted', () => {
      console.log('XR session started')
    })

    return result
  }

  const createBaseLayer = async () => {
    if (context.value == null || session.value == null) {
      throw new Error('Renderer could not be initialized!')
    }

    const baseLayer = new XRWebGLLayer(session.value, context.value)
    await session.value.updateRenderState({ baseLayer })
  }

  const createControllers = (r: WebGLRenderer) => {
    const result = []

    for (let i = 0; i < NUM_CONTROLLERS; i++) {
      const controller = r.xr.getController(i)
      obj.scene.add(controller)
      result.push(controller)

      const controllerModelFactory = new XRControllerModelFactory()
      const grip = r.xr.getControllerGrip(i)
      grip.add(controllerModelFactory.createControllerModel(grip))
      obj.scene.add(grip)
    }

    return result
  }

  const updateFrustum = (projectionMatrix: Float32Array) => {
    if (projectionMatrix != null) {
      viewProjectionMatrix.fromArray(projectionMatrix)
      viewFrustum.setFromProjectionMatrix(viewProjectionMatrix)
    }
  }

  const mountScene = async (scene: TaleDeckScene, texture: Texture) => {
    renderer.value = createRenderer()
    await createBaseLayer()

    obj = createObjects()
    controllers = createControllers(renderer.value)
    reticulum = createReticulum(obj.camera, controllers)

    updateCamera(obj.viewer, new Vector3(scene.look_at_x, scene.look_at_y, scene.look_at_z))
    updateSkyMaterial(obj.sky, texture)
    await updateHotspots(obj.hotspots, hotspots.value, reticulum)
  }

  const unmountScene = () => {
    reticulum?.destroy()
  }

  return { renderer, mountScene, unmountScene }
}
