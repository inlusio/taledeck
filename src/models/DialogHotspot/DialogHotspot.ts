import type { DialogResultCommandData } from '@/models/DialogResult/DialogResult'

export type DialogHotspotVisibilityStorage = Record<string, boolean>

export interface DialogHotspot {
  x?: number
  y?: number
  z?: number
  phi?: number
  theta?: number
  radius?: number
  label: string
  gazeDuration?: number
  onClick?: Array<DialogResultCommandData>
  onGazeLong?: Array<DialogResultCommandData>
}
