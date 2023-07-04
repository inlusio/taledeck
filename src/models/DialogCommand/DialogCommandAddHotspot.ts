import type arg from 'arg'

export interface DialogCommandSpecAddHotspot extends arg.Spec {
  '--x': arg.Handler<number>
  '--y': arg.Handler<number>
  '--z': arg.Handler<number>
  '--click': [arg.Handler<string>]
}

export type DialogCommandResultAddHotspot = arg.Result<DialogCommandSpecAddHotspot> & {
  x: number
  y: number
  z?: number
  click: Array<string>
}

export const dialogCommandSpecAddHotspot: arg.Spec = {
  '--x': Number,
  '--y': Number,
  '--z': Number,
  '--click': [String],
  '-x': '--x',
  '-y': '--y',
  '-z': '--z',
}
