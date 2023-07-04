import { fileURLToPath, URL } from 'node:url'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import ViteSvgLoader from 'vite-svg-loader'
import ViteMkcert from 'vite-plugin-mkcert'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'esnext',
  },
  plugins: [
    ...(process.env.NODE_ENV === 'development' ? [ViteMkcert()] : []),
    ViteSvgLoader(),
    vue(),
    VueI18n({ runtimeOnly: false }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'node:path': 'path-browserify',
    },
  },
  server: { https: true },
})
