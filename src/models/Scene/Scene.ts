import type { AmbientLight, Group, Mesh, PerspectiveCamera, Scene } from 'three'

export interface SceneObjects {
  scene: Scene
  camera: PerspectiveCamera
  viewer: Group
  light: AmbientLight
  sky: Mesh
  hotspots: Group
}

export const NUM_CONTROLLERS = 2
export const REF_WORLD_SIZE = 100
export const TAR_WORLD_SIZE = 10
