import type { TaleDeckAudioOverview, TaleDeckSceneOverview, TaleDeckStory } from '@/models/TaleDeck/TaleDeck'
import { useGameDataStore } from '@/stores/GameData'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'

export default function useGameStory() {
  const gameDataStore = useGameDataStore()
  const { audioOverviewList, sceneOverviewList, storyEntry, returnSceneId } = storeToRefs(gameDataStore)

  const resetStory = () => {
    returnSceneId.value = 0
  }

  return {
    story: storyEntry as Ref<TaleDeckStory | null>,
    sceneOverviewList: sceneOverviewList as Ref<Array<TaleDeckSceneOverview>>,
    audioOverviewList: audioOverviewList as Ref<Array<TaleDeckAudioOverview>>,
    returnSceneId: returnSceneId as Ref<number>,
    resetStory,
  }
}
