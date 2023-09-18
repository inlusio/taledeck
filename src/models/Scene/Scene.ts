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
  hotspots: Group
  dialog: SceneDialogBox
}

export const NUM_CONTROLLERS = 2
export const REF_WORLD_SIZE = 100
export const TAR_WORLD_SIZE = 10
export const SCALE = TAR_WORLD_SIZE / REF_WORLD_SIZE
