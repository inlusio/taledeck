import { watch } from 'vue'
import { useToggle } from '@vueuse/core'
import { useAudioStore } from '@/stores/Audio'
import { storeToRefs } from 'pinia'
import useGameStory from '@/composables/GameStory/GameStory'

export default function useAudioController() {
  const audioStore = useAudioStore()
  const { load, reset } = audioStore
  const { allowAudio, audioChannels, audioFiles, audioContentLoaded } = storeToRefs(audioStore)

  const toggleAllowAudio = useToggle(allowAudio)
  const { audioOverviewList } = useGameStory()

  watch(
    () => audioOverviewList.value,
    (nV) => {
      if (Object.keys(nV).length > 0) {
        load().then(() => {
          audioContentLoaded.value = true
        })
      }
    },
    { deep: true, immediate: true },
  )

  return {
    allowAudio,
    audioContentLoaded,
    audioChannels,
    audioFiles,
    toggleAllowAudio,
    reset,
  }
}
