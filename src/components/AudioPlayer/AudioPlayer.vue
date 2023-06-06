<template>
  <audio ref="audioEl" class="c-audio-player">
    <source v-if="channelSrc" :src="channelSrc" type="audio/mp3" />
  </audio>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue'
  import useAudioController from '@/composables/AudioController/AudioController'
  import type { AudioChannelEntry } from '@/models/AudioChannel/AudioChannel'
  import type { UseAudioTransitionEmits } from '@/composables/AudioTransition/AudioTransition'
  import useAudioTransition from '@/composables/AudioTransition/AudioTransition'

  interface Emits extends UseAudioTransitionEmits {
    (e: 'playback', flag: boolean): void
  }

  interface Props {
    channel: AudioChannelEntry
  }

  const emit = defineEmits<Emits>()
  const props = defineProps<Props>()
  const { start, stop } = useAudioTransition(emit)
  const { audioFiles } = useAudioController()

  const audioEl = ref<HTMLAudioElement | null>(null)
  const channelSrc = computed<string | null>(() => {
    if (audioFiles.value[props.channel.file]) {
      return audioFiles.value[props.channel.file].file
    }

    return null
  })

  // Volume data changed
  watch(
    () => props.channel.volume,
    (v) => {
      if (!audioEl.value) {
        return
      }

      audioEl.value!.volume = v
    },
  )

  defineExpose({
    start: () => start(audioEl.value!),
    stop: () => stop(audioEl.value!),
  })
</script>
