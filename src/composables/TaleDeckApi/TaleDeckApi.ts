import { Directus } from '@directus/sdk'
import type { ManyItems } from '@directus/sdk'
import type { TaleDeckAudioOverview, TaleDeckCollections } from '@/models/TaleDeck/TaleDeck'
import type { TaleDeckSceneOverview } from '@/models/TaleDeck/TaleDeck'

const directus = new Directus<TaleDeckCollections>(import.meta.env.VITE_TALE_DECK_API_BASE_URL)

/**
 * Get a TaleDeck AUDIO entry by id
 */
async function getAudioEntry(tjId: number) {
  return await directus.items('tj_audio').readOne(tjId)
}

/**
 * Get all TaleDeck AUDIO entries of a certain STORY
 */
async function getAudioList(tjIds: Array<number>, storyId: number): Promise<ManyItems<TaleDeckAudioOverview>> {
  if (tjIds.length === 0) {
    return { data: [] } as ManyItems<TaleDeckAudioOverview>
  }

  return await directus.items('tj_audio').readByQuery({
    filter: { id: { _in: tjIds }, tj_story_id: { _eq: storyId } },
    fields: ['id', 'audio_file', 'audio_slug'],
  })
}

/**
 * Get a TaleDeck FILE entry by id
 */
function getFileEntry(tjFileId: string): string {
  return `${import.meta.env.VITE_TALE_DECK_API_BASE_URL}assets/${tjFileId}`
}

/**
 * Get a TaleDeck STORY entry by id
 */
async function getStoryEntry(tjId: number) {
  return await directus.items('tj_stories').readOne(tjId)
}

/**
 * Get a TaleDeck STORY entry by slug
 */
async function getStoryEntryBySlug(slug: string) {
  return await directus.items('tj_stories').readByQuery({
    filter: { story_slug: { _eq: slug } },
    limit: 1,
  })
}

/**
 * Get all TaleDeck STORY entries
 */
async function getStoryList() {
  return await directus.items('tj_stories').readByQuery({
    filter: {},
    fields: ['id'],
  })
}

/**
 * Get a TaleDeck SCENE entry by id
 */
async function getSceneEntry(tjId: number) {
  return await directus.items('tj_scenes').readOne(tjId)
}

/**
 * Get a TaleDeck SCENE entry of a certain STORY by slug
 */
async function getSceneEntryBySlug(slug: string, storyId: number) {
  return await directus.items('tj_scenes').readByQuery({
    filter: { scene_slug: { _eq: slug }, tj_story_id: { _eq: storyId } },
    limit: 1,
  })
}

/**
 * Get all TaleDeck SCENE entries of a certain STORY
 */
async function getSceneList(tjIds: Array<number>, storyId: number): Promise<ManyItems<TaleDeckSceneOverview>> {
  if (tjIds.length === 0) {
    return { data: [] } as ManyItems<TaleDeckSceneOverview>
  }

  return await directus.items('tj_scenes').readByQuery({
    filter: { id: { _in: tjIds }, tj_story_id: { _eq: storyId } },
    fields: ['id', 'scene_slug'],
  })
}

export default function useTaleDeckApi() {
  return {
    getAudioEntry,
    getAudioList,
    getFileEntry,
    getStoryEntry,
    getStoryEntryBySlug,
    getStoryList,
    getSceneEntry,
    getSceneEntryBySlug,
    getSceneList,
  }
}
