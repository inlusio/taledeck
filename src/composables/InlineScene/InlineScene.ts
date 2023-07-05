import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
import useScene from '@/composables/Scene/Scene'
import type { SceneObjects } from '@/models/Scene/Scene'
import { useResizeObserver } from '@vueuse/core'
import { Texture, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Ref } from 'vue'
import { reactive } from 'vue'

export default function useInlineScene(wrapperEl: Ref<HTMLDivElement | null>, canvasEl: Ref<HTMLCanvasElement | null>) {
  const { hotspots } = useDialogHotspot()
  const { createObjects, updateSkyMaterial, updateHotspots } = useScene()

  const debugPosition = reactive<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 })

  let obj: SceneObjects

  let renderer: WebGLRenderer | undefined
  let controls: OrbitControls | undefined

  const onRender = (doRender: boolean = true) => {
    if (renderer == null) {
      throw new Error('Scene could not be rendered!')
    }

    if (!doRender) {
      return
    }

    renderer.render(obj.scene, obj.camera)
  }

  const onCanvasResize = (entry: ResizeObserverEntry) => {
    const { width, height } = entry.contentRect
    obj.camera.aspect = width / height
    obj.camera.updateProjectionMatrix()
    renderer?.setSize(width, height)
  }

  const onControlsChange = () => {
    onRender()
  }

  const createControls = () => {
    if (renderer == null) {
      throw new Error('Controls could not be initialized!')
    }

    controls = new OrbitControls(obj.camera, renderer.domElement)
    controls.addEventListener('change', () => onControlsChange())
    controls.enableZoom = false
  }

  const createRenderer = () => {
    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: canvasEl.value as HTMLCanvasElement,
    })
    renderer.setAnimationLoop(() => onRender(false))
  }

  const initScene = async (texture: Texture) => {
    if (canvasEl.value == null) {
      throw new Error('Scene could not be initialized!')
    }

    obj = createObjects()
    updateSkyMaterial(obj.sky, texture)

    obj.scene.add(obj.light)
    obj.scene.add(obj.sky)
    obj.scene.add(obj.hotspots)

    createRenderer()
    createControls()
    useResizeObserver(wrapperEl, ([entry]) => onCanvasResize(entry as ResizeObserverEntry))
    updateHotspots(obj.hotspots, hotspots.value)
    onControlsChange()

    setTimeout(() => {
      onRender()
    }, 0)
  }

  return { debugPosition, initScene }
}
