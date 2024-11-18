<script lang="ts" setup>
  import DotLoader from '@/components/DotLoader/DotLoader.vue'
  import useAudioController from '@/composables/AudioController/AudioController'
  import useDialog from '@/composables/Dialog/Dialog'
  import useGameStory from '@/composables/GameStory/GameStory'
  import useRouteRecord from '@/composables/RouteRecord/RouteRecord'
  import useTaleDeckApi from '@/composables/TaleDeckApi/TaleDeckApi'
  import useTranslation from '@/composables/Translation/Translation'
  import { RouteRecordId } from '@/models/RouteRecord/RouteRecord'
  import type { TaleDeckSceneOverview } from '@/models/TaleDeck/TaleDeck'
  import type { CSSProperties } from 'vue'
  import { computed, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'

  const i18n: Record<string, string> = {
    story_continue_text: 'Story fortsetzen',
    story_start_text: 'Story starten',
    story_restart_text: 'Story neustarten',
  }

  const router = useRouter()
  const { t } = useTranslation()
  const { toRoute } = useRouteRecord()
  const { dialog, reset: resetDialog } = useDialog()
  const { reset: resetAudio } = useAudioController()
  const { story, sceneOverviewList, returnSceneId, resetStory } = useGameStory()
  const { getFileEntry } = useTaleDeckApi()

  const isLoaded = ref<boolean>(false)
  const startScene = ref<TaleDeckSceneOverview | null>(null)
  const returnScene = ref<TaleDeckSceneOverview | null>(null)

  const rootStyles = computed<CSSProperties>(() => {
    const img = story.value?.story_image
    const url = img == null ? undefined : getFileEntry(img)

    return {
      'background-image': url == null ? undefined : `url(${url})`,
    }
  })

  watch(
    () => [story.value, sceneOverviewList.value],
    async () => {
      if (story.value != null && sceneOverviewList.value.length > 0) {
        const startSceneEntry = sceneOverviewList.value.find(({ id }) => id === story.value?.tj_start_scene_id)
        const returnSceneEntry = sceneOverviewList.value.find(({ id }) => id === returnSceneId.value)

        startScene.value = startSceneEntry ?? startScene.value
        returnScene.value = returnSceneEntry ?? returnScene.value

        isLoaded.value = true
      }
    },
    { immediate: true },
  )

  const onReset = () => {
    resetStory()
    resetDialog()
    resetAudio()

    if (startScene.value) {
      router.push(
        toRoute({
          name: RouteRecordId.Scene,
          params: { scene: startScene.value.scene_slug },
        }),
      )
    }
  }
</script>

<template>
  <main :style="rootStyles" class="p-page-story s-layout-content">
    <div class="s-layout-content__main">
      <div class="s-container s-container--primary">
        <div class="s-container__container p-page-story__main">
          <div class="p-page-story__content u-typography-root">
            <div v-if="isLoaded" class="p-page-story__top">
              <h1 class="p-page-story__title">
                {{ story?.story_title }}
              </h1>
              <span class="p-page-story__subtitle">
                {{ story?.story_tagline }}
              </span>
            </div>
            <div class="p-page-story__details">
              <!-- <pre style="font-size: 1rem" v-text="story" /> -->
              <div v-if="isLoaded" class="p-page-story__actions">
                <template v-if="dialog.hasStarted">
                  <template v-if="returnScene">
                    <RouterLink
                      :to="{ name: 'scene', params: { scene: returnScene?.scene_slug } }"
                      class="u-reset btn btn--medium btn--highlight"
                    >
                      {{ i18n.story_continue_text }}
                    </RouterLink>
                  </template>
                  <template v-else>
                    <button class="u-reset btn btn--medium btn--highlight" disabled>
                      {{ i18n.story_continue_text }}
                    </button>
                  </template>

                  <button class="u-reset btn btn--medium btn--highlight" @click="onReset">
                    {{ i18n.story_restart_text }}
                  </button>
                </template>
                <template v-else>
                  <template v-if="startScene">
                    <RouterLink
                      :to="{ name: 'scene', params: { scene: startScene?.scene_slug } }"
                      class="u-reset btn btn--medium btn--highlight"
                    >
                      {{ i18n.story_start_text }}
                    </RouterLink>
                  </template>
                  <template v-else>
                    <button class="u-reset btn btn--medium btn--highlight" disabled>
                      {{ i18n.story_start_text }}
                    </button>
                  </template>
                </template>
              </div>
              <div v-if="!isLoaded" class="p-page-story__loading">
                <b>
                  {{ t('general.loading') }}
                </b>
                <button class="u-reset btn btn--medium btn--highlight" disabled @click="onReset">
                  <DotLoader :facets="['dark']" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
  @use '@/assets/scss/util/color/color' as col;
  @use '@/assets/scss/base/typography/typography' as type;

  .p-page-story {
    background-size: cover;
    background-position: center center;
    background-color: col.$monochrome-magnet;

    background-blend-mode: multiply;
  }

  .p-page-story__main {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: stretch;
  }

  .p-page-story__title {
    margin-bottom: 4px;
  }

  .p-page-story__subtitle {
    @include type.h2;

    & {
      display: block;
      margin-bottom: 40px;
    }
  }

  .p-page-story__intro {
    max-width: 600px;
    margin-bottom: 32px;
    color: col.$monochrome-white;
  }

  .p-page-story__details {
    display: flex;
    flex-flow: column nowrap;
    gap: 32px;
  }

  .p-page-story__actions {
    display: flex;
    flex-flow: row nowrap;
    gap: 12px;
  }

  .p-page-story__loading {
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    gap: 12px;
  }
</style>
