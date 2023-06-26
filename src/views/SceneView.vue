<script lang="ts" setup>
  import useGameScene from '@/composables/GameScene/GameScene'
  import { ViewShellFacet } from '@/components/ViewShell/ViewShellFacet'
  import DialogBox from '@/components/DialogBox/DialogBox.vue'
  import useDialog from '@/composables/Dialog/Dialog'
  import useDebug from '@/composables/Debug/Debug'
  import ImageMapTooltip from '@/components/ImageMapTooltip/ImageMapTooltip.vue'
  import ResponsiveShell from '@/components/ResponsiveShell/ResponsiveShell.vue'
  import type { DialogHotspot } from '@/models/DialogHotspot/DialogHotspot'
  import useDialogCommand from '@/composables/DialogCommand/DialogCommand'
  import useTranslation from '@/composables/Translation/Translation'
  import MainActionsNav from '@/components/MainActionsNav/MainActionsNav.vue'
  import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
  import useSceneTransition from '@/composables/SceneTransition/SceneTransition'
  import DebugPanel from '@/components/DebugPanel/DebugPanel.vue'
  import useAudioController from '@/composables/AudioController/AudioController'
  import type { AudioChannelEntry } from '@/models/AudioChannel/AudioChannel'
  import AudioChannel from '@/components/AudioChannel/AudioChannel.vue'
  import useTaleDeckApi from '@/composables/TaleDeckApi/TaleDeckApi'
  import { computed, defineAsyncComponent } from 'vue'
  import useGameStory from '@/composables/GameStory/GameStory'
  import { TaleDeckStoryType } from '@/models/TaleDeck/TaleDeck'

  const { getFileEntry } = useTaleDeckApi()
  const { hotspots } = useDialogHotspot()

  const { t } = useTranslation()
  const { story } = useGameStory()
  const { scene, sceneSlug } = useGameScene()
  const { dialog } = useDialog()
  const { isDebug } = useDebug()
  const { handleCommand } = useDialogCommand(dialog)
  const { isHotspotShown } = useDialogHotspot()
  const { transitionName, transitionMode } = useSceneTransition()

  const { audioChannels } = useAudioController()

  const viewShellType = computed<string>(() => {
    switch (story.value?.story_type) {
      case TaleDeckStoryType.Planar:
        return 'ViewShellPlanar'
      case TaleDeckStoryType.Spherical:
        if (scene.value && scene.value['360active']) {
          return 'ViewShellSpherical'
        }

        return 'ViewShellPlanar'
      default:
        throw new Error('Unknown story type!')
    }
  })

  const viewShellComponent = computed(() => {
    return defineAsyncComponent(() => import(`../components/ViewShell/${viewShellType.value}.vue`))
  })

  const getChannelKey = (channel: AudioChannelEntry) => {
    return `${channel.label}::${channel.behaviour}`
  }

  const onActionRequested = (hotspot: DialogHotspot) => {
    hotspot.commandData.forEach((command) => handleCommand(command))
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
                <ResponsiveShell
                  :outer-height="height"
                  :outer-width="width"
                  class="p-page-scene__responsive-shell u-typography-root"
                >
                  <ul class="u-reset p-page-scene__image-tooltip-list">
                    <li v-for="hotspot in hotspots" :key="hotspot.label" class="p-page-scene__image-tooltip-entry">
                      <Transition appear name="trs-simple-fade">
                        <ImageMapTooltip
                          v-if="isHotspotShown(hotspot.label)"
                          :height="height"
                          :hotspot="hotspot"
                          :width="width"
                          @action="onActionRequested(hotspot)"
                        >
                          <template #default="{ label }">
                            {{ t(label) }}
                          </template>
                        </ImageMapTooltip>
                      </Transition>
                    </li>
                  </ul>
                </ResponsiveShell>
                <div v-if="isDebug" class="s-container s-container--full-width">
                  <div class="s-container__container">
                    <span>scene: {{ sceneSlug }}</span>
                    <br />
                    <details>
                      <summary>Raw content</summary>
                      <pre>{{ scene }}</pre>
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

  .p-page-scene__responsive-shell {
    @include utils.overlay;
    pointer-events: none;
  }

  .p-page-scene__main-actions-nav {
    z-index: 10;
    position: fixed;
    top: 12px;
    right: 12px;
  }
</style>
