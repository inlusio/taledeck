import type { AmbientLight, Mesh, Object3D, PerspectiveCamera, Scene } from 'three'

export interface SceneObjects {
  scene: Scene
  camera: PerspectiveCamera
  light: AmbientLight
  sky: Mesh
  hotspots: Object3D
}
