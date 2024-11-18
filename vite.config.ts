import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import ViteMkcert from 'vite-plugin-mkcert'
import ViteSvgLoader from 'vite-svg-loader'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'esnext',
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Only works from version vite@5
        api: 'modern-compiler',
      },
    },
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
