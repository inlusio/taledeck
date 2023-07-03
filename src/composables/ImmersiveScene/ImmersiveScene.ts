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
import { reactive } from 'vue'

export default function useImmersiveScene(
  context: Ref<WebGL2RenderingContext | null>,
  session: Ref<XRSession | null>,
  refSpace: Ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>,
) {
  const debugPosition = reactive<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 })

  const scene = new Scene()
  const camera = new PerspectiveCamera(80, undefined, 0.1, 10)

  const light = new AmbientLight(0xffffff, 2)
  const sky = new Mesh(new SphereGeometry(1, 25, 25))
  let renderer: WebGLRenderer | undefined

  const initScene = async (texture: Texture) => {
    if (context.value == null || session.value == null || refSpace.value == null) {
      throw new Error('Scene could not be initialized!')
    }

    sky.material = new MeshStandardMaterial({ map: texture, side: BackSide })

    scene.add(light)
    scene.add(sky)

    // Create and configure  three.js renderer with XR support
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

    const baseLayer = new XRWebGLLayer(session.value, context.value)
    await session.value.updateRenderState({ baseLayer })

    renderer.xr.addEventListener('sessionStarted', () => {
      console.log('XR session started')
    })
  }

  const renderScene = (s: Scene, c: PerspectiveCamera) => {
    if (renderer == null || context.value == null || session.value == null) {
      throw new Error('Scene could not be rendered!')
    }

    renderer.render(s, c)
  }

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

      renderScene(scene, camera)
    }
  }

  return { debugPosition, camera, renderer, initScene }
}
