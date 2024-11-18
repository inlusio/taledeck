import type { AmbientLight, Group, Mesh, Object3D, PerspectiveCamera, Scene } from 'three'
import ThreeMeshUI from 'three-mesh-ui'

export interface SceneDialogBox {
  cameraTarget: Object3D
  box: ThreeMeshUI.Block
  characterText: ThreeMeshUI.Text
  dialogText: ThreeMeshUI.Text
}

export interface SceneObjects {
  scene: Scene
  camera: PerspectiveCamera
  viewer: Group
  light: AmbientLight
  sky: Mesh
  model: Group
  hotspots: Group
  dialog: SceneDialogBox
}

export const NUM_CONTROLLERS = 2
export const TAR_WORLD_SIZE = 1e5
export const SCALE = 0.1
