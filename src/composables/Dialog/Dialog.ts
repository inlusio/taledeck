import useDialogRunner from '@/composables/DialogRunner/DialogRunner'
import type { Dialog } from '@/models/Dialog/Dialog'
import { reactive, watch } from 'vue'
import useGameScene from '@/composables/GameScene/GameScene'
import { useDialogMainStore } from '@/stores/DialogMain'
import { storeToRefs } from 'pinia'
import { useDialogVariablesStore } from '@/stores/DialogVariables'
import { useDialogHotspotsStore } from '@/stores/DialogHotspots'
import type { TaleDeckScene } from '@/models/TaleDeck/TaleDeck'

export default function useDialog() {
  const dialogMainStore = useDialogMainStore()
  const dialogVariablesStore = useDialogVariablesStore()
  const dialogHotspotsStore = useDialogHotspotsStore()

  const { reset: resetDialog } = dialogMainStore
  const { reset: resetDialogVariables, storage } = dialogVariablesStore
  const { reset: resetDialogHotspots } = dialogHotspotsStore

  const { hasStarted } = storeToRefs(dialogMainStore)
  const { variables } = storeToRefs(dialogVariablesStore)
  const { hotspots } = storeToRefs(dialogHotspotsStore)

  const { scene } = useGameScene()

  const dialog = reactive<Dialog>({
    hotspots,
    isReady: false,
    sceneSlug: undefined,
    runner: null,
    hasStarted,
    variables,
  })

  const { createRunner } = useDialogRunner(dialog)

  const createDialog = ({ scene_slug, script }: TaleDeckScene) => {
    dialog.hotspots = []
    dialog.sceneSlug = scene_slug
    dialog.isReady = true
    dialog.hasStarted = true
    dialog.runner = createRunner(dialog, storage, script)

    return dialog
  }

  const reset = () => {
    resetDialog()
    resetDialogVariables()
    resetDialogHotspots()
  }

  watch(
    scene,
    () => {
      dialog.isReady = false

      if (!scene.value?.script) {
        return
      }

      createDialog(scene.value)
    },
    { immediate: true },
  )

  return {
    dialog,
    createDialog,
    reset,
  }
}
