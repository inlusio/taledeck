import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
import useScene from '@/composables/Scene/Scene'
import type { DialogHotspotLocation } from '@/models/DialogHotspot/DialogHotspot'
import type { SceneObjects } from '@/models/Scene/Scene'
import { SCALE } from '@/models/Scene/Scene'
import type { TaleDeckScene } from '@/models/TaleDeck/TaleDeck'
import Reticulum from '@/util/Reticulum/Reticulum'
import { useResizeObserver } from '@vueuse/core'
import { Color, Frustum, MathUtils, Matrix4, Object3D, PerspectiveCamera, Texture, Vector3, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Ref } from 'vue'
import { ref } from 'vue'
import ThreeMeshUI from 'three-mesh-ui'

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    ThreeMeshUI.update()
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

  const createDialogBox = (parent: Object3D) => {
    const container = new ThreeMeshUI.Block({
      width: 20 * SCALE,
      height: 4 * SCALE,
      padding: 0.2 * SCALE,
      justifyContent: 'start',
      textAlign: 'left',
      bestFit: 'shrink',
      backgroundColor: new Color(0x000000),
      backgroundOpacity: 0.6,
      fontFamily: '/font/roboto-msdf/Roboto-msdf.json',
      fontTexture: '/font/roboto-msdf/Roboto-msdf.png',
    })

    container.position.set(0, -7 * SCALE, -10 * SCALE)
    container.rotation.set(MathUtils.DEG2RAD * -16, 0, 0)

    const text = new ThreeMeshUI.Text({
      content: 'Some text to be displayed',
      fontSize: 0.055,
    })

    container.add(text)
    parent.add(container)
  }

  const mount = () => {
    renderer.value = createRenderer()
    obj = createObjects()
    controls = createControls(obj.camera)
    reticulum = createReticulum(obj.camera, [])

    useResizeObserver(wrapperEl, ([entry]) => onCanvasResize(entry as ResizeObserverEntry))
    createDialogBox(obj!.camera)
  }

  const unmount = () => {
    //
  }

  const clear = () => {
    obj!.scene.visible = false
    obj!.hotspots.clear()
    reticulum?.clear()
  }

  const update = (scene: TaleDeckScene, texture: Texture) => {
    updateCamera(obj.viewer, new Vector3(scene.look_at_x, scene.look_at_y, scene.look_at_z))
    updateSkyMaterial(obj.sky, texture)
    updateHotspots(obj.hotspots, hotspots.value, reticulum!)
    obj!.scene.visible = true
  }

  return { mount, unmount, clear, update }
}
