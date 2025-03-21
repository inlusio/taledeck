<script lang="ts" setup>
  import XrControls from '@/components/XrControls/XrControls.vue'
  import useBem from '@/composables/Bem/Bem'
  import type { UseBemProps } from '@/composables/Bem/BemFacetOptions'
  import useImmersiveSession from '@/composables/ImmersiveSession/ImmersiveSession'
  import useInlineScene from '@/composables/InlineScene/InlineScene'
  import useIsMounted from '@/composables/IsMounted/IsMounted'
  import type { ReactiveDialog } from '@/models/Dialog/Dialog'
  import { toReactive } from '@vueuse/core'
  import { Texture, TextureLoader, Vector2 } from 'three'
  import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
  import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
  import { computed, markRaw, onBeforeUnmount, ref, watch } from 'vue'

  const textureLoader = new TextureLoader()
  const textureDict: Record<string, Texture> = {}

  const modelLoader = new GLTFLoader()
  const dracoLoader = new DRACOLoader()
  const modelDict: Record<string, GLTF> = {}

  dracoLoader.setDecoderPath('/lib/draco/')
  dracoLoader.preload()

  modelLoader.setDRACOLoader(dracoLoader)

  interface Props extends UseBemProps {
    facets?: Array<string>
    background?: string
    model?: string
    width: number
    height: number
    dialog: ReactiveDialog
  }

  const props = withDefaults(defineProps<Props>(), {
    facets: () => [],
    background: undefined,
    model: undefined,
  })

  const { isMounted } = useIsMounted()
  const { bemFacets } = useBem('c-view-shell-spherical', props, {})

  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const wrapperEl = ref<HTMLDivElement | null>(null)
  const canvasWidth = ref<number>(0)
  const canvasHeight = ref<number>(0)
  const currentTexture = ref<Texture | null>(null)
  const currentModel = ref<GLTF | null>(null)

  const onRenderImmersive = (width: number, height: number) => {
    canvasWidth.value = width
    canvasHeight.value = height
  }

  const onRenderInline = (width: number, height: number) => {
    canvasWidth.value = width
    canvasHeight.value = height
  }

  const { dialog } = toReactive(props)

  const immersiveScene = useImmersiveSession(onRenderImmersive, dialog, currentTexture, currentModel)
  const { isSessionReady, isPresenting, requestSession, endSession: endImmersiveSession } = immersiveScene
  const inlineScene = useInlineScene(
    onRenderInline,
    dialog,
    currentTexture,
    currentModel,
    { wrapperEl, canvasEl },
    computed<boolean>(() => !isPresenting.value),
  )
  const isImmersiveSceneReady = computed<boolean>(() => isMounted.value && isSessionReady.value)
  const isInlineSceneReady = computed<boolean>(() => isMounted.value)

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
      currentTexture.value = null

      if (url != null) {
        textureDict[url] = textureDict[url] ?? (await textureLoader.loadAsync(url))
        currentTexture.value = textureDict[url]
        currentTexture.value.center = new Vector2(0.5, 0.5)
        currentTexture.value.rotation = Math.PI
        currentTexture.value.flipY = false
      }
    },
    { immediate: true },
  )

  // React to `props.model` change (load new model).
  watch(
    () => props.model,
    async (url) => {
      currentModel.value = null

      if (url != null) {
        modelDict[url] = modelDict[url] ?? markRaw(await modelLoader.loadAsync(url))
        currentModel.value = modelDict[url]
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
    },
    { immediate: true },
  )

  // React to a new immersive session.
  watch(
    () => isImmersiveSceneReady.value,
    async (nV) => {
      if (nV) {
        inlineScene.unmount()
        await immersiveScene.mount()
      } else {
        immersiveScene.unmount()
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

  .c-view-shell-spherical__background-shell,
  .c-view-shell-spherical__background-element {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
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
