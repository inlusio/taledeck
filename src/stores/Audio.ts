import useGameStory from '@/composables/GameStory/GameStory'
import usePersistentStorage from '@/composables/PersistentStorage/PersistentStorage'
import useTaleDeckApi from '@/composables/TaleDeckApi/TaleDeckApi'
import type { AudioChannelDict } from '@/models/AudioChannel/AudioChannel'
import type { AudioFileContentDict } from '@/models/AudioFile/AudioFile'
import { StoreId } from '@/models/Store'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAudioStore = defineStore(StoreId.Audio, () => {
  const { persistentRef } = usePersistentStorage(StoreId.Audio)
  const { audioOverviewList } = useGameStory()
  const { getFileEntry } = useTaleDeckApi()

  const allowAudio = persistentRef<boolean>('allowAudio', true)

  const audioChannels = ref<AudioChannelDict>({})
  const audioFiles = ref<AudioFileContentDict>({})

  const audioContentLoaded = ref<boolean>(false)

  const load = async () => {
    audioFiles.value = (audioOverviewList.value ?? []).reduce((acc, { audio_slug, audio_file }) => {
      acc[audio_slug] = { id: audio_slug, file: getFileEntry(audio_file) as string }
      return acc
    }, {} as AudioFileContentDict)
  }

  const reset = () => {
    allowAudio.value = true
    audioChannels.value = {}
  }

  return { allowAudio, audioChannels, audioFiles, audioContentLoaded, load, reset }
})
