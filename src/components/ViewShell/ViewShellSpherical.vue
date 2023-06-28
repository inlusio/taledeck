<script setup lang="ts">
  import XrControls from '@/components/XrControls/XrControls.vue'
  import useBem from '@/composables/Bem/Bem'
  import type { UseBemProps } from '@/composables/Bem/BemFacetOptions'
  import useIsMounted from '@/composables/IsMounted/IsMounted'
  import useXrImmersiveSessionController from '@/composables/XrImmersiveSessionController/XrImmersiveSessionController'
  import useXrScene from '@/composables/XrScene/XrScene'
  import type { PBRTextureMaps } from '@tresjs/core'
  import { useTexture } from '@tresjs/core'
  import { computed, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'

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

  const { context, session, refSpace, hasActiveSession, requestSession, endSession } = useXrImmersiveSessionController()

  const route = useRoute()
  const { isMounted } = useIsMounted()
  const { bemAdd, bemFacets } = useBem('c-view-shell-spherical', props, {})
  const { debugPosition, initScene } = useXrScene(true, context, session, refSpace)

  const overlayEl = ref<HTMLDivElement | null>(null)
  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const texture = ref<PBRTextureMaps | null>(null)

  const isBackgroundLoaded = computed<boolean>(() => texture.value != null)
  const mainImageClasses = computed<Array<string>>(() => {
    return [bemAdd(isBackgroundLoaded.value ? 'is-shown' : '', 'main-image')]
  })

  const onRequestSession = () => {
    requestSession(overlayEl.value as HTMLDivElement)
  }

  const onEndSession = () => {
    endSession()
  }

  // React to `props.background` change (load new texture).
  watch(
    () => props.background,
    async (nV) => {
      texture.value = null

      if (nV == null) {
        return
      }

      texture.value = (await useTexture({ map: nV })) as PBRTextureMaps
    },
    { immediate: true },
  )

  // React to a new `session` being initted (init scene).
  watch(
    () => [isMounted.value, hasActiveSession.value, isBackgroundLoaded.value],
    (nV) => {
      if (nV.every(Boolean)) {
        initScene(canvasEl.value!, texture.value!)
      }
    },
    { immediate: true },
  )
</script>

<template>
  <div :class="bemFacets" class="c-view-shell-spherical">
    <div class="c-view-shell-spherical__background-wrap">
      <div class="c-view-shell-spherical__background-element" />
      <canvas
        :key="route.fullPath"
        :class="mainImageClasses"
        class="c-view-shell-spherical__main-image"
        ref="canvasEl"
      />
    </div>
    <div class="c-view-shell-spherical__content">
      <XrControls @request-session="onRequestSession" @end-session="onEndSession" />
      <!--<slot :height="height" :width="width" name="content" />-->
    </div>
    <div class="c-view-shell-spherical__debug">
      <slot name="debug" />
      <div ref="overlayEl">
        overlay2
        <pre>x: {{ debugPosition.x }}</pre>
        <pre>y: {{ debugPosition.y }}</pre>
        <pre>z: {{ debugPosition.z }}</pre>
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
