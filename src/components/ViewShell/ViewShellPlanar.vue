<script lang="ts" setup>
  import ImageMapTooltip from '@/components/ImageMapTooltip/ImageMapTooltip.vue'
  import ResponsiveImg from '@/components/ResponsiveImg/ResponsiveImg.vue'
  import ResponsiveShell from '@/components/ResponsiveShell/ResponsiveShell.vue'
  import useBem from '@/composables/Bem/Bem'
  import type { UseBemProps } from '@/composables/Bem/BemFacetOptions'
  import useDialogCommand from '@/composables/DialogCommand/DialogCommand'
  import { useDialogHotspot } from '@/composables/DialogHotspot/DialogHotspot'
  import useTranslation from '@/composables/Translation/Translation'
  import type { ReactiveDialog } from '@/models/Dialog/Dialog'
  import type { DialogHotspot } from '@/models/DialogHotspot/DialogHotspot'
  import type { DialogResultCommandData } from '@/models/DialogResult/DialogResult'
  import { computed, onMounted, ref } from 'vue'

  interface Props extends UseBemProps {
    facets?: Array<string>
    background?: string
    width: number
    height: number
    dialog: ReactiveDialog
  }

  const hotspotDisplayDelay = 600
  const hotspotStaggerDelay = 60

  const props = withDefaults(defineProps<Props>(), {
    facets: () => [],
    background: '',
  })

  const { t } = useTranslation()
  const { bemAdd, bemFacets } = useBem('c-view-shell-planar', props, {})
  const { hotspots, isHotspotShown } = useDialogHotspot()

  const isBackgroundLoaded = ref<boolean>(false)
  const showHotspots = ref<boolean>(false)

  const transitionedHotspots = computed<Array<DialogHotspot>>(() => {
    return showHotspots.value ? hotspots.value : []
  })
  const blurImageClasses = computed<Array<string>>(() => {
    return [bemAdd(isBackgroundLoaded.value ? 'is-shown' : '', 'blur-image')]
  })

  const mainImageClasses = computed<Array<string>>(() => {
    return [bemAdd(isBackgroundLoaded.value ? 'is-shown' : '', 'main-image')]
  })

  const onLoad = () => {
    isBackgroundLoaded.value = true
  }

  const onActionRequested = (commandData: Array<DialogResultCommandData> | undefined = []) => {
    const { handleCommand } = useDialogCommand(props.dialog)
    commandData.forEach((command) => handleCommand(command))
  }

  onMounted(() => {
    setTimeout(() => {
      showHotspots.value = true
    }, hotspotDisplayDelay)
  })
</script>

<template>
  <div :class="bemFacets" class="c-view-shell-planar">
    <div v-if="background" class="c-view-shell-planar__background-wrap">
      <ResponsiveShell :outer-height="height" :outer-width="width" class="c-view-shell-planar__background-shell">
        <div class="c-view-shell-planar__background-element" />
      </ResponsiveShell>
      <ResponsiveImg
        :class="blurImageClasses"
        :resolutions="[1]"
        :src="background"
        :width="width"
        alt=""
        class="c-view-shell-planar__blur-image"
        @load="onLoad"
      />
      <ResponsiveImg
        :class="mainImageClasses"
        :resolutions="[1]"
        :src="background"
        :width="width"
        alt=""
        class="c-view-shell-planar__main-image"
        @load="onLoad"
      />
    </div>
    <div class="c-view-shell-planar__overlay u-typography-root">
      <ResponsiveShell :outer-height="height" :outer-width="width" class="c-view-shell-planar__responsive-shell">
        <TransitionGroup appear class="u-reset" name="trs-staggered-fade" tag="ul">
          <li
            v-for="(hotspot, hotspotIdx) in transitionedHotspots"
            :key="hotspot.label"
            :style="{
              '--trs-delay': hotspotStaggerDelay,
              '--trs-idx': hotspotIdx,
              '--trs-total': transitionedHotspots.length,
            }"
          >
            <ImageMapTooltip
              v-if="isHotspotShown(hotspot.label)"
              :height="height"
              :hotspot="hotspot"
              :width="width"
              :x="hotspot.x ?? 0"
              :y="hotspot.y ?? 0"
              @action="onActionRequested(hotspot.onClick)"
            >
              <template #default="{ label }">
                {{ t(label) }}
              </template>
            </ImageMapTooltip>
          </li>
        </TransitionGroup>
      </ResponsiveShell>
    </div>
    <div class="c-view-shell-planar__content u-typography-root">
      <slot :height="height" :width="width" name="content" />
    </div>
    <div class="c-view-shell-planar__debug">
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

  $blur: 40px;

  .c-view-shell-planar {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .c-view-shell-planar__background-wrap {
    pointer-events: none;
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

  .c-view-shell-planar__background-shell {
    @include utils.overlay;
  }

  .c-view-shell-planar__background-element {
    @include utils.overlay;
  }

  .c-view-shell-planar__blur-image {
    z-index: 1;
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(100% + #{$blur * 2});
    height: calc(100% + #{$blur * 2});
    filter: blur($blur);
    transform: translate(-50%, -50%);
    max-width: unset;
    max-height: unset;
  }

  .c-view-shell-planar__blur-image {
    opacity: 0;
    transition: 200ms trs.$default-fn opacity;

    &.c-view-shell-planar__blur-image--is-shown {
      opacity: 1;
    }
  }

  .c-view-shell-planar__main-image {
    z-index: 2;
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    opacity: 0;
    transition: 1600ms trs.$default-fn opacity;

    &.c-view-shell-planar__main-image--is-shown {
      opacity: 1;
    }
  }

  .c-view-shell-planar__overlay,
  .c-view-shell-planar__content {
    pointer-events: none;
    position: absolute;
    width: 100%;
    height: 100%;
    padding-right: var(--scroll-lock);
  }

  .c-view-shell-planar__overlay {
    z-index: 2;
  }

  .c-view-shell-planar__content {
    z-index: 3;
  }

  .c-view-shell-planar__responsive-shell {
    @include utils.overlay;
    pointer-events: none;
  }

  .c-view-shell-planar--scene {
    $image-w: 1600px;
    $image-h: 900px;
    $image-ratio: math.div($image-h, $image-w);

    .c-view-shell-planar__main-image {
      max-width: $image-w;
      max-height: $image-h;
    }
  }
</style>
