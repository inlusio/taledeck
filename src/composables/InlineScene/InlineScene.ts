import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
import useGameScene from '@/composables/GameScene/GameScene'
import useScene from '@/composables/Scene/Scene'
import type { ReactiveDialog } from '@/models/Dialog/Dialog'
import type { SceneObjects } from '@/models/Scene/Scene'
import Reticulum from '@/util/Reticulum/Reticulum'
import { useResizeObserver } from '@vueuse/core'
import {
  AnimationMixer,
  Camera,
  Clock,
  Frustum,
  Matrix4,
  PerspectiveCamera,
  Texture,
  Vector3,
  WebGLRenderer,
} from 'three'
import ThreeMeshUI from 'three-mesh-ui'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import type { Ref } from 'vue'
import { ref, watch } from 'vue'

interface InlineSceneEls {
  wrapperEl: Ref<HTMLDivElement | null>
  canvasEl: Ref<HTMLCanvasElement | null>
}

const clock = new Clock()
const viewFrustum = new Frustum()
const viewProjectionMatrix = new Matrix4()

export default function useInlineScene(
  onRender = (_width: number, _height: number) => {},
  dialog: ReactiveDialog,
  texture: Ref<Texture | null>,
  model: Ref<GLTF | null>,
  { wrapperEl, canvasEl }: InlineSceneEls,
  allowRendering: Ref<boolean>,
) {
  let obj: SceneObjects
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let controls: OrbitControls | undefined
  let reticulum: Reticulum | undefined
  let mixer: AnimationMixer | undefined

  const isMounted = ref<boolean>(false)
  const isVisible = ref<boolean>(false)
  const renderer = ref<WebGLRenderer | null>(null)
  const { scene } = useGameScene()
  const { hotspots } = useDialogHotspot()
  const {
    createObjects,
    createReticulum,
    updateCamera,
    updateHotspots,
    updateHotspotDirections,
    updateModel,
    updateSkyMaterial,
  } = useScene(false, renderer, dialog)

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

    mixer?.update(clock.getDelta())
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

    isMounted.value = true
    isVisible.value = true
  }

  const unmount = () => {
    isMounted.value = false
    isVisible.value = false
  }

  const clear = () => {
    if (!isMounted.value) {
      return
    }

    isVisible.value = false
    obj!.scene.visible = false
    obj!.hotspots.clear()
    reticulum?.clear()

    ThreeMeshUI.update()
  }

  const show = () => {
    obj!.scene.visible = true
    isVisible.value = true
    ThreeMeshUI.update()
  }

  // React to an updated inline session.
  watch(
    () => [isMounted.value, allowRendering.value, scene.value],
    (nV) => {
      clear()

      if (nV.every(Boolean)) {
        updateCamera(obj.viewer, obj.camera, scene.value!.look_at_theta ?? 0)
        updateHotspots(obj.hotspots, hotspots.value, reticulum!)
        show()
      }
    },
    { immediate: true },
  )

  // React to a texture update.
  watch(
    () => [isMounted.value, allowRendering.value, texture.value],
    (nV) => {
      clear()

      if (nV.every(Boolean)) {
        updateSkyMaterial(obj!.sky, texture.value!)
        show()
      }
    },
    { immediate: true },
  )

  // React to a model update.
  watch(
    () => [isMounted.value, model.value, scene.value, allowRendering.value],
    (nV) => {
      clear()

      if (nV.every(Boolean)) {
        const camera: Camera | undefined = model.value!.cameras[0]
        const {
          scene_position_x: x,
          scene_position_y: y,
          scene_position_z: z,
          scene_use_camera_position: useCameraPosition,
        } = scene.value!
        let position: Vector3 | undefined

        if (useCameraPosition && camera != null) {
          position = new Vector3(...camera.position).multiplyScalar(-1)
        } else {
          position = new Vector3(x, y, z)
        }

        mixer = updateModel(obj!.model, model.value!, position)
        show()
      }
    },
    { immediate: true },
  )

  watch(
    () => [isVisible.value, hotspots.value.length],
    () => {
      if (isVisible.value) {
        updateHotspots(obj!.hotspots, hotspots.value, reticulum)
      }
    },
    { immediate: true },
  )

  return { isMounted, mount, unmount }
}
