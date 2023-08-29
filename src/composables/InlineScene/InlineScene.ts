import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
import useScene from '@/composables/Scene/Scene'
import type { ReactiveDialog } from '@/models/Dialog/Dialog'
import type { SceneObjects } from '@/models/Scene/Scene'
import type { TaleDeckScene } from '@/models/TaleDeck/TaleDeck'
import Reticulum from '@/util/Reticulum/Reticulum'
import { useResizeObserver } from '@vueuse/core'
import { Frustum, Matrix4, PerspectiveCamera, Texture, Vector3, WebGLRenderer } from 'three'
import ThreeMeshUI from 'three-mesh-ui'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Ref } from 'vue'
import { ref, watch } from 'vue'

interface InlineSceneEls {
  wrapperEl: Ref<HTMLDivElement | null>
  canvasEl: Ref<HTMLCanvasElement | null>
}

const viewFrustum = new Frustum()
const viewProjectionMatrix = new Matrix4()

export default function useInlineScene(
  onRender = (_width: number, _height: number) => {},
  { wrapperEl, canvasEl }: InlineSceneEls,
  allowRendering: Ref<boolean>,
  dialog: ReactiveDialog,
) {
  let obj: SceneObjects
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let controls: OrbitControls | undefined
  let reticulum: Reticulum | undefined

  const isVisible = ref<boolean>(false)
  const renderer = ref<WebGLRenderer | null>(null)
  const { hotspots } = useDialogHotspot()
  const { createObjects, createReticulum, updateCamera, updateSkyMaterial, updateHotspots, updateHotspotDirections } =
    useScene(false, renderer, dialog)

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
    updateHotspotDirections(obj.hotspots, obj.camera)

    onRender(wrapperEl.value.clientWidth, wrapperEl.value.clientHeight)
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

  const mount = () => {
    renderer.value = createRenderer()
    obj = createObjects()
    controls = createControls(obj.camera)
    reticulum = createReticulum(obj.camera, [])

    useResizeObserver(wrapperEl, ([entry]) => onCanvasResize(entry as ResizeObserverEntry))

    isVisible.value = true
  }

  const unmount = () => {
    isVisible.value = false
  }

  const clear = () => {
    isVisible.value = false
    obj!.scene.visible = false
    obj!.hotspots.clear()
    reticulum?.clear()

    ThreeMeshUI.update()
  }

  const update = (scene: TaleDeckScene, texture: Texture) => {
    updateCamera(obj.viewer, new Vector3(scene.look_at_x, scene.look_at_y, scene.look_at_z))
    updateSkyMaterial(obj.sky, texture)
    updateHotspots(obj.hotspots, hotspots.value, reticulum!)

    obj!.scene.visible = true
    isVisible.value = true
    ThreeMeshUI.update()
  }

  watch(
    () => [isVisible.value, hotspots.value.length],
    () => {
      if (isVisible.value) {
        updateHotspots(obj!.hotspots, hotspots.value, reticulum)
      }
    },
    { immediate: true },
  )

  return { mount, unmount, clear, update }
}
