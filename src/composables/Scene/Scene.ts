import useDialog from '@/composables/Dialog/Dialog'
import useDialogCommand from '@/composables/DialogCommand/DialogCommand'
import useInlineHotspotTemplate from '@/composables/InlineHotspotTemplate/InlineHotspotTemplate'
import type { DialogHotspot, DialogHotspotLocation } from '@/models/DialogHotspot/DialogHotspot'
import type { DialogResultCommandData } from '@/models/DialogResult/DialogResult'
import type { SceneObjects } from '@/models/Scene/Scene'
import { REF_WORLD_SIZE, TAR_WORLD_SIZE } from '@/models/Scene/Scene'
import Reticulum from '@/util/Reticulum/Reticulum'
import {
  AmbientLight,
  BackSide,
  CanvasTexture,
  Color,
  Frustum,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
  XRTargetRaySpace,
} from 'three'
import type { Ref } from 'vue'

const scale = TAR_WORLD_SIZE / REF_WORLD_SIZE
const projectionVector = new Vector3()

export default function useScene(isImmersive: boolean, renderer: Ref<WebGLRenderer | null>) {
  const { dialog } = useDialog()
  const { handleCommand } = useDialogCommand(dialog)
  const { canvas: hotspotEl } = useInlineHotspotTemplate()

  const hotspotTexture = new CanvasTexture(hotspotEl)

  const onActionRequested = (commandData: Array<DialogResultCommandData> | undefined = []) => {
    commandData.forEach((command) => handleCommand(command))
  }

  const getHotspotCoords = (
    canvas: HTMLCanvasElement,
    camera: PerspectiveCamera,
    hotspots: Object3D,
    viewFrustum: Frustum,
  ) => {
    let width: number
    let height: number

    if (isImmersive) {
      const session = renderer.value!.xr.getSession()
      // const xrCam = renderer.value!.xr.getCamera()

      if (isImmersive && session != null && session.renderState.baseLayer != null) {
        width = session.renderState.baseLayer.framebufferWidth
        height = session.renderState.baseLayer.framebufferHeight
      } else {
        throw new Error('Session undefined in immersive mode!')
      }
    } else {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
    }

    return hotspots.children
      .filter((child) => viewFrustum.intersectsObject(child))
      .map((child) => {
        const coords = projectToScreen(width, height, camera, child)

        return {
          hotspot: child.userData.hotspot as DialogHotspot,
          coords,
        } as DialogHotspotLocation
      })
  }

  const projectToScreen = (w: number, h: number, camera: PerspectiveCamera, child: Object3D) => {
    child.updateMatrixWorld()
    projectionVector.setFromMatrixPosition(child.matrixWorld).project(camera)

    return new Vector2(Math.round((0.5 + projectionVector.x / 2) * w), Math.round((0.5 - projectionVector.y / 2) * h))
  }

  const createScene = () => {
    const result = new Scene()
    result.background = new Color(0x4c4c4e)
    return result
  }

  const createHotspotMaterial = () => {
    return new SpriteMaterial({
      map: hotspotTexture,
      alphaTest: 0.5,
      fog: false,
      transparent: false,
    })
  }

  const createHotspot = (material: SpriteMaterial, hotspot: DialogHotspot) => {
    const { x, y, z } = hotspot
    const result = new Sprite(material)
    result.scale.set(3 * scale, 3 * scale, 1)
    result.position.set(x * scale, y * scale, (z ?? 0) * scale)
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
    const result = {
      camera: createCamera(),
      viewer: new Group(),
      hotspots: createHotspots(),
      light: createLight(),
      scene: createScene(),
      sky: createSky(),
    }

    result.viewer.add(result.camera)

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

    return new Reticulum(camera, controllers, {
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

  const updateCamera = (viewer: Group, lookAtTarget: Vector3) => {
    viewer.position.set(0, 0, 0)
    const lookAtTargetPosition = new Vector3().copy(lookAtTarget)

    viewer.lookAt(lookAtTargetPosition)
    viewer.rotateOnAxis(new Vector3(0, 1, 0), MathUtils.DEG2RAD * 180)
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

  return { getHotspotCoords, createObjects, createReticulum, updateCamera, updateSkyMaterial, updateHotspots }
}
