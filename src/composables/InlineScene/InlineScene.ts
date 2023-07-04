import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
import useInlineHotspotTemplate from '@/composables/InlineHotspotTemplate/InlineHotspotTemplate'
import {
  AmbientLight,
  BackSide,
  CanvasTexture,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Texture,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Ref } from 'vue'
import { reactive } from 'vue'
import { useResizeObserver } from '@vueuse/core'

export default function useInlineScene(wrapperEl: Ref<HTMLDivElement | null>, canvasEl: Ref<HTMLCanvasElement | null>) {
  const { canvas: hotspotEl } = useInlineHotspotTemplate()
  const { hotspots } = useDialogHotspot()

  const debugPosition = reactive<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 })

  const scene = new Scene()
  const camera = new PerspectiveCamera(80, undefined, 0.1, 100)

  const light = new AmbientLight(0xffffff, 2)
  const sky = new Mesh(new SphereGeometry(100, 25, 25))
  let renderer: WebGLRenderer | undefined
  let controls: OrbitControls | undefined
  let hotspotMaterial: SpriteMaterial | undefined
  let hotspotContainer: Object3D | undefined

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

    camera.position.set(0, 0, 0.01)

    useResizeObserver(wrapperEl, ([entry]) => {
      const { width, height } = entry.contentRect
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer?.setSize(width, height)
    })

    hotspotMaterial = new SpriteMaterial({
      map: new CanvasTexture(hotspotEl),
      alphaTest: 0.5,
      transparent: false,
      depthTest: false,
      depthWrite: false,
    })

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableZoom = false

    addHotspots()
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

  const addHotspots = () => {
    if (hotspotContainer != null) {
      scene.remove(hotspotContainer)
    }

    hotspotContainer = new Object3D()

    hotspots.value.forEach(({ x, y, z }) => {
      const sprite = new Sprite(hotspotMaterial)
      sprite.position.set(x, y, z ?? 0)
      sprite.scale.set(4, 4, 1)

      hotspotContainer?.add(sprite)
    })

    scene.add(hotspotContainer)
  }

  return { debugPosition, camera, renderer, initScene }
}
