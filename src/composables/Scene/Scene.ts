import useDialog from '@/composables/Dialog/Dialog'
import useDialogCommand from '@/composables/DialogCommand/DialogCommand'
import useDialogResult from '@/composables/DialogResult/DialogResult'
import useInlineHotspotTemplate from '@/composables/InlineHotspotTemplate/InlineHotspotTemplate'
import type { DialogHotspot } from '@/models/DialogHotspot/DialogHotspot'
import type { DialogResultCommandData, DialogResultTextData } from '@/models/DialogResult/DialogResult'
import { DialogResultType } from '@/models/DialogResult/DialogResult'
import type { SceneDialogBox, SceneObjects } from '@/models/Scene/Scene'
import { SCALE, TAR_WORLD_SIZE } from '@/models/Scene/Scene'
import Reticulum from '@/util/Reticulum/Reticulum'
import type { XRTargetRaySpace } from 'three'
import {
  AmbientLight,
  BackSide,
  CanvasTexture,
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Texture,
  Vector3,
  WebGLRenderer,
} from 'three'
import ThreeMeshUI from 'three-mesh-ui'
import type { ComputedRef, Ref } from 'vue'
import { computed } from 'vue'
//@ts-ignore
import type YarnBound from 'yarn-bound/src'

export default function useScene(
  isImmersive: boolean,
  renderer: Ref<WebGLRenderer | null>,
  runner: ComputedRef<YarnBound>,
) {
  const { dialog } = useDialog()
  const { getResultType } = useDialogResult()
  const { handleCommand } = useDialogCommand(dialog)
  const { canvas: hotspotEl } = useInlineHotspotTemplate()

  const hotspotTexture = new CanvasTexture(hotspotEl)

  const displayText = computed<DialogResultTextData | null>(() => {
    if (getResultType(runner.value.currentResult) === DialogResultType.Text) {
      return runner.value.currentResult as DialogResultTextData
    } else if (getResultType(runner.value.currentResult) === DialogResultType.End) {
      return null
    }

    throw Error('Unsupported dialog result type!')
  })

  const onActionRequested = (commandData: Array<DialogResultCommandData> | undefined = []) => {
    commandData.forEach((command) => handleCommand(command))
  }

  const createScene = () => {
    const result = new Scene()
    result.background = new Color(0x4c4c4e)
    return result
  }

  const createHotspotMaterial = () => {
    return new MeshBasicMaterial({
      map: hotspotTexture,
      alphaTest: 0.5,
      fog: false,
      transparent: false,
    })
  }

  const createHotspot = (material: MeshBasicMaterial, hotspot: DialogHotspot) => {
    const { x, y, z } = hotspot
    const result = new Mesh(new PlaneGeometry(3 * SCALE, 3 * SCALE), material)
    result.position.set(x * SCALE, y * SCALE, (z ?? 0) * SCALE)
    result.userData.hotspot = hotspot

    return result
  }

  const createCamera = () => {
    const result = new PerspectiveCamera(90, undefined, 0.1, TAR_WORLD_SIZE + 1)
    result.position.set(0, 0, 0.01)

    return result
  }

  const createHotspots = () => {
    return new Group()
  }

  const createLight = () => {
    return new AmbientLight(0xffffff, 1)
  }

  const createSky = () => {
    const geometry = new SphereGeometry(TAR_WORLD_SIZE, 25, 25)
    return new Mesh(geometry)
  }
  const createObjects = (): SceneObjects => {
    const result: SceneObjects = {
      camera: createCamera(),
      viewer: new Group(),
      hotspots: createHotspots(),
      light: createLight(),
      scene: createScene(),
      sky: createSky(),
      dialog: createDialogBox(),
    }

    result.viewer.add(result.camera)

    result.camera.add(result.dialog.box)

    result.dialog.box.add(result.dialog.characterText)
    result.dialog.box.add(result.dialog.dialogText)

    result.scene.add(result.light)
    result.scene.add(result.sky)
    result.scene.add(result.hotspots)
    result.scene.add(result.viewer)

    return result
  }

  const createReticulum = (camera: PerspectiveCamera, controllers: Array<XRTargetRaySpace>) => {
    const reticleInnerRadius = 0.02 * 3
    const reticleOuterRadius = 0.024 * 3
    const reticleRingWidth = reticleOuterRadius - reticleInnerRadius
    const fuseInnerRadius = reticleOuterRadius + 4 * reticleRingWidth
    const fuseOuterRadius = fuseInnerRadius + 4 * reticleRingWidth

    return new Reticulum(renderer.value!, camera, controllers, {
      proximity: true,
      reticle: {
        color: 0xcc0000,
        speed: 4,
        restPoint: TAR_WORLD_SIZE - 1,
        innerRadius: 0.0008,
        outerRadius: 0.006,
        hover: {
          innerRadius: reticleInnerRadius,
          outerRadius: reticleOuterRadius,
        },
      },
      fuse: {
        visible: false,
        duration: 2,
        hideAfterEnd: false,
        innerRadius: fuseInnerRadius,
        outerRadius: fuseOuterRadius,
      },
    })
  }

  const createDialogBox = (): SceneDialogBox => {
    const box = new ThreeMeshUI.Block({
      width: 10 * SCALE,
      height: 2 * SCALE,
      padding: 0.4 * SCALE,
      justifyContent: 'start',
      textAlign: 'left',
      bestFit: 'shrink',
      backgroundColor: new Color(0x000000),
      backgroundOpacity: 0.6,
      fontFamily: '/font/roboto-msdf/Roboto-msdf.json',
      fontTexture: '/font/roboto-msdf/Roboto-msdf.png',
    })

    box.position.set(0, -4 * SCALE, -10 * SCALE)
    box.rotation.set(MathUtils.DEG2RAD * -10, 0, 0)
    box.visible = false

    const characterText = new ThreeMeshUI.Text({
      content: '',
      fontSize: 0.032,
      fontColor: new Color(0xffffff),
      letterSpacing: 0.2,
    })

    const dialogText = new ThreeMeshUI.Text({
      content: '',
      fontSize: 0.032,
      fontColor: new Color(0xeeeeee),
      letterSpacing: 0.1,
    })

    return {
      box,
      characterText,
      dialogText,
    }
  }

  const updateCamera = (p: Group, lookAtTarget: Vector3) => {
    if (lookAtTarget.length() === 0) {
      return
    }

    p.lookAt(p.worldToLocal(lookAtTarget.normalize()))
    p.rotateOnAxis(new Vector3(0, 1, 0), MathUtils.DEG2RAD * 180)
  }

  const updateSkyMaterial = (sky: Mesh, texture: Texture) => {
    if (sky == null || texture == null) {
      throw new Error('Failed to load sky texture!')
    }

    sky.material = new MeshStandardMaterial({ map: texture, side: BackSide })
  }

  const updateHotspots = (parent: Group, hotspots: Array<DialogHotspot>, reticulum?: Reticulum) => {
    const hotspotMaterial = createHotspotMaterial()
    const children = hotspots.map((hotspot) => createHotspot(hotspotMaterial, hotspot))

    children.forEach((child) => {
      const { gazeDuration, onClick, onGazeLong } = child.userData.hotspot as DialogHotspot

      parent.add(child)
      reticulum?.add(child, {
        fuseDuration: gazeDuration,
        onGazeClick() {
          onActionRequested(onClick)
        },
        onGazeLong() {
          onActionRequested(onGazeLong)
        },
      })
    })
  }

  const updateHotspotDirections = (hotspots: Group, target: Object3D) => {
    hotspots.children.forEach((child) => {
      child.lookAt(target.position)
    })
  }

  return {
    displayText,
    createObjects,
    createReticulum,
    createDialogBox,
    updateCamera,
    updateSkyMaterial,
    updateHotspots,
    updateHotspotDirections,
  }
}
