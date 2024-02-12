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

  const ViewShellPlanar = defineAsyncComponent(() => import('../components/ViewShell/ViewShellPlanar.vue'))
  const ViewShellSpherical = defineAsyncComponent(() => import('../components/ViewShell/ViewShellSpherical.vue'))

  const { getFileEntry } = useTaleDeckApi()

  const { story } = useGameStory()
  const { scene, sceneSlug } = useGameScene()
  const { dialog } = useDialog()
  const { isDebug } = useDebug()
  const { transitionName, transitionMode } = useSceneTransition()

  const { audioChannels } = useAudioController()

  const isImmersiveMode = computed<boolean>(() => {
    const isSpherical = story.value?.story_type === TaleDeckStoryType.Spherical
    const isImmersive = scene.value != null && scene.value?.immersive_active
    return isSpherical && isImmersive
  })

  const viewShellComponent = computed(() => {
    return isImmersiveMode.value ? ViewShellSpherical : ViewShellPlanar
  })

  const viewShellKey = computed<string>(() => {
    return isImmersiveMode.value ? 'mode:spherical' : `mode:planar::scene:${sceneSlug.value}`
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
          <div v-if="scene" :key="viewShellKey" :data-key="viewShellKey" class="s-layout-game__viewer-frame">
            <component
              :is="viewShellComponent"
              v-if="dialog.isReady"
              :background="getFileEntry(scene.scene_image)"
              :dialog="dialog"
              :facets="[ViewShellFacet.Scene]"
              :height="900"
              :model="scene.scene_model ? getFileEntry(scene.scene_model) : undefined"
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
