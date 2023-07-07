import type { Color, Object3D } from 'three'

export type ReticulumTarget = Object3D & { userData: UserData }

export interface ReticulumData {
  gazeable?: boolean
  reticleHoverColor?: Color
  clickCancelFuse?: boolean
  fuseColor?: number
  fuseDuration?: number
  fuseVisible?: boolean
  onGazeOver?: () => void
  onGazeOut?: () => void
  onGazeLong?: () => void
  onGazeClick?: () => void
}

export interface UserData {
  hitTime: number
  reticulum: ReticulumData
}

export interface ReticleAttributes {
  color?: number
  innerRadius?: number
  outerRadius?: number
}

export interface ReticleOptions extends ReticleAttributes {
  visible?: boolean
  vibrate?: number
  restPoint?: number
  ignoreInvisible?: boolean
  speed?: number
  hover?: ReticleAttributes
}

export interface FuseOptions extends ReticleAttributes {
  visible?: boolean
  vibrate?: number
  duration?: number
  clickCancel?: boolean
  hideAfterEnd?: boolean
}

export interface ReticulumOptions {
  proximity?: boolean
  clickEvents?: boolean
  lockDistance?: boolean
  near?: number | null
  far?: number | null
  reticle?: ReticleOptions
  fuse?: FuseOptions
}
