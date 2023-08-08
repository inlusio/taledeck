import type { DialogHotspot } from '@/models/DialogHotspot/DialogHotspot'
import type { DialogVariableStorage } from '@/models/DialogVariable/DialogVariable'
import type { Ref, UnwrapNestedRefs } from 'vue'
import YarnBound from 'yarn-bound/src'

export interface Dialog {
  hotspots: Ref<Array<DialogHotspot>>
  isReady: boolean
  sceneSlug: string | undefined
  runner: YarnBound | null
  hasStarted: Ref<boolean>
  variables: Ref<DialogVariableStorage>
}

export type ReactiveDialog = UnwrapNestedRefs<Dialog>
