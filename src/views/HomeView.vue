<script lang="ts" setup>
  import useTranslation from '@/composables/Translation/Translation'

  const { t } = useTranslation()
</script>

<template>
  <main class="p-page-home s-layout-content">
    <div class="s-layout-content__main">
      <div class="s-container s-container--primary">
        <div class="s-container__container p-page-home__main">
          <div class="p-page-home__content u-typography-root">
            <div class="p-page-home__top">
              <h1 class="p-page-home__title">
                {{ t('home.title') }}
              </h1>
              <span class="p-page-home__subtitle">
                {{ t('home.description') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
  @use '@/assets/scss/util/color/color' as col;
  @use '@/assets/scss/base/typography/typography' as type;

  .p-page-home {
    background-image: url('/image/static/bg.jpg');
    background-size: cover;
    background-position: center center;
    background-color: col.$monochrome-magnet;

    background-blend-mode: multiply;
  }

  .p-page-home__main {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: stretch;
  }

  .p-page-home__title {
    margin-bottom: 4px;
  }

  .p-page-home__subtitle {
    @include type.h2;

    & {
      display: block;
      margin-bottom: 40px;
    }
  }
</style>
