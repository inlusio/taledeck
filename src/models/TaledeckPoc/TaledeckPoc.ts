import type { TaleDeckScene } from '@/models/TaleDeck/TaleDeck'

export interface TaledeckPocSceneListRequest {
  storySlug?: string
  sceneSlug?: string
}

export interface TaledeckPocSceneListResponse {
  data: Array<TaleDeckScene>
}
