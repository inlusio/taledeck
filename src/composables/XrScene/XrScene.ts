import type { PBRTextureMaps } from '@tresjs/core'
import {
  AmbientLight,
  BackSide,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from 'three'
import type { Ref } from 'vue'
import { reactive } from 'vue'

export default function useXrScene(
  isImmersive: boolean,
  context: Ref<WebGL2RenderingContext | null>,
  session: Ref<XRSession | null>,
  refSpace: Ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>,
) {
  const debugPosition = reactive<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 })

  let renderer: WebGLRenderer | undefined
  let scene: Scene | undefined
  let camera: PerspectiveCamera | undefined
  let light: AmbientLight | undefined
  let sky: Mesh | undefined

  const initScene = (texture: PBRTextureMaps) => {
    if (context.value == null || session.value == null) {
      throw new Error('Scene could not be initialized!')
    }

    scene = new Scene()

    light = new AmbientLight(0xffffff, 2)
    scene.add(light)

    sky = new Mesh(new SphereGeometry(1, 25, 25), new MeshStandardMaterial({ ...texture, side: BackSide }))
    scene.add(sky)

    camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10)
    camera.position.set(0, 0, 0)

    // Create and configure  three.js renderer with XR support
    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      context: context.value,
      canvas: context.value.canvas,
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.xr.enabled = true
    renderer.xr.setReferenceSpaceType(isImmersive ? 'local' : 'viewer')
    renderer.xr.setSession(session.value as XRSession)
    renderer.setAnimationLoop(onXRAnimationFrame)
  }

  const render = (s: Scene, c: PerspectiveCamera) => {
    if (renderer == null || context.value == null || session.value == null) {
      throw new Error('Scene could not be rendered!')
    }

    const framebuffer = session.value.renderState.baseLayer?.framebuffer as WebGLFramebuffer

    context.value.bindFramebuffer(context.value.FRAMEBUFFER, framebuffer)
    renderer.render(s, c)
  }

  const onXRAnimationFrame = (_time: DOMHighResTimeStamp, frame: XRFrame) => {
    if (refSpace.value == null || frame == null) {
      return
    }

    const viewerPose = frame.getViewerPose(refSpace.value)

    if (viewerPose) {
      debugPosition.x = viewerPose.transform.position.x
      debugPosition.y = viewerPose.transform.position.y
      debugPosition.z = viewerPose.transform.position.z
    }

    render(scene as Scene, camera as PerspectiveCamera)
  }

  return { debugPosition, initScene, render }
}

// DEBUGGING
// const torusGeometry = new TorusKnotGeometry(
//   ...Object.values({
//     radius: 0.6,
//     tube: 0.2,
//     tubularSegments: 150,
//     radialSegments: 20,
//     p: 2,
//     q: 3,
//     thickness: 0.5,
//   }),
// )
// const torusMaterial = new MeshPhysicalMaterial({
//   transmission: 1.0,
//   roughness: 0,
//   metalness: 0.25,
//   thickness: 0.5,
//   side: DoubleSide,
// })
// const torus = new Mesh(torusGeometry, torusMaterial)
// torus.name = 'torus'
// torus.position.y = 1.5
// torus.position.z = -2
// scene.add(torus)
