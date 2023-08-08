import useDialogCommand from '@/composables/DialogCommand/DialogCommand'
import type { ReactiveDialog } from '@/models/Dialog/Dialog'
import type { DialogVariableStorageHandler } from '@/models/DialogVariable/DialogVariable'
import { ref } from 'vue'
import type { YarnBoundOptions } from 'yarn-bound/src'
import YarnBound from 'yarn-bound/src'

export default function useDialogRunner(dialog: ReactiveDialog) {
  const { handleCommand } = useDialogCommand(dialog)

  const runner = ref<YarnBound | null>(null)

  const createRunner = (storage: DialogVariableStorageHandler, code: string) => {
    runner.value = new YarnBound({
      dialogue: code,
      variableStorage: storage,
      handleCommand,
    } as YarnBoundOptions)

    return runner.value
  }

  return {
    runner,
    createRunner,
  }
}
