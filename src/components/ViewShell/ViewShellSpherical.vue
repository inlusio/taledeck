<script lang="ts" setup>
  import XrControls from '@/components/XrControls/XrControls.vue'
  import useBem from '@/composables/Bem/Bem'
  import type { UseBemProps } from '@/composables/Bem/BemFacetOptions'
  import useGameScene from '@/composables/GameScene/GameScene'
  import useImmersiveSession from '@/composables/ImmersiveSession/ImmersiveSession'
  import useInlineScene from '@/composables/InlineScene/InlineScene'
  import useIsMounted from '@/composables/IsMounted/IsMounted'
  import type { DialogHotspotLocation } from '@/models/DialogHotspot/DialogHotspot'
  import { Texture, TextureLoader, Vector2 } from 'three'
  import { computed, onBeforeUnmount, ref, watch } from 'vue'

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

  const { isMounted } = useIsMounted()
  const { bemFacets } = useBem('c-view-shell-spherical', props, {})
  const { scene } = useGameScene()

  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const wrapperEl = ref<HTMLDivElement | null>(null)
  const texture = ref<Texture | null>(null)
  const hotspotLocations = ref<Array<DialogHotspotLocation>>([])
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

  const immersiveScene = useImmersiveSession(onRenderImmersive)
  const { isSessionReady, isPresenting, requestSession, endSession: endImmersiveSession } = immersiveScene
  const inlineScene = useInlineScene(
    onRenderInline,
    { wrapperEl, canvasEl },
    computed<boolean>(() => !isPresenting.value),
  )
  const isImmersiveSceneReady = computed<boolean>(() => isMounted.value && isSessionReady.value)
  const isInlineSceneReady = computed<boolean>(() => isMounted.value)

  const isImmersiveSceneMounted = ref<boolean>(false)
  const isInlineSceneMounted = ref<boolean>(false)

  const onRequestImmersiveSession = () => {
    requestSession()
  }

  const onEndImmersiveSession = () => {
    endImmersiveSession()
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

  // React to a new inline session.
  watch(
    () => isInlineSceneReady.value,
    (nV) => {
      if (nV) {
        inlineScene.mount()
      } else {
        inlineScene.unmount()
      }

      isInlineSceneMounted.value = nV
    },
    { immediate: true },
  )

  // React to a new immersive session.
  watch(
    () => isImmersiveSceneReady.value,
    async (nV) => {
      if (nV) {
        await immersiveScene.mount()
      } else {
        immersiveScene.unmount()
      }

      isImmersiveSceneMounted.value = nV
    },
    { immediate: true },
  )

  // React to an updated inline session.
  watch(
    () => [isInlineSceneMounted.value, !isPresenting.value, scene.value, texture.value],
    (nV) => {
      if (!isInlineSceneMounted.value) {
        return
      }

      inlineScene.clear()

      if (nV.every(Boolean)) {
        inlineScene.update(scene.value!, texture.value!)
      }
    },
    { immediate: true },
  )

  // React to an updated immersive session.
  watch(
    () => [isImmersiveSceneMounted.value, scene.value, texture.value],
    (nV) => {
      if (!isImmersiveSceneMounted.value) {
        return
      }

      immersiveScene.clear()

      if (nV.every(Boolean)) {
        immersiveScene.update(scene.value!, texture.value!)
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    endImmersiveSession()
    inlineScene.unmount()
  })
</script>

<template>
  <div :class="bemFacets" class="c-view-shell-spherical">
    <div ref="wrapperEl" class="c-view-shell-spherical__background-wrap">
      <div class="c-view-shell-spherical__background-element" />
      <canvas ref="canvasEl" class="c-view-shell-spherical__main-image" />
    </div>
    <div class="c-view-shell-spherical__overlay u-typography-root" />
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
