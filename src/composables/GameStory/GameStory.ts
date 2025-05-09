import useEnv from '@/composables/Env/Env'
import type { TaleDeckAudioOverview, TaleDeckSceneOverview, TaleDeckStory } from '@/models/TaleDeck/TaleDeck'
import { useGameDataStore } from '@/stores/GameData'
import { storeToRefs } from 'pinia'
import { computed, type ComputedRef, type Ref } from 'vue'

export default function useGameStory() {
  const { viteTaledeckLegacyStorySlugs } = useEnv()
  const gameDataStore = useGameDataStore()
  const { error, audioOverviewList, sceneOverviewList, storyEntry, returnSceneId } = storeToRefs(gameDataStore)

  const isLegacyStory = computed(() => {
    return viteTaledeckLegacyStorySlugs.includes(storyEntry.value?.story_slug ?? '')
  })

  const resetStory = () => {
    returnSceneId.value = 0
  }

  return {
    error,
    story: storyEntry as Ref<TaleDeckStory | null>,
    sceneOverviewList: sceneOverviewList as Ref<Array<TaleDeckSceneOverview> | null>,
    audioOverviewList: audioOverviewList as Ref<Array<TaleDeckAudioOverview> | null>,
    returnSceneId: returnSceneId as Ref<number>,
    isLegacyStory: isLegacyStory as ComputedRef<boolean>,
    resetStory,
  }
}
