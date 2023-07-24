import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
import useScene from '@/composables/Scene/Scene'
import type { DialogHotspotLocation } from '@/models/DialogHotspot/DialogHotspot'
import type { SceneObjects } from '@/models/Scene/Scene'
import type { TaleDeckScene } from '@/models/TaleDeck/TaleDeck'
import Reticulum from '@/util/Reticulum/Reticulum'
import { useResizeObserver } from '@vueuse/core'
import { Frustum, Matrix4, PerspectiveCamera, Texture, Vector3, WebGLRenderer } from 'three'
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
  const { getHotspotCoords, createObjects, createReticulum, updateCamera, updateSkyMaterial, updateHotspots } =
    useScene(false, renderer)

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

    reticulum?.update()
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

    const result = new WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: canvasEl.value as HTMLCanvasElement,
    })
    result.setAnimationLoop(onAnimationFrame)

    return result
  }

  const createControls = (camera: PerspectiveCamera) => {
    if (renderer.value == null) {
      throw new Error('Controls could not be initialized!')
    }

    const result = new OrbitControls(camera, renderer.value.domElement)
    result.enableZoom = false

    return result
  }

  const updateFrustum = () => {
    obj.camera.updateProjectionMatrix()
    obj.camera.matrixWorldInverse.copy(obj.camera.matrixWorld).invert()
    viewProjectionMatrix.multiplyMatrices(obj.camera.projectionMatrix, obj.camera.matrixWorldInverse)
    viewFrustum.setFromProjectionMatrix(viewProjectionMatrix)
  }

  const mountScene = async (scene: TaleDeckScene, texture: Texture) => {
    obj = createObjects()
    renderer.value = renderer.value ?? createRenderer()
    controls = controls ?? createControls(obj.camera)
    reticulum = reticulum ?? createReticulum(obj.camera, [])

    useResizeObserver(wrapperEl, ([entry]) => onCanvasResize(entry as ResizeObserverEntry))

    updateCamera(obj.viewer, new Vector3(scene.look_at_x, scene.look_at_y, scene.look_at_z))
    updateSkyMaterial(obj.sky, texture)
    updateHotspots(obj.hotspots, hotspots.value, reticulum!)
  }

  const unmountScene = () => {
    reticulum?.destroy()
    reticulum = undefined
  }

  return { mountScene, unmountScene }
}
