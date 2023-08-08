<script lang="ts" setup>
  import useBem from '@/composables/Bem/Bem'
  import type { UseBemProps } from '@/composables/Bem/BemFacetOptions'
  import useSegment from '@/composables/Segment/Segment'
  import type { DialogHotspot } from '@/models/DialogHotspot/DialogHotspot'
  import type { Rect } from '@/models/Segment/Segment'
  import type { CSSProperties } from 'vue'
  import { computed } from 'vue'

  interface Props extends UseBemProps {
    showButton?: boolean
    facets?: Array<string>
    width: number
    height: number
    hotspot: DialogHotspot
    x: number
    y: number
  }

  interface Emits {
    (e: 'action'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    showButton: true,
  })
  const emit = defineEmits<Emits>()
  const { bemAdd, bemFacets } = useBem('c-image-map-tooltip', props, {})

  const segmentRect = computed<Rect>(() => {
    return { x: 0, y: 0, width: props.width, height: props.height }
  })
  const { getSegmentFeatures, getSegmentIdxOfPoint } = useSegment(segmentRect, [3, 3])

  const segmentIdx = computed<number>(() => {
    return getSegmentIdxOfPoint({
      x: props.x,
      y: props.y,
    })
  })
  const areaLabelStyles = computed<CSSProperties>(() => {
    const x = (props.x / props.width) * 100
    const y = (props.y / props.height) * 100

    return {
      top: `${y}%`,
      left: `${x}%`,
    }
  })

  const rootClasses = computed<Array<string>>(() => {
    return [...bemFacets.value]
  })

  const labelClasses = computed<Array<string>>(() => {
    if (segmentIdx.value == null) {
      return []
    }

    return Object.entries(getSegmentFeatures(segmentIdx.value)).map(([key, value]) => {
      return bemAdd(`${key}-${value === -1 ? 'x' : value}`, 'label')
    })
  })

  const onActionRequested = () => {
    emit('action')
  }
</script>

<template>
  <span :class="rootClasses" :style="areaLabelStyles" class="c-image-map-tooltip">
    <button v-if="showButton" class="c-image-map-tooltip__btn" @click="onActionRequested">
      <span class="c-image-map-tooltip__circle-inner" />
    </button>
    <span :class="labelClasses" class="s-tooltip-label c-image-map-tooltip__label">
      <slot :label="hotspot.label" />
    </span>
  </span>
</template>

<style lang="scss" scoped>
  @use 'sass:color';
  @use 'sass:math';
  @use '@nirazul/scss-utils' as utils;
  @use '@/assets/scss/util/color/color' as col;
  @use '@/assets/scss/util/transition' as trs;
  @use '@/assets/scss/base/font/font' as font;
  @use '@/assets/scss/base/typography/typography' as type;

  $sz--circle: 40px;
  $sz--circle-outer: 80px;
  $sz--circle-inner: 28px;
  $sz--label-offset: math.div($sz--circle, 2) + 12px;

  @keyframes pulse-ring {
    0% {
      transform: translate(-50%, -50%) scale(0.35);
    }
    80%,
    100% {
      opacity: 0;
    }
  }

  @keyframes pulse-dot {
    0% {
      transform: translate(-50%, -50%) scale(0.8);
    }
    50% {
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      transform: translate(-50%, -50%) scale(0.8);
    }
  }

  .c-image-map-tooltip {
    --c-circle: var(--circle, #{$sz--circle});
    --c-circle-outer: var(--circle-outer, #{$sz--circle-outer});
    --c-circle-inner: var(--circle-inner, #{$sz--circle-inner});
    --c-label-offset: var(--label-offset, #{$sz--label-offset});
    --c-value: calc(var(--scroll-bar) * -0.5);

    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    transform: translateX(var(--c-value));
  }

  .c-image-map-tooltip__btn {
    @include trs.common-props;
    pointer-events: auto;
    cursor: pointer;
    z-index: 2;
    position: relative;
    display: block;
    width: var(--c-circle);
    height: var(--c-circle);
    background-color: col.$monochrome-black;
    border-radius: var(--c-circle);
    padding: 2px;
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);

    @include utils.has-focus {
      &::after {
        background-color: col.$brand-red;
      }
    }

    &::before,
    &::after {
      @include trs.common-props;
      pointer-events: none;
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      display: block;
      transform: translate(-50%, -50%);
    }

    &::before {
      z-index: 1;
      width: var(--c-circle-outer);
      height: var(--c-circle-outer);
      border-radius: var(--c-circle-outer);
      background-color: rgba(col.$brand-red-dark, 0.6);
      animation: pulse-ring 4000ms cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }

    &::after {
      z-index: 3;
      width: var(--c-circle-inner);
      height: var(--c-circle-inner);
      border-radius: var(--c-circle-inner);
      background-color: color.change(col.$brand-red, $alpha: 0.6);
      transform: translate(-50%, -50%) scale(1);

      //transform: translate(-50%, -50%) scale(0);
      //animation: pulse-dot 4000ms cubic-bezier(0.455, 0.03, 0.515, 0.955) -400ms infinite;
    }
  }

  .c-image-map-tooltip__circle-inner {
    @include trs.common-props;
    pointer-events: none;
    z-index: 2;
    position: relative;
    top: 50%;
    left: 50%;
    display: block;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
    background-color: col.$monochrome-white;
    border-radius: var(--c-circle);
  }

  .c-image-map-tooltip__label {
    pointer-events: none;
    position: absolute;

    // Rows
    &.c-image-map-tooltip__label--row-x {
      display: none;
    }

    &.c-image-map-tooltip__label--row-0 {
      top: 0;
    }

    &.c-image-map-tooltip__label--row-1 {
      top: 0;
      transform: translateY(-50%);
    }

    &.c-image-map-tooltip__label--row-2 {
      bottom: 0;
    }

    // Columns
    &.c-image-map-tooltip__label--col-x {
      display: none;
    }

    &.c-image-map-tooltip__label--col-0 {
      left: var(--c-label-offset);
    }

    &.c-image-map-tooltip__label--col-1 {
      top: var(--c-label-offset);
      bottom: unset;
      transform: translateX(-50%);
    }

    &.c-image-map-tooltip__label--col-2 {
      right: var(--c-label-offset);
    }

    // Segments
    &.c-image-map-tooltip__label--seg-5 {
      top: unset;
      bottom: var(--c-label-offset);
    }
  }
</style>
