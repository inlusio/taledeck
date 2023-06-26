<script lang="ts" setup>
  import useDialog from '@/composables/Dialog/Dialog'
  import { useRouter } from 'vue-router'
  import useRouteRecord from '@/composables/RouteRecord/RouteRecord'
  import { RouteRecordId } from '@/models/RouteRecord/RouteRecord'
  import useAudioController from '@/composables/AudioController/AudioController'
  import { computed, ref, watch } from 'vue'
  import type { CSSProperties } from 'vue'
  import DotLoader from '@/components/DotLoader/DotLoader.vue'
  import useGameStory from '@/composables/GameStory/GameStory'
  import useTranslation from '@/composables/Translation/Translation'
  import useTaleDeckApi from '@/composables/TaleDeckApi/TaleDeckApi'
  import type { TaleDeckSceneOverview } from '@/models/TaleDeck/TaleDeck'

  const router = useRouter()
  const { t } = useTranslation()
  const { toRoute } = useRouteRecord()
  const { dialog, reset: resetDialog } = useDialog()
  const { reset: resetAudio } = useAudioController()
  const { story, sceneOverviewList } = useGameStory()
  const { getFileEntry } = useTaleDeckApi()

  const isLoaded = ref<boolean>(false)
  const startScene = ref<TaleDeckSceneOverview>({ id: -1, scene_slug: 'intro' })
  const returnScene = ref<TaleDeckSceneOverview>({ id: -1, scene_slug: 'map' })

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
        const returnSceneEntry = sceneOverviewList.value.find(({ id }) => id === story.value?.tj_return_scene_id)

        startScene.value = startSceneEntry || startScene.value
        returnScene.value = returnSceneEntry || returnScene.value

        isLoaded.value = true
      }
    },
    { immediate: true },
  )

  const onReset = () => {
    resetDialog()
    resetAudio()

    router.push(
      toRoute({
        name: RouteRecordId.Scene,
        params: { scene: startScene.value.scene_slug },
      }),
    )
  }
</script>

<template>
  <main class="p-page-story s-layout-content" :style="rootStyles">
    <div class="s-layout-content__main">
      <div class="s-container s-container--primary">
        <div class="s-container__container p-page-story__main">
          <div class="p-page-story__content u-typography-root">
            <div class="p-page-story__top" v-if="isLoaded">
              <h1 class="p-page-story__title">
                {{ story?.story_title }}
              </h1>
              <span class="p-page-story__subtitle">
                {{ story?.story_tagline }}
              </span>
            </div>
            <div class="p-page-story__details">
              <!-- <pre style="font-size: 1rem" v-text="story" /> -->
              <div class="p-page-story__actions" v-if="isLoaded">
                <template v-if="dialog.hasStarted">
                  <RouterLink
                    class="u-reset btn btn--medium btn--highlight"
                    :to="{ name: 'scene', params: { scene: returnScene?.scene_slug } }"
                  >
                    Story fortsetzen
                  </RouterLink>
                  <button @click="onReset" class="u-reset btn btn--medium btn--highlight">Story neustarten</button>
                </template>
                <template v-else>
                  <RouterLink
                    class="u-reset btn btn--medium btn--highlight"
                    :to="{ name: 'scene', params: { scene: startScene?.scene_slug } }"
                  >
                    Story starten
                  </RouterLink>
                </template>
              </div>
              <div class="p-page-story__loading" v-if="!isLoaded">
                <b>
                  {{ t('general.loading') }}
                </b>
                <button @click="onReset" class="u-reset btn btn--medium btn--highlight" disabled>
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

<style scoped lang="scss">
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
    display: block;
    margin-bottom: 40px;
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
