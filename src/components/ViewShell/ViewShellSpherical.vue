<script lang="ts" setup>
  import type { UseBemProps } from '@/composables/Bem/BemFacetOptions'
  import useBem from '@/composables/Bem/Bem'
  import { computed, onMounted, ref } from 'vue'
  import { TresCanvas } from '@tresjs/core'
  import { OrbitControls } from '@tresjs/cientos'
  import { useRoute } from 'vue-router'
  import { sleep } from '@/util/sleep'
  import type { Vector3 } from 'three'

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
  const { bemAdd, bemFacets } = useBem('c-view-shell-spherical', props, {})
  const route = useRoute()

  const isBackgroundLoaded = ref<boolean>(false)

  const mainImageClasses = computed<Array<string>>(() => {
    return [bemAdd(isBackgroundLoaded.value ? 'is-shown' : '', 'main-image')]
  })

  // TODO: Change to sensible/useful event
  onMounted(async () => {
    await sleep(0)
    isBackgroundLoaded.value = true
  })
</script>

<template>
  <div :class="bemFacets" class="c-view-shell-spherical">
    <div class="c-view-shell-spherical__background-wrap">
      <div class="c-view-shell-spherical__background-element" />
      <TresCanvas
        window-size
        :key="route.fullPath"
        clear-color="#82dbc5"
        :class="mainImageClasses"
        class="c-view-shell-spherical__main-image"
      >
        <TresPerspectiveCamera :position="[3, 3, 3] as unknown as Vector3" :fov="45" :look-at="() => [0, 0, 0]" />
        <OrbitControls />
        <TresMesh>
          <TresTorusGeometry :args="[1, 0.5, 16, 32]" />
          <TresMeshBasicMaterial color="orange" />
        </TresMesh>
        <TresAmbientLight :intensity="1" />
      </TresCanvas>
    </div>
    <div class="c-view-shell-spherical__content">
      <!--<slot :height="height" :width="width" name="content" />-->
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

  .c-view-shell-spherical__content {
    z-index: 2;
    pointer-events: none;
    position: relative;
    width: 100%;
    height: 100%;
    padding-right: var(--scroll-lock);
  }
</style>
