<script lang="ts" setup>
  import UiIcon from '@/components/UiIcon/UiIcon.vue'
  import useTranslation from '@/composables/Translation/Translation'
  import useXrApiController from '@/composables/XrApiController/XrApiController'
  import { UiIconId, UiIconSizeId } from '@/models/UiIcon/UiIcon'
  import { useImmersiveSessionStore } from '@/stores/ImmersiveSession'
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'

  interface Emits {
    (e: 'request-session'): void

    (e: 'end-session'): void
  }

  const { t } = useTranslation()
  const { hasXr, hasImmersiveXr } = useXrApiController()
  const immersiveSessionStore = useImmersiveSessionStore()
  const { isPresenting } = storeToRefs(immersiveSessionStore)

  const emit = defineEmits<Emits>()

  const disabled = computed<boolean>(() => !(hasXr.value && hasImmersiveXr.value))
  const text = computed<string>(() => {
    if (disabled.value) {
      return 'xr_controls.unavailable'
    }

    if (isPresenting.value) {
      return 'xr_controls.exit'
    }

    return 'xr_controls.enter'
  })

  const onClick = () => {
    if (isPresenting.value) {
      emit('end-session')
    } else {
      emit('request-session')
    }
  }
</script>

<template>
  <div class="c-xr-controls">
    <button
      :disabled="disabled"
      class="c-xr-controls__action btn btn--small btn--highlight btn--has-grid"
      @click="onClick"
    >
      <UiIcon :id="UiIconId.PanoramaHorizontal" :colorize="true" :size="UiIconSizeId.Medium" />
      {{ t(text) }}
    </button>
    <slot name="default" />
  </div>
</template>

<style lang="scss" scoped>
  .c-xr-controls {
    pointer-events: none;
    display: flex;
    width: 100%;
    height: 100%;
    flex-flow: column nowrap;
    justify-content: flex-end;
    align-items: center;
    padding: (24px /* DialogBox offset */ + 48px) 0;
  }

  .c-xr-controls__action {
    pointer-events: auto;

    &:disabled {
      opacity: 0.1;

      &:hover {
        opacity: 1;
      }
    }
  }
</style>
