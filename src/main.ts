import { DEFAULT_LOCALE, setupI18n } from '@/i18n'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

import './assets/scss/main.scss'

const app = createApp(App)

export const i18n = setupI18n({
  legacy: false,
  globalInjection: true,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {},
  missingWarn: import.meta.env.VITE_DEBUG === 'True',
})

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')
