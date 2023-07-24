<script lang="ts" setup>
  import ImageMapTooltip from '@/components/ImageMapTooltip/ImageMapTooltip.vue'
  import XrControls from '@/components/XrControls/XrControls.vue'
  import useBem from '@/composables/Bem/Bem'
  import type { UseBemProps } from '@/composables/Bem/BemFacetOptions'
  import useDialog from '@/composables/Dialog/Dialog'
  import useDialogCommand from '@/composables/DialogCommand/DialogCommand'
  import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
  import useGameScene from '@/composables/GameScene/GameScene'
  import useImmersiveSession from '@/composables/ImmersiveSession/ImmersiveSession'
  import useInlineScene from '@/composables/InlineScene/InlineScene'
  import useIsMounted from '@/composables/IsMounted/IsMounted'
  import useTranslation from '@/composables/Translation/Translation'
  import type { DialogHotspotLocation } from '@/models/DialogHotspot/DialogHotspot'
  import type { DialogResultCommandData } from '@/models/DialogResult/DialogResult'
  import { Texture, TextureLoader, Vector2 } from 'three'
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'

  const TL = new TextureLoader()

  interface Props extends UseBemProps {
    facets?: Array<string>
    background?: string
    width: number
    height: number
  }

  const props = withDefaults(defineProps<Props>(), {
    facets: () => [],
    background: '',
  })

  const hotspotDisplayDelay = 600
  const hotspotStaggerDelay = 60

  const route = useRoute()
  const { isMounted } = useIsMounted()
  const { t } = useTranslation()
  const { bemAdd, bemFacets } = useBem('c-view-shell-spherical', props, {})
  const { dialog } = useDialog()
  const { scene } = useGameScene()
  const { isHotspotShown } = useDialogHotspot()
  const { handleCommand } = useDialogCommand(dialog)

  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const wrapperEl = ref<HTMLDivElement | null>(null)
  const overlayEl = ref<HTMLDivElement | null>(null)
  const texture = ref<Texture | null>(null)
  const hotspotLocations = ref<Array<DialogHotspotLocation>>([])
  const showHotspots = ref<boolean>(false)
  const canvasWidth = ref<number>(0)
  const canvasHeight = ref<number>(0)

  const onRenderImmersive = (width: number, height: number, coords: Array<DialogHotspotLocation>) => {
    canvasWidth.value = width
    canvasHeight.value = height
    hotspotLocations.value = coords
  }

  const onRenderInline = (width: number, height: number, coords: Array<DialogHotspotLocation>) => {
    canvasWidth.value = width
    canvasHeight.value = height
    hotspotLocations.value = coords
  }

  const {
    isSessionReady,
    isPresenting,
    requestSession,
    endSession: endImmersiveSession,
    mountScene: mountImmersiveScene,
    unmountScene: unmountImmersiveScene,
  } = useImmersiveSession(onRenderImmersive)
  const { mountScene: mountInlineScene, unmountScene: unmountInlineScene } = useInlineScene(
    onRenderInline,
    { wrapperEl, canvasEl },
    computed<boolean>(() => !isPresenting.value),
  )
  const labelTranslations = ref<Record<string, string>>({})

  const transitionedHotspotLocations = computed<Array<DialogHotspotLocation>>(() => {
    return showHotspots.value ? hotspotLocations.value : []
  })
  const isBackgroundLoaded = computed<boolean>(() => texture.value != null)
  const isImmersiveSceneReady = computed<boolean>(() => {
    return isMounted.value && isBackgroundLoaded.value && scene.value != null && isSessionReady.value
  })
  const isInlineSceneReady = computed<boolean>(() => {
    return isMounted.value && isBackgroundLoaded.value && scene.value != null
  })

  const mainImageClasses = computed<Array<string>>(() => {
    return [bemAdd(isBackgroundLoaded.value ? 'is-shown' : '', 'main-image')]
  })

  const storeLabelTranslation = (label: string) => {
    if (!labelTranslations.value[label]) {
      labelTranslations.value[label] = t(label)
    }

    return labelTranslations.value[label]
  }

  const onRequestImmersiveSession = () => {
    requestSession(overlayEl.value)
  }

  const onEndImmersiveSession = () => {
    endImmersiveSession()
  }

  const onActionRequested = (commandData: Array<DialogResultCommandData> | undefined = []) => {
    commandData.forEach((command) => handleCommand(command))
  }

  // React to `props.background` change (load new texture).
  watch(
    () => props.background,
    async (url) => {
      if (url != null) {
        texture.value = null
        texture.value = await TL.loadAsync(url)
        texture.value.center = new Vector2(0.5, 0.5)
        texture.value.rotation = Math.PI
        texture.value.flipY = false
      }
    },
    { immediate: true },
  )

  // React to a new immersive session.
  watch(
    () => isInlineSceneReady.value,
    (nValue) => {
      if (nValue) {
        mountInlineScene(scene.value!, texture.value!)
      }
    },
    { immediate: true },
  )

  // React to a new inline session.
  watch(
    () => isImmersiveSceneReady.value,
    (nValue) => {
      if (nValue) {
        mountImmersiveScene(scene.value!, texture.value!)
      } else {
        unmountImmersiveScene()
      }
    },
    { immediate: true },
  )

  onMounted(() => {
    setTimeout(() => {
      showHotspots.value = true
    }, hotspotDisplayDelay)
  })

  onBeforeUnmount(() => {
    endImmersiveSession()
    unmountInlineScene()
  })
