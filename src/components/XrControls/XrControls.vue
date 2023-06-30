<script setup lang="ts">
  import UiIcon from '@/components/UiIcon/UiIcon.vue'
  import useXrApiController from '@/composables/XrApiController/XrApiController'
  import useTranslation from '@/composables/Translation/Translation'
  import useXrSessionController from '@/composables/XrSessionController/XrSessionController'
  import { UiIconId, UiIconSizeId } from '@/models/UiIcon/UiIcon'
  import { computed } from 'vue'

  interface Emits {
    (e: 'request-session'): void
    (e: 'end-session'): void
  }

  const { t } = useTranslation()
  const { hasXr, hasImmersiveXr } = useXrApiController()
  const { hasActiveSession } = useXrSessionController()

  const emit = defineEmits<Emits>()

  const disabled = computed<boolean>(() => !(hasXr.value && hasImmersiveXr.value))
  const text = computed<string>(() => {
    if (disabled.value) {
      return 'xr_controls.unavailable'
    }

    if (hasActiveSession.value) {
      return 'xr_controls.exit'
    }

    return 'xr_controls.enter'
  })

  const onClick = () => {
    if (hasActiveSession.value) {
      emit('end-session')
    } else {
      emit('request-session')
    }
  }
</script>

<template>
  <div class="xr-controls">
    <button
      @click="onClick"
      :disabled="disabled"
      class="xr-controls__action btn btn--small btn--highlight btn--has-grid"
    >
      <UiIcon :id="UiIconId.PanoramaHorizontal" :colorize="true" :size="UiIconSizeId.Medium" />
      {{ t(text) }}
    </button>
    <slot name="default" />
  </div>
</template>

<style scoped lang="scss">
  .xr-controls {
    pointer-events: none;
    display: flex;
    width: 100%;
    height: 100%;
    flex-flow: column nowrap;
    justify-content: flex-end;
    align-items: center;
    padding: (24px /* DialogBox offset */ + 48px) 0;
  }

  .xr-controls__action {
    pointer-events: auto;
  }
</style>
