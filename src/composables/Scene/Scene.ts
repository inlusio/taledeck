import useInlineHotspotTemplate from '@/composables/InlineHotspotTemplate/InlineHotspotTemplate'
import type { DialogHotspot } from '@/models/DialogHotspot/DialogHotspot'
import type { SceneObjects } from '@/models/Scene/Scene'
import {
  AmbientLight,
  BackSide,
  CanvasTexture,
  Color,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Texture,
} from 'three'
import type Reticulum from '@/util/Reticulum/Reticulum'
import type { ReticulumTarget } from '@/util/Reticulum/Types'

export default function useScene() {
  const { canvas: hotspotEl } = useInlineHotspotTemplate()

  const hotspotTexture = new CanvasTexture(hotspotEl)

  const createScene = () => {
    const result = new Scene()
    result.background = new Color(0x00ff00)
    return result
  }

  const updateSkyMaterial = (sky: Mesh, texture: Texture) => {
    if (sky == null || texture == null) {
      throw new Error('Failed to load sky texture!')
    }

    sky.material = new MeshStandardMaterial({ map: texture, side: BackSide })
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
    result.scale.set(3, 3, 1)
    result.position.set(x, y, z ?? 0)
    result.userData.hotspot = hotspot

    return result
  }

  const createCamera = () => {
    const result = new PerspectiveCamera(70, undefined, 0.1, 100)
    result.position.set(0, 0, 0.01)

    return result
  }

  const createHotspots = () => {
    return new Object3D()
  }

  const createLight = () => {
    return new AmbientLight(0xffffff, 2)
  }
  const createSky = () => {
    const geometry = new SphereGeometry(100, 25, 25)
    return new Mesh(geometry)
  }

  const createObjects = (): SceneObjects => {
    const result = {
      camera: createCamera(),
      hotspots: createHotspots(),
      light: createLight(),
      scene: createScene(),
      sky: createSky(),
    }

    result.scene.add(result.light)
    result.scene.add(result.sky)
    result.scene.add(result.hotspots)
    result.scene.add(result.camera)

    return result
  }

  const updateHotspots = async (parent: Object3D, hotspots: Array<DialogHotspot>, reticulum?: Reticulum) => {
    const hotspotMaterial = createHotspotMaterial()
    const children = hotspots.map((hotspot) => createHotspot(hotspotMaterial, hotspot))

    parent.children.forEach((child) => {
      parent.remove(child)
      reticulum?.remove(child as ReticulumTarget)
    })

    children.forEach((child) => {
      parent.add(child)
      reticulum?.add(child, {
        onGazeLong() {
          console.log('i gazed into the abyss', child.userData.hotspot as DialogHotspot)
        },
      })
    })
  }

  return { createObjects, updateSkyMaterial, updateHotspots }
}