</script>

<template>
  <div :class="bemFacets" class="c-view-shell-spherical">
    <div ref="wrapperEl" class="c-view-shell-spherical__background-wrap">
      <div class="c-view-shell-spherical__background-element" />
      <canvas
        :key="route.fullPath"
        ref="canvasEl"
        :class="mainImageClasses"
        class="c-view-shell-spherical__main-image"
      />
    </div>
    <div ref="overlayEl" class="c-view-shell-spherical__overlay u-typography-root">
      <ul class="u-reset">
        <li
          v-for="({ hotspot, coords }, hotspotLocationIdx) in transitionedHotspotLocations"
          :key="hotspot.label"
          :style="{
            '--trs-delay': hotspotStaggerDelay,
            '--trs-idx': hotspotLocationIdx,
            '--trs-total': transitionedHotspotLocations.length,
          }"
        >
          <ImageMapTooltip
            v-if="isHotspotShown(hotspot.label)"
            :height="canvasHeight"
            :hotspot="hotspot"
            :show-button="false"
            :width="canvasWidth"
            :x="coords.x"
            :y="coords.y"
            @action="onActionRequested(hotspot.onClick)"
          >
            <template #default="{ label }">
              <span :key="label">
                {{ storeLabelTranslation(label) }}
              </span>
            </template>
          </ImageMapTooltip>
        </li>
      </ul>
    </div>
    <div class="c-view-shell-spherical__content u-typography-root">
      <XrControls @request-session="onRequestImmersiveSession" @end-session="onEndImmersiveSession" />
    </div>
    <div class="c-view-shell-spherical__debug">
      <slot name="debug" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @use 'sass:color';
  @use 'sass:math';
  @use '@nirazul/scss-utils' as utils;
  @use '@/assets/scss/util/color/color' as col;
  @use '@/assets/scss/util/transition' as trs;

  .c-view-shell-spherical {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .c-view-shell-spherical__background-wrap {
    z-index: 1;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    padding-right: var(--scroll-lock);
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  .c-view-shell-spherical__background-shell {
    @include utils.overlay;
  }

  .c-view-shell-spherical__background-element {
    @include utils.overlay;
  }

  .c-view-shell-spherical__main-image {
    z-index: 2;
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: 1600ms trs.$default-fn opacity;

    &.c-view-shell-spherical__main-image--is-shown {
      opacity: 1;
    }
  }

  .c-view-shell-spherical__overlay,
  .c-view-shell-spherical__content {
    pointer-events: none;
    position: absolute;
    width: 100%;
    height: 100%;
    padding-right: var(--scroll-lock);
  }

  .c-view-shell-spherical__overlay {
    --label-offset: 6vmin;
    z-index: 2;
  }

  .c-view-shell-spherical__content {
    z-index: 3;
  }
</style>
