<script setup lang="ts">
  import { RouterView } from 'vue-router'
  import { useBootstrapStore } from '@/stores/Bootstrap'
  import { onBeforeUnmount, onMounted } from 'vue'
  import useUiController from '@/composables/UiController/UiController'

  useBootstrapStore()

  const setInteractionOccured = () => {
    const { interactionOccured } = useUiController()

    interactionOccured.value = true
    document.removeEventListener('click', setInteractionOccured)
  }

  onMounted(() => {
    document.addEventListener('click', setInteractionOccured)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', setInteractionOccured)
  })
</script>

<template>
  <header>
    <div class="s-app__wrapper">
      <nav />
    </div>
  </header>

  <RouterView class="s-app__main" />
</template>

<style lang="scss" scoped></style>
