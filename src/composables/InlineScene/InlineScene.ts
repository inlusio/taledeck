import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
import useDialogResult from '@/composables/DialogResult/DialogResult'
import useScene from '@/composables/Scene/Scene'
import type { SceneObjects } from '@/models/Scene/Scene'
import type { TaleDeckScene } from '@/models/TaleDeck/TaleDeck'
import Reticulum from '@/util/Reticulum/Reticulum'
import { useResizeObserver } from '@vueuse/core'
import { Frustum, Matrix4, PerspectiveCamera, Texture, Vector3, WebGLRenderer } from 'three'
import ThreeMeshUI from 'three-mesh-ui'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { ComputedRef, Ref } from 'vue'
import { ref, watch } from 'vue'
//@ts-ignore
import type YarnBound from 'yarn-bound/src'

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
  runner: ComputedRef<YarnBound>,
) {
  let obj: SceneObjects
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let controls: OrbitControls | undefined
  let reticulum: Reticulum | undefined

  const isVisible = ref<boolean>(false)
  const renderer = ref<WebGLRenderer | null>(null)
  const { getCharacter } = useDialogResult()
  const { hotspots } = useDialogHotspot()
  const { displayText, createObjects, createReticulum, updateCamera, updateSkyMaterial, updateHotspots } = useScene(
    false,
    renderer,
    runner,
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

    reticulum?.update()
    renderer.value.render(obj.scene, obj.camera)

    if (wrapperEl.value == null) {
      return
    }

    updateFrustum()

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
    () => [isVisible.value, displayText.value],
    () => {
      if (isVisible.value && displayText.value != null) {
        const characterContent = `${getCharacter(displayText.value.markup)}: `
        const dialogContent = displayText.value.text

        //@ts-ignore
        obj!.dialog.characterText.set({ content: characterContent })
        //@ts-ignore
        obj!.dialog.dialogText.set({ content: dialogContent })

        obj!.dialog.box.visible = !!(characterContent || dialogContent)
      } else {
        if (obj?.dialog) {
          obj.dialog.box.visible = false
          //@ts-ignore
          obj.dialog.characterText.set({ content: '' })
          //@ts-ignore
          obj.dialog.dialogText.set({ content: '' })
        }
      }

      ThreeMeshUI.update()
    },
    { immediate: true },
  )

  return { mount, unmount, clear, update }
}
