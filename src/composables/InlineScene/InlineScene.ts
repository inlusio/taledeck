import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
import useScene from '@/composables/Scene/Scene'
import type { DialogHotspotLocation } from '@/models/DialogHotspot/DialogHotspot'
import type { SceneObjects } from '@/models/Scene/Scene'
import Reticulum from '@/util/Reticulum/Reticulum'
import { useResizeObserver } from '@vueuse/core'
import { Frustum, Matrix4, PerspectiveCamera, Texture, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Ref } from 'vue'
import { ref } from 'vue'

interface InlineSceneEls {
  wrapperEl: Ref<HTMLDivElement | null>
  canvasEl: Ref<HTMLCanvasElement | null>
}

const viewFrustum = new Frustum()
const viewProjectionMatrix = new Matrix4()

export default function useInlineScene(
  onRender = (_width: number, _height: number, _coords: Array<DialogHotspotLocation>) => {},
  { wrapperEl, canvasEl }: InlineSceneEls,
  allowRendering: Ref<boolean>,
) {
  let obj: SceneObjects
  let controls: OrbitControls | undefined
  let reticulum: Reticulum | undefined

  const renderer = ref<WebGLRenderer | null>(null)

  const { hotspots } = useDialogHotspot()
  const { getHotspotCoords, createObjects, createReticulum, updateSkyMaterial, updateHotspots } = useScene(
    false,
    renderer,
  )

  const onCanvasResize = (entry: ResizeObserverEntry) => {
    const { width, height } = entry.contentRect
    obj.camera.aspect = width / height
    obj.camera.updateProjectionMatrix()
    renderer.value?.setSize(width, height)
    onAnimationFrame()
  }

  const onAnimationFrame = () => {
    if (renderer.value == null) {
      throw new Error('Scene could not be rendered!')
    }

    if (!allowRendering.value) {
      return
    }

    reticulum!.update()
    renderer.value.render(obj.scene, obj.camera)

    if (wrapperEl.value == null) {
      return
    }

    updateFrustum()

    onRender(
      wrapperEl.value.clientWidth,
      wrapperEl.value.clientHeight,
      getHotspotCoords(renderer.value.domElement, obj.camera, obj.hotspots, viewFrustum),
    )
  }

  const createRenderer = () => {
    if (canvasEl.value == null) {
      throw new Error('Renderer could not be initialized!')
    }

    renderer.value = new WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: canvasEl.value as HTMLCanvasElement,
    })
    renderer.value.setAnimationLoop(onAnimationFrame)
  }

  const createControls = (camera: PerspectiveCamera) => {
    if (renderer.value == null) {
      throw new Error('Controls could not be initialized!')
    }

    controls = new OrbitControls(camera, renderer.value.domElement)
    controls.enableZoom = false
  }

  const updateFrustum = () => {
    obj.camera.updateProjectionMatrix()
    obj.camera.matrixWorldInverse.copy(obj.camera.matrixWorld).invert()
    viewProjectionMatrix.multiplyMatrices(obj.camera.projectionMatrix, obj.camera.matrixWorldInverse)
    viewFrustum.setFromProjectionMatrix(viewProjectionMatrix)
  }

  const initScene = async (texture: Texture) => {
    obj = createObjects()
    createRenderer()
    createControls(obj.camera)
    reticulum = createReticulum(obj.camera)

    useResizeObserver(wrapperEl, ([entry]) => onCanvasResize(entry as ResizeObserverEntry))

    updateSkyMaterial(obj.sky, texture)
    await updateHotspots(obj.hotspots, hotspots.value, reticulum!)
  }

  const unmountScene = () => {
    reticulum?.destroy()
  }

  return { initScene, unmountScene }
}
