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
import { reactive, ref, toRaw, watch } from 'vue'

export default function useXrScene(
  isImmersive: boolean,
  context: Ref<WebGL2RenderingContext | null>,
  session: Ref<XRSession | null>,
  refSpace: Ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>,
) {
  const debugPosition = reactive<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 })

  const renderer = ref<WebGLRenderer | undefined>(undefined)
  const scene = ref<Scene | undefined>(undefined)
  const camera = ref<PerspectiveCamera | undefined>(undefined)
  const light = ref<AmbientLight | undefined>(undefined)
  const sky = ref<Mesh | undefined>(undefined)

  const initScene = (canvasEl: HTMLCanvasElement, texture: PBRTextureMaps) => {
    if (!context.value || !session.value) {
      throw new Error('Scene could not be initialized!')
    }

    scene.value = new Scene()
    camera.value = new PerspectiveCamera(45, undefined, 0.1, 1000)
    light.value = new AmbientLight(0xffffff, 2)
    sky.value = new Mesh(new SphereGeometry(100, 25, 25), new MeshStandardMaterial({ ...texture, side: BackSide }))

    // create and configure three.js renderer with XR support
    renderer.value = new WebGLRenderer({
      antialias: true,
      alpha: true,
      context: context.value,
      canvas: toRaw(canvasEl),
    })
    renderer.value.setPixelRatio(window.devicePixelRatio)
    renderer.value.setSize(window.innerWidth, window.innerHeight)
    renderer.value.xr.enabled = true
    renderer.value.xr.setReferenceSpaceType(isImmersive ? 'local' : 'viewer')
    renderer.value.xr.setSession(session.value as XRSession)
  }

  const render = () => {
    if (renderer.value == null || context.value == null || session.value == null) {
      throw new Error('Scene could not be rendered!')
    }

    const framebuffer = session.value.renderState.baseLayer?.framebuffer as WebGLFramebuffer

    context.value.bindFramebuffer(context.value.FRAMEBUFFER, framebuffer)
    renderer.value.render(scene.value as Scene, camera.value as PerspectiveCamera)
  }

  const onXRAnimationFrame = (_time: DOMHighResTimeStamp, frame: XRFrame) => {
    const { session } = frame
    session.requestAnimationFrame(onXRAnimationFrame)

    if (!refSpace.value) {
      return
    }

    const viewerPose = frame.getViewerPose(refSpace.value)

    if (viewerPose) {
      debugPosition.x = viewerPose.transform.position.x
      debugPosition.y = viewerPose.transform.position.y
      debugPosition.z = viewerPose.transform.position.z
    }

    render()
  }

  watch(
    () => session.value,
    async () => {
      session.value?.requestAnimationFrame(onXRAnimationFrame)
    },
    { immediate: true },
  )

  return { debugPosition, initScene, render }
}
