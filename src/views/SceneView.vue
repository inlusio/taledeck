<script lang="ts" setup>
  import AudioChannel from '@/components/AudioChannel/AudioChannel.vue'
  import DebugPanel from '@/components/DebugPanel/DebugPanel.vue'
  import DialogBox from '@/components/DialogBox/DialogBox.vue'
  import MainActionsNav from '@/components/MainActionsNav/MainActionsNav.vue'
  import { ViewShellFacet } from '@/components/ViewShell/ViewShellFacet'
  import useAudioController from '@/composables/AudioController/AudioController'
  import useDebug from '@/composables/Debug/Debug'
  import useDialog from '@/composables/Dialog/Dialog'
  import useGameScene from '@/composables/GameScene/GameScene'
  import useGameStory from '@/composables/GameStory/GameStory'
  import useSceneTransition from '@/composables/SceneTransition/SceneTransition'
  import useTaleDeckApi from '@/composables/TaleDeckApi/TaleDeckApi'
  import type { AudioChannelEntry } from '@/models/AudioChannel/AudioChannel'
  import { TaleDeckStoryType } from '@/models/TaleDeck/TaleDeck'
  import { computed, defineAsyncComponent } from 'vue'

  const ViewShellPlanar = defineAsyncComponent(() => import(`../components/ViewShell/ViewShellPlanar.vue`))
  const ViewShellSpherical = defineAsyncComponent(() => import(`../components/ViewShell/ViewShellSpherical.vue`))

  const { getFileEntry } = useTaleDeckApi()

  const { story } = useGameStory()
  const { scene, sceneSlug } = useGameScene()
  const { dialog } = useDialog()
  const { isDebug } = useDebug()
  const { transitionName, transitionMode } = useSceneTransition()

  const { audioChannels } = useAudioController()

  const viewShellComponent = computed(() => {
    switch (story.value?.story_type) {
      case TaleDeckStoryType.Planar:
        return ViewShellPlanar
      case TaleDeckStoryType.Spherical:
        if (scene.value && scene.value?.immersive_active) {
          return ViewShellSpherical
        }

        return ViewShellPlanar
      default:
        throw new Error('Unknown story type!')
    }
  })

  const getChannelKey = (channel: AudioChannelEntry) => {
    return `${channel.label}::${channel.behaviour}`
  }
</script>

<template>
  <main class="p-page-scene s-layout-game s-layout-game--has-header">
    <AudioChannel
      v-for="channel in audioChannels"
      :key="getChannelKey(channel)"
      :channel="channel"
      :data-key="getChannelKey(channel)"
    />

    <MainActionsNav class="p-page-scene__main-actions-nav" />
    <div class="s-layout-game__main">
      <div class="s-layout-game__viewer">
        <Transition :mode="transitionMode" :name="transitionName">
          <div v-if="scene" :key="sceneSlug" class="s-layout-game__viewer-frame">
            <component
              :is="viewShellComponent"
              :key="sceneSlug"
              :background="getFileEntry(scene.scene_image)"
              :facets="[ViewShellFacet.Scene]"
              :height="900"
              :width="1600"
            >
              <template #debug>
                <DebugPanel v-if="isDebug" />
              </template>
              <template #content="{ width, height }">
                <div v-if="isDebug" class="s-container s-container--full-width">
                  <div class="s-container__container">
                    <span>scene: {{ sceneSlug }}</span>
                    <br />
                    <details>
                      <summary>Raw content</summary>
                      <pre>{{ scene }}</pre>
                      <pre>{{ width }} / {{ height }}</pre>
                    </details>
                  </div>
                </div>
              </template>
            </component>
          </div>
        </Transition>
      </div>
      <div class="s-layout-game__dialog-box">
        <DialogBox v-if="dialog.isReady" :key="dialog.sceneSlug" :runner="dialog.runner!" />
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
  @use '@nirazul/scss-utils' as utils;

  .p-page-scene {
    display: flex;
    flex-flow: column nowrap;
  }

  .p-page-scene__main-actions-nav {
    z-index: 10;
    position: fixed;
    top: 12px;
    right: 12px;
  }
</style>
