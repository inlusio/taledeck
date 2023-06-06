import { useDialogHotspotsStore } from '@/stores/DialogHotspots'
import { storeToRefs } from 'pinia'

export function useDialogHotspot() {
  const dialogHotspotsStore = useDialogHotspotsStore()
  const { hotspots, hotspotsVisibility } = storeToRefs(dialogHotspotsStore)

  const setHotspotShown = (id: string, flag: boolean) => {
    hotspotsVisibility.value[id] = flag
  }

  const isHotspotShown = (id: string): boolean | undefined => {
    const result = hotspotsVisibility.value[id]
    return typeof result === 'boolean' ? result : undefined
  }

  return {
    hotspots,
    setHotspotShown,
    isHotspotShown,
  }
}
