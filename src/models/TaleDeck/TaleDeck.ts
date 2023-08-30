import type { TranslationFile } from '@/models/Translation/Translation'

export enum TaleDeckStoryType {
  Planar = 'Planar',
  Spherical = 'Spherical',
}

export interface TaleDeckCollection {
  id: number
  status: string
  sort: null | unknown
  user_created: string
  date_created: string
  user_updated: string
  date_updated: string
}

export type TaleDeckCollections = {
  tj_stories: TaleDeckStory
  tj_scenes: TaleDeckScene
  tj_audio: TaleDeckAudio
  tj_translations: TaleDeckTranslation
}

export interface TaleDeckStory extends TaleDeckCollection {
  story_image: null | string
  story_name: string
  story_tagline: string
  story_slug: string
  story_title: string
  story_type: TaleDeckStoryType
  tj_start_scene_id: number
  tj_return_scene_id: number
  tj_scenes: Array<number>
  tj_audio: Array<number>
}

export interface TaleDeckScene extends TaleDeckCollection {
  scene_image: string
  scene_name: string
  scene_slug: string
  script: string
  tj_story_id: number
  tj_audio: Array<number>
  immersive_active: boolean
  look_at_phi: number
}

export interface TaleDeckAudio extends TaleDeckCollection {
  audio_file: string
  audio_slug: string
  tj_story_id: number
}

export interface TaleDeckTranslation extends TaleDeckCollection, TranslationFile {}

export type TaleDeckSceneOverview = Pick<TaleDeckScene, 'id' | 'scene_slug'>
export type TaleDeckAudioOverview = Pick<TaleDeckAudio, 'id' | 'audio_file' | 'audio_slug'>
