import type { DialogResultCommandData } from '@/models/DialogResult/DialogResult'

export type DialogHotspotVisibilityStorage = Record<string, boolean>

export interface DialogHotspot {
  x: number
  y: number
  z?: number
  label: string
  commandData: Array<DialogResultCommandData>
}
