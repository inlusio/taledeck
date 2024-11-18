import useDialogCommand from '@/composables/DialogCommand/DialogCommand'
import useDialogResult from '@/composables/DialogResult/DialogResult'
import useInlineHotspotTemplate from '@/composables/InlineHotspotTemplate/InlineHotspotTemplate'
import type { ReactiveDialog } from '@/models/Dialog/Dialog'
import type { DialogHotspot } from '@/models/DialogHotspot/DialogHotspot'
import type { DialogResultCommandData, DialogResultTextData } from '@/models/DialogResult/DialogResult'
import { DialogResultType } from '@/models/DialogResult/DialogResult'
import type { SceneDialogBox, SceneObjects } from '@/models/Scene/Scene'
import { SCALE, TAR_WORLD_SIZE } from '@/models/Scene/Scene'
import Reticulum from '@/util/Reticulum/Reticulum'
import {
  AmbientLight,
  AnimationMixer,
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
  type XRTargetRaySpace,
} from 'three'
import ThreeMeshUI from 'three-mesh-ui'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import type { Ref } from 'vue'
import { computed } from 'vue'

export default function useScene(_isImmersive: boolean, renderer: Ref<WebGLRenderer | null>, dialog: ReactiveDialog) {
  const { getResultType } = useDialogResult()
  const { handleCommand } = useDialogCommand(dialog)
  const { canvas: hotspotEl } = useInlineHotspotTemplate()

  const hotspotTexture = new CanvasTexture(hotspotEl)

  const runner = computed(() => dialog.runner!)
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

  const createModel = () => {
    return new Group()
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
    const { x, y, z, phi, theta, radius } = hotspot
    const result = new Mesh(new PlaneGeometry(3 * SCALE, 3 * SCALE), material)

    result.userData.hotspot = hotspot

    if ([x, y, z].every((coord) => coord != null)) {
      result.position.set(x! * SCALE, y! * SCALE, z! * SCALE)
      // result.position.setFromSphericalCoords()
    } else if ([phi, theta, radius].every((coord) => coord != null)) {
      result.position.setFromSphericalCoords(
        radius! * SCALE,
        MathUtils.degToRad(90 - phi!),
        MathUtils.degToRad(theta! + 180),
      )
    } else {
      throw new Error('Neither cartesian nor spherical coordinates were provided for hotspot!')
    }

    return result
  }

  const createViewer = () => {
    const result = new Group()
    result.rotation.order = 'YXZ'

    return result
  }

  const createCamera = () => {
    const result = new PerspectiveCamera(90, undefined, 1e-2, 1e5)
    result.position.set(0, 0, 0.01)
    result.rotation.order = 'YXZ'

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
      viewer: createViewer(),
      hotspots: createHotspots(),
      light: createLight(),
      scene: createScene(),
      model: createModel(),
      sky: createSky(),
      dialog: createDialogBox(),
    }

    result.scene.add(result.light)
    result.scene.add(result.viewer)
    result.scene.add(result.camera)
    result.scene.add(result.dialog.box)

    result.viewer.add(result.sky)
    result.viewer.add(result.hotspots)
    result.viewer.add(result.model)

    result.camera.add(result.dialog.cameraTarget)

    result.dialog.box.add(result.dialog.characterText)
    result.dialog.box.add(result.dialog.dialogText)

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
    const cameraTarget = new Object3D()
    cameraTarget.position.set(0, -4 * SCALE, -10 * SCALE)

    const box = new ThreeMeshUI.Block({
      width: 10 * SCALE,
      height: 2 * SCALE,
      padding: 0.4 * SCALE,
      justifyContent: 'center',
      textAlign: 'left',
      bestFit: 'shrink',
      backgroundColor: new Color(0x000000),
      backgroundOpacity: 0.6,
      fontFamily: '/font/roboto-msdf/Roboto-msdf.json',
      fontTexture: '/font/roboto-msdf/Roboto-msdf.png',
    })

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
      cameraTarget,
      box,
      characterText,
      dialogText,
    }
  }

  const updateCamera = (viewer: Group, camera: PerspectiveCamera, azimuth: number) => {
    const viewerRot = viewer.rotation.y
    const cameraRot = camera.rotation.y
    const targetRot = viewerRot + cameraRot - viewerRot + MathUtils.degToRad(azimuth)

    viewer.rotation.set(viewer.rotation.x, targetRot, viewer.rotation.z)
  }

  const updateSkyMaterial = (sky: Mesh, texture: Texture) => {
    if (sky == null || texture == null) {
      throw new Error('Failed to load sky texture!')
    }

    sky.material = new MeshStandardMaterial({ map: texture, side: BackSide })
  }

  const updateModel = (model: Group, gltf: GLTF, position: Vector3) => {
    if (model == null || gltf == null) {
      throw new Error('Failed to load model!')
    }

    gltf.scene.traverse((obj) => (obj.frustumCulled = false))

    model.clear()
    model.add(gltf.scene)
    model.position.set(position.x ?? 0, position.y ?? 0, position.z ?? 0)

    const mixer = new AnimationMixer(gltf.scene)

    if (gltf.animations.length) {
      mixer.clipAction(gltf.animations[0]).play()
    }

    return mixer
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
    updateModel,
    updateHotspots,
    updateHotspotDirections,
  }
}
