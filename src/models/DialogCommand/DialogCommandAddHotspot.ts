import type arg from 'arg'

export interface DialogCommandSpecAddHotspot extends arg.Spec {
  '--x': arg.Handler<number>
  '--y': arg.Handler<number>
  '--z': arg.Handler<number>
  '--phi': arg.Handler<number>
  '--theta': arg.Handler<number>
  '--radius': arg.Handler<number>
  '--gaze-duration': arg.Handler<number>
  '--click': [arg.Handler<string>]
  '--gaze-long': [arg.Handler<string>]
}

export type DialogCommandResultAddHotspot = arg.Result<DialogCommandSpecAddHotspot> & {
  x?: number
  y?: number
  z?: number
  phi?: number
  theta?: number
  radius?: number
  gazeDuration?: number
  click?: Array<string>
  gazeLong?: Array<string>
}

export const dialogCommandSpecAddHotspot: arg.Spec = {
  '--x': Number,
  '--y': Number,
  '--z': Number,
  '--phi': Number,
  '--theta': Number,
  '--radius': Number,
  '--gaze-duration': Number,
  '--click': [String],
  '--gaze-long': [String],
  '-x': '--x',
  '-y': '--y',
  '-z': '--z',
  '-p': '--phi',
  '-t': '--theta',
  '-r': '--radius',
}
