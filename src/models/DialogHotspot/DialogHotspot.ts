import type { DialogResultCommandData } from '@/models/DialogResult/DialogResult'
import type { Vector2 } from 'three'

export type DialogHotspotVisibilityStorage = Record<string, boolean>

export interface DialogHotspot {
  x: number
  y: number
  z?: number
  label: string
  gazeDuration?: number
  onClick?: Array<DialogResultCommandData>
  onGazeLong?: Array<DialogResultCommandData>
}

export interface DialogHotspotLocation {
  hotspot: DialogHotspot
  coords: Vector2
}
