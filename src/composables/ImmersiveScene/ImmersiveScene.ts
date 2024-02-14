import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
import useDialogResult from '@/composables/DialogResult/DialogResult'
import useGameScene from '@/composables/GameScene/GameScene'
import useGameStory from '@/composables/GameStory/GameStory'
import useScene from '@/composables/Scene/Scene'
import type { ReactiveDialog } from '@/models/Dialog/Dialog'
import type { SceneObjects } from '@/models/Scene/Scene'
import { NUM_CONTROLLERS } from '@/models/Scene/Scene'
import { referenceSpaceType } from '@/models/Session/Session'
import { useImmersiveSessionStore } from '@/stores/ImmersiveSession'
import Reticulum from '@/util/Reticulum/Reticulum'
import { storeToRefs } from 'pinia'
import type { AnimationMixer, XRTargetRaySpace } from 'three'
import { Clock, Frustum, Group, Matrix4, Texture, Vector3, WebGLRenderer } from 'three'
import ThreeMeshUI from 'three-mesh-ui'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory'
import type { Ref } from 'vue'
import { ref, watch } from 'vue'

const clock = new Clock()
const cameraTargetPosition = new Vector3()
const dialogBoxPosition = new Vector3()
const viewFrustum = new Frustum()
const viewProjectionMatrix = new Matrix4()

