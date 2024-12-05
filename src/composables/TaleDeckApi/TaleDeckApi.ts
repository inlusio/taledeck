import useEnv from '@/composables/Env/Env'
import type { TaleDeckAudioOverview, TaleDeckCollections, TaleDeckSceneOverview } from '@/models/TaleDeck/TaleDeck'
import type { TaledeckPocSceneListResponse } from '@/models/TaledeckPoc/TaledeckPoc'
import type { ManyItems } from '@directus/sdk'
import { Directus } from '@directus/sdk'
import { join } from 'node:path'

const { viteTaledeckPocApiBaseUrl, viteTaledeckPocApiStorySlugs } = useEnv()
const directus = new Directus<TaleDeckCollections>(import.meta.env.VITE_TALE_DECK_API_BASE_URL)
const getTaledeckPocApiUrl = (endpoint: string) => new URL(join('/api', endpoint), viteTaledeckPocApiBaseUrl)

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
function getFileEntry(tjFileId?: string): string | undefined {
  return tjFileId ? `${import.meta.env.VITE_TALE_DECK_API_BASE_URL}assets/${tjFileId}` : undefined
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
async function getSceneEntryBySlug(slug: string, storyId: number, storySlug: string) {
  // New Taledeck PoC Handler:
  if (viteTaledeckPocApiStorySlugs.includes(storySlug)) {
    try {
      const response = await fetch(getTaledeckPocApiUrl('/scene'), {
        method: 'POST',
        body: JSON.stringify({
          storySlug,
          sceneSlug: slug,
        }),
      })

      if (!response.ok) {
        throw new Error(`${response.status}: Failed to load story!`)
      }

      const result = (await response.json()) as TaledeckPocSceneListResponse

      if (result.data.length === 0) {
        throw new Error('Scene not found! Falling back to Directus API...')
      }

      return result
    } catch (error) {
      console.warn(error)
    }
  }

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

/**
 * Get all TaleDeck TRANSLATION entries
 */
async function getTranslationList() {
  return await directus.items('tj_translations').readByQuery({
    filter: {},
    fields: ['id', 'slug', 'items'],
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
    getTranslationList,
  }
}
