import type { AmbientLight, Group, Mesh, PerspectiveCamera, Scene } from 'three'

export interface SceneObjects {
  scene: Scene
  camera: PerspectiveCamera
  cameraroot: Group
  light: AmbientLight
  sky: Mesh
  hotspots: Group
}
