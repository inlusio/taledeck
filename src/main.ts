import { createApp } from 'vue'
import { createPinia } from 'pinia'
import tres from '@tresjs/core'

import App from './App.vue'
import router from './router'

import './assets/scss/main.scss'
import { DEFAULT_LOCALE, setupI18n } from '@/i18n'

const app = createApp(App)

export const i18n = setupI18n({
  legacy: false,
  globalInjection: true,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {},
})

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(tres)

app.mount('#app')
