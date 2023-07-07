import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
import useScene from '@/composables/Scene/Scene'
import type { SceneObjects } from '@/models/Scene/Scene'
import { useResizeObserver } from '@vueuse/core'
import { PerspectiveCamera, Texture, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Ref } from 'vue'
import { reactive } from 'vue'
import Reticulum from '@/util/Reticulum/Reticulum'

export default function useInlineScene(wrapperEl: Ref<HTMLDivElement | null>, canvasEl: Ref<HTMLCanvasElement | null>) {
  const { hotspots } = useDialogHotspot()
  const { createObjects, updateSkyMaterial, updateHotspots } = useScene()

  const debugPosition = reactive<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 })

  let obj: SceneObjects
  let renderer: WebGLRenderer | undefined
  let controls: OrbitControls | undefined
  let reticulum: Reticulum | undefined

  const onCanvasResize = (entry: ResizeObserverEntry) => {
    const { width, height } = entry.contentRect
    obj.camera.aspect = width / height
    obj.camera.updateProjectionMatrix()
    renderer?.setSize(width, height)
    renderScene()
  }

  const onControlsChange = () => {
    renderScene()
  }

  const renderScene = (doRender: boolean = true) => {
    if (renderer == null) {
      throw new Error('Scene could not be rendered!')
    }

    if (!doRender) {
      return
    }

    renderer.render(obj.scene, obj.camera)
    reticulum!.update()
  }

  const createRenderer = () => {
    if (canvasEl.value == null) {
      throw new Error('Renderer could not be initialized!')
    }

    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: canvasEl.value as HTMLCanvasElement,
    })
    renderer.setAnimationLoop(() => renderScene(false))
  }

  const createControls = (camera: PerspectiveCamera) => {
    if (renderer == null) {
      throw new Error('Controls could not be initialized!')
    }

    controls = new OrbitControls(camera, renderer.domElement)
    controls.addEventListener('change', () => onControlsChange())
    controls.enableZoom = false
  }

  const createReticulum = (camera: PerspectiveCamera) => {
    reticulum = new Reticulum(camera, {
      reticle: { innerRadius: 0.4, outerRadius: 3, color: 0xff00ff, restPoint: 20 },
    })
  }

  const initScene = async (texture: Texture) => {
    obj = createObjects()
    createRenderer()
    createControls(obj.camera)
    createReticulum(obj.camera)

    useResizeObserver(wrapperEl, ([entry]) => onCanvasResize(entry as ResizeObserverEntry))

    updateSkyMaterial(obj.sky, texture)
    updateHotspots(obj.hotspots, hotspots.value, reticulum!)

    setTimeout(renderScene, 0)
  }

  return { debugPosition, initScene }
}
