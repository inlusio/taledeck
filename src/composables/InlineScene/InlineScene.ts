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
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export default function useInlineScene(canvasEl: Ref<HTMLCanvasElement | null>) {
  const debugPosition = reactive<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 })

  const scene = new Scene()
  const camera = new PerspectiveCamera(80, undefined, 0.1, 10)

  let light = new AmbientLight(0xffffff, 2)
  let sky = new Mesh(new SphereGeometry(1, 25, 25))
  let renderer: WebGLRenderer | undefined
  let controls: OrbitControls | undefined

  const initScene = async (texture: Texture) => {
    if (canvasEl.value == null) {
      throw new Error('Scene could not be initialized!')
    }

    sky.material = new MeshStandardMaterial({ map: texture, side: BackSide })

    scene.add(light)
    scene.add(sky)

    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: canvasEl.value,
    })
    renderer.setAnimationLoop(onAnimationFrame)

    camera.position.set(-0.01, 0, 0)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.update()
  }

  const renderScene = (s: Scene, c: PerspectiveCamera) => {
    if (renderer == null) {
      throw new Error('Scene could not be rendered!')
    }

    renderer.render(s, c)
  }

  const onAnimationFrame = (_time: DOMHighResTimeStamp) => {
    renderScene(scene, camera)
    controls!.update()
  }

  return { debugPosition, camera, renderer, initScene }
}