export default function useImmersiveScene(
  context: Ref<WebGL2RenderingContext | null>,
  session: Ref<XRSession | null>,
  refSpace: Ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>,
  onRender = (_width: number, _height: number) => {},
  dialog: ReactiveDialog,
  texture: Ref<Texture | null>,
  model: Ref<GLTF | null>,
) {
  let obj: SceneObjects | undefined
  let reticulum: Reticulum | undefined
  let controllers: Array<XRTargetRaySpace> = []
  let mixer: AnimationMixer | undefined

  const immersiveSessionStore = useImmersiveSessionStore()

  const { renderer } = storeToRefs(immersiveSessionStore)
  const { getCharacter } = useDialogResult()
  const { scene } = useGameScene()
  const { story } = useGameStory()
  const { hotspots } = useDialogHotspot()
  const {
    displayText,
    createObjects,
    createReticulum,
    updateCamera,
    updateHotspots,
    updateHotspotDirections,
    updateModel,
    updateSkyMaterial,
  } = useScene(true, renderer, dialog)
  const isMounted = ref<boolean>(false)
  const isVisible = ref<boolean>(false)

  const onAdvance = () => {
    dialog.runner!.advance()
  }

  const onAnimationFrame = (_time: DOMHighResTimeStamp, frame: XRFrame) => {
    if (renderer.value == null || context.value == null || refSpace.value == null || frame == null) {
      throw new Error('Scene could not be rendered!')
    }

    const session = frame.session
    const pose = frame.getViewerPose(refSpace.value)
    const layer = session.renderState.baseLayer

    if (pose) {
      const view = pose.views[0]

      if (layer) {
        context.value.bindFramebuffer(context.value.FRAMEBUFFER, layer.framebuffer)
        context.value.clear(context.value.COLOR_BUFFER_BIT | context.value.DEPTH_BUFFER_BIT)

        const { x, y, width, height } = layer.getViewport(view) as XRViewport
        context.value.viewport(x, y, width, height)
      }

      mixer?.update(clock.getDelta())
      updateFrustum(view.projectionMatrix)
      updateHotspotDirections(obj!.hotspots, obj!.camera)
      renderScene()
    }
  }

  const renderScene = () => {
    if (renderer.value == null || context.value == null || session.value == null) {
      throw new Error('Scene could not be rendered!')
    }

    reticulum!.update()
    renderer.value.render(obj!.scene, obj!.camera)

    onRender(renderer.value.domElement.clientWidth, renderer.value.domElement.clientHeight)
  }

  const createRenderer = async () => {
    if (context.value == null || session.value == null || refSpace.value == null) {
      throw new Error('Renderer could not be initialized!')
    }

    const result = new WebGLRenderer({
      antialias: true,
      alpha: true,
      context: context.value,
      canvas: context.value.canvas,
    })
    result.setPixelRatio(window.devicePixelRatio)
    result.autoClear = false
    result.xr.enabled = true
    result.xr.setReferenceSpace(refSpace.value!)
    result.xr.setReferenceSpaceType(referenceSpaceType)
    await result.xr.setSession(session.value as XRSession)
    result.xr.setAnimationLoop(onAnimationFrame)

    await createBaseLayer()

    return result
  }

  const createBaseLayer = async () => {
    if (context.value == null || session.value == null) {
      throw new Error('Renderer could not be initialized!')
    }

    const baseLayer = new XRWebGLLayer(session.value, context.value)
    await session.value.updateRenderState({ baseLayer })
  }

  const createControllers = (r: WebGLRenderer, parent: Group) => {
    const result = []

    for (let i = 0; i < NUM_CONTROLLERS; i++) {
      const controller = r.xr.getController(i)
      parent.add(controller)
      result.push(controller)

      const controllerModelFactory = new XRControllerModelFactory()
      const grip = r.xr.getControllerGrip(i)
      grip.add(controllerModelFactory.createControllerModel(grip))
      parent.add(grip)
    }

    return result
  }

  const updateFrustum = (projectionMatrix: Float32Array) => {
    if (projectionMatrix != null) {
      viewProjectionMatrix.fromArray(projectionMatrix)
      viewFrustum.setFromProjectionMatrix(viewProjectionMatrix)
    }
  }

  const updateReticulum = (reticulum: Reticulum) => {
    reticulum.controllers.forEach((controller) => {
      controller.addEventListener('connected', (e) => {
        console.log('controller connected', e)

        const data: XRInputSource = e.data

        if (data.handedness === 'left') {
          controller.addEventListener('selectstart', reticulum.clickStartListener)
          controller.addEventListener('selectend', reticulum.clickEndListener)
          controller.addEventListener('squeezestart', reticulum.clickStartListener)
          controller.addEventListener('squeezeend', reticulum.clickEndListener)
        }

        if (data.handedness === 'right') {
          controller.addEventListener('selectend', onAdvance)
          controller.addEventListener('squeezeend', onAdvance)
        }
      })
    })
  }

  const mount = async () => {
    renderer.value = renderer.value ?? (await createRenderer())
    obj = obj ?? createObjects()
    controllers = controllers.length === NUM_CONTROLLERS ? controllers : createControllers(renderer.value, obj.viewer)
    reticulum = reticulum ?? createReticulum(obj.camera, controllers)

    isMounted.value = true
    isVisible.value = false
  }

  const unmount = () => {
    renderer.value = null
    obj = undefined
    controllers = []
    reticulum = undefined

    isMounted.value = false
    isVisible.value = false
  }

  const clear = () => {
    if (!isMounted.value) {
      return
    }

    obj!.scene.visible = false
    obj!.hotspots.clear()
    reticulum?.clear()

    isVisible.value = false
  }

  const show = () => {
    obj!.scene.visible = true
    isVisible.value = true
  }

  // React to an updated session.
  watch(
    () => [isMounted.value, scene.value],
    (nV) => {
      clear()

      if (nV.every(Boolean)) {
        updateCamera(obj!.viewer, obj!.camera, scene.value!.look_at_theta ?? 0)
        updateHotspots(obj!.hotspots, hotspots.value, reticulum)
        updateReticulum(reticulum!)
        show()
      }
    },
    { immediate: true },
  )

  // React to a texture update.
  watch(
    () => [isMounted.value, texture.value],
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
    () => [isMounted.value, model.value, scene.value],
    (nV) => {
      clear()

      if (nV.every(Boolean)) {
        const { scene_position_x: x, scene_position_y: y, scene_position_z: z } = scene.value!
        mixer = updateModel(obj!.model, model.value!, new Vector3(x, y, z))
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

  watch(
    () => [isVisible.value, displayText.value],
    () => {
      if (!isVisible.value) {
        return
      }

      if (!obj?.dialog) {
        throw new Error('Scene items are not yet initialized!')
      }

      if (displayText.value != null) {
        const characterContent = getCharacter(displayText.value.markup)
        const dialogContent = displayText.value.text

        obj.dialog.cameraTarget.getWorldPosition(cameraTargetPosition)
        obj.dialog.box.getWorldPosition(dialogBoxPosition)

        const distance = dialogBoxPosition.distanceTo(cameraTargetPosition)

        if (distance > (story.value?.immersive_dialog_box_move_threshold ?? 0)) {
          obj.dialog.cameraTarget.lookAt(obj.camera.position)
          obj.dialog.box.position.set(...cameraTargetPosition.toArray())
          obj.dialog.box.lookAt(obj.camera.position)
        }

        //@ts-ignore
        obj.dialog.characterText.set({ content: characterContent ? `${characterContent}: ` : ' ' })
        //@ts-ignore
        obj.dialog.dialogText.set({ content: dialogContent })
        obj.dialog.box.visible = !!(characterContent || dialogContent)
      } else {
        obj.dialog.box.visible = false
        //@ts-ignore
        obj.dialog.characterText.set({ content: '' })
        //@ts-ignore
        obj.dialog.dialogText.set({ content: '' })
      }

      ThreeMeshUI.update()
    },
    { immediate: true },
  )

  return { isMounted, mount, unmount }
}
