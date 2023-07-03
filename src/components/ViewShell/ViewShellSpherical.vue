<script setup lang="ts">
  import XrControls from '@/components/XrControls/XrControls.vue'
  import useInlineScene from '@/composables/InlineScene/InlineScene'
  import useBem from '@/composables/Bem/Bem'
  import type { UseBemProps } from '@/composables/Bem/BemFacetOptions'
  import useIsMounted from '@/composables/IsMounted/IsMounted'
  import useXrSessionController from '@/composables/XrSessionController/XrSessionController'
  import { Texture, TextureLoader } from 'three'
  import { computed, onMounted, ref, watch } from 'vue'
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

  const immersiveSCtrl = useXrSessionController()

  const route = useRoute()
  const { isMounted } = useIsMounted()
  const { bemAdd, bemFacets } = useBem('c-view-shell-spherical', props, {})

  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const overlayEl = ref<HTMLDivElement | null>(null)
  const texture = ref<Texture | null>(null)

  const { initScene } = useInlineScene(canvasEl)

  const isBackgroundLoaded = computed<boolean>(() => texture.value != null)
  const isImmersiveScenePrepared = computed<boolean>(() => {
    return isMounted.value && isBackgroundLoaded.value && immersiveSCtrl.hasActiveSession.value
  })
  const isInlineScenePrepared = computed<boolean>(() => {
    return isMounted.value && isBackgroundLoaded.value
  })
  const mainImageClasses = computed<Array<string>>(() => {
    return [bemAdd(isBackgroundLoaded.value ? 'is-shown' : '', 'main-image')]
  })

  const onRequestImmersiveSession = () => {
    immersiveSCtrl.requestSession(overlayEl.value)
  }

  const onEndImmersiveSession = () => {
    immersiveSCtrl.endSession()
  }

  // React to `props.background` change (load new texture).
  watch(
    () => props.background,
    async (url) => {
      if (url != null) {
        texture.value = null
        texture.value = await TL.loadAsync(url)
      }
    },
    { immediate: true },
  )

  // React to a new immersive session.
  watch(
    () => isInlineScenePrepared.value,
    (nValue) => {
      if (nValue) {
        initScene(texture.value!)
      }
    },
    { immediate: true },
  )

  // React to a new inline session.
  watch(
    () => isImmersiveScenePrepared.value,
    (nValue) => {
      if (nValue) {
        immersiveSCtrl.initScene(texture.value!)
      }
    },
    { immediate: true },
  )

  onMounted(() => {
    // start "inline" session
  })
</script>

<template>
  <div :class="bemFacets" class="c-view-shell-spherical">
    <div class="c-view-shell-spherical__background-wrap">
      <div class="c-view-shell-spherical__background-element" />
      <canvas
        class="c-view-shell-spherical__main-image"
        :class="mainImageClasses"
        :key="route.fullPath"
        ref="canvasEl"
      />
    </div>
    <div class="c-view-shell-spherical__content">
      <XrControls @request-session="onRequestImmersiveSession" @end-session="onEndImmersiveSession" />
    </div>
    <div class="c-view-shell-spherical__debug">
      <slot name="debug" />
      <div ref="overlayEl">
        XR OVERLAY:
        <pre>x: {{ immersiveSCtrl.debugPosition.value.x }}</pre>
        <pre>y: {{ immersiveSCtrl.debugPosition.value.y }}</pre>
        <pre>z: {{ immersiveSCtrl.debugPosition.value.z }}</pre>
      </div>
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

  .c-view-shell-spherical__content {
    z-index: 2;
    pointer-events: none;
    position: relative;
    width: 100%;
    height: 100%;
    padding-right: var(--scroll-lock);
  }
</style>
