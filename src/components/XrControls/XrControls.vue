<script setup lang="ts">
  import useXrApiController from '@/composables/XrApiController/XrApiController'
  import useTranslation from '@/composables/Translation/Translation'
  import useXrImmersiveSessionController from '@/composables/XrImmersiveSessionController/XrImmersiveSessionController'
  import { computed } from 'vue'

  interface Emits {
    (e: 'request-session'): void
    (e: 'end-session'): void
  }

  const { t } = useTranslation()
  const { hasXr, hasImmersiveXr } = useXrApiController()
  const { hasActiveSession } = useXrImmersiveSessionController()

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
    <button @click="onClick" :disabled="disabled" class="xr-controls__action btn btn--small btn--highlight">
      {{ t(text) }}
    </button>
  </div>
</template>

<style scoped lang="scss">
  .xr-controls {
    pointer-events: none;
    display: flex;
    width: 100%;
    height: 100%;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
  }

  .xr-controls__action {
    pointer-events: auto;
    display: block;
  }
</style>
