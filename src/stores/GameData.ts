import usePersistentStorage from '@/composables/PersistentStorage/PersistentStorage'
import useRouteRecord from '@/composables/RouteRecord/RouteRecord'
import useTaleDeckApi from '@/composables/TaleDeckApi/TaleDeckApi'
import { StoreId } from '@/models/Store'
import type {
  TaleDeckAudioOverview,
  TaleDeckScene,
  TaleDeckSceneOverview,
  TaleDeckStory,
} from '@/models/TaleDeck/TaleDeck'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useGameDataStore = defineStore(StoreId.GameData, () => {
  const { storyParam, sceneParam } = useRouteRecord()
  const { getAudioList, getSceneList, getStoryEntryBySlug, getSceneEntryBySlug } = useTaleDeckApi()
  const { persistentRef } = usePersistentStorage(StoreId.GameData)

  const error = ref<string | null>(null)
  const storyEntry = ref<TaleDeckStory | null>(null)
  const sceneOverviewList = ref<Array<TaleDeckSceneOverview> | null>(null)
  const sceneEntry = ref<TaleDeckScene | null>(null)
  const audioOverviewList = ref<Array<TaleDeckAudioOverview> | null>(null)

  const returnSceneId = persistentRef<number>('returnSceneId', 0)

  // With persistent ref
  // const storyEntry = persistentRef<TaleDeckStory | null>('storyEntry', null, { customSerializerId: CustomSerializerId.Object })
  // const sceneOverviewList = persistentRef<Array<TaleDeckSceneOverview>>('sceneOverviewList', [], { customSerializerId: CustomSerializerId.Object })

  watch(
    () => storyEntry.value,
    async () => {
      if (storyEntry.value == null) {
        return
      }

      const { id, tj_scenes, tj_audio } = storyEntry.value
      const [r1, r2] = await Promise.all([getSceneList(tj_scenes, id), getAudioList(tj_audio, id)])

      sceneOverviewList.value = r1.data as Array<TaleDeckSceneOverview>
      audioOverviewList.value = r2.data as Array<TaleDeckAudioOverview>

      if (storyEntry.value.tj_return_scene_id != null) {
        returnSceneId.value = storyEntry.value?.tj_return_scene_id
      }
    },
    { immediate: true },
  )

  watch(
    storyParam,
    async () => {
      error.value = null

      if (storyParam.value == null) {
        storyEntry.value = null
        return
      }

      try {
        const { data } = await getStoryEntryBySlug(storyParam.value)

        if (Array.isArray(data) && data.length > 0) {
          storyEntry.value = data[0] as TaleDeckStory
        } else {
          throw new Error(`No data found for story slug "${storyParam.value}"!`)
        }
      } catch (e) {
        storyEntry.value = null
        error.value = e as unknown as string
        console.error(e)
      }
    },
    { immediate: true },
  )

  watch(
    () => [sceneParam.value, storyEntry.value],
    async () => {
      if (sceneParam.value != null && storyEntry.value != null) {
        const { data } = await getSceneEntryBySlug(sceneParam.value, storyEntry.value.id, storyEntry.value.story_slug)

        if (Array.isArray(data) && data.length > 0) {
          sceneEntry.value = data[0] as TaleDeckScene

          if (storyEntry.value.tj_return_scene_id == null) {
            returnSceneId.value = sceneEntry.value.id
          }
        } else {
          // TODO: Handle no entries error
          sceneEntry.value = null
        }
      } else {
        sceneEntry.value = null
      }
    },
    { immediate: true },
  )

  return {
    error,
    storyEntry,
    sceneOverviewList,
    sceneEntry,
    audioOverviewList,
    returnSceneId,
  }
})
