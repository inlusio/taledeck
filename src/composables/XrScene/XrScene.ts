import {
  AmbientLight,
  BackSide,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Texture,
  WebGLRenderer,
} from 'three'
import type { Ref } from 'vue'
import { reactive, toRaw } from 'vue'

const debugPosition = reactive<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 })

const scene = new Scene()
const camera = new PerspectiveCamera(80, undefined, 0.1, 10)

let light: AmbientLight | undefined
let sky: Mesh | undefined
let renderer: WebGLRenderer | undefined

export default function useXrScene(
  isImmersive: boolean,
  context: Ref<WebGL2RenderingContext | null>,
  session: Ref<XRSession | null>,
  refSpace: Ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>,
) {
  const initScene = async (texture: Texture) => {
    if (context.value == null || session.value == null || refSpace.value == null) {
      throw new Error('Scene could not be initialized!')
    }

    light = new AmbientLight(0xffffff, 2)
    scene.add(light)

    sky = new Mesh(new SphereGeometry(1, 25, 25), new MeshStandardMaterial({ map: texture, side: BackSide }))
    scene.add(sky)

    // Create and configure  three.js renderer with XR support
    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      context: context.value,
      canvas: context.value.canvas,
    })
    renderer.autoClear = false
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.xr.enabled = true
    renderer.xr.setReferenceSpace(refSpace.value)
    renderer.xr.setReferenceSpaceType(isImmersive ? 'local' : 'viewer')
    renderer.xr.setSession(toRaw(session.value) as XRSession)
    renderer.xr.setAnimationLoop(onXRAnimationFrame)

    const baseLayer = new XRWebGLLayer(session.value, context.value)
    await session.value.updateRenderState({ baseLayer })

    renderer.xr.addEventListener('sessionStarted', () => {
      console.log('asdfasdfasdf')
    })
  }

  const renderScene = (s: Scene, c: PerspectiveCamera) => {
    if (renderer == null || context.value == null || session.value == null) {
      throw new Error('Scene could not be rendered!')
    }

    if (!isImmersive) {
      // renderer.xr.updateCamera(camera)
    }

    renderer.render(s, c)
  }

  const onXRAnimationFrame = (_time: DOMHighResTimeStamp, frame: XRFrame) => {
    if (context.value == null || refSpace.value == null || frame == null) {
      return
    }

    // const fSession = frame.session
    // const fLayer = fSession.renderState.baseLayer
    const pose = frame.getViewerPose(refSpace.value)
    const session = frame.session
    const layer = session.renderState.baseLayer

    if (pose && layer) {
      const view = pose.views[0]

      // debugPosition.x = viewerPose.transform.position.x
      // debugPosition.y = viewerPose.transform.position.y
      // debugPosition.z = viewerPose.transform.position.z

      context.value.bindFramebuffer(context.value.FRAMEBUFFER, layer.framebuffer)
      context.value.clear(context.value.COLOR_BUFFER_BIT | context.value.DEPTH_BUFFER_BIT)

      const { x, y, width, height } = layer.getViewport(view) as XRViewport
      context.value.viewport(x, y, width, height)

      // scene.draw(view.projectionMatrix, view.transform)

      if (!isImmersive) {
        camera.matrix.fromArray(view.transform.matrix)
        camera.projectionMatrix.fromArray(view.projectionMatrix)
        camera.updateMatrixWorld(true)

        debugPosition.x = camera.rotation.x
        debugPosition.y = camera.rotation.y
        debugPosition.z = camera.rotation.z
      }

      renderScene(scene, camera)
    }
  }

  return { camera, renderer, debugPosition, initScene }
}
