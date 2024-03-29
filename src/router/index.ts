import { DEFAULT_LOCALE, loadMessages, setLocale, SUPPORT_LOCALES } from '@/i18n'
import { i18n } from '@/main'
import type { PageLocale } from '@/models/Translation/Translation'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:locale',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/:locale/story/:story',
      name: 'story',
      component: () => import('../views/StoryView.vue'),
    },
    {
      path: '/:locale/story/',
      redirect: { name: 'home' },
    },
    {
      path: '/:locale/story/:story/scene/:scene',
      name: 'scene',
      component: () => import('../views/SceneView.vue'),
    },
    {
      path: '/:locale/story/:story/scene/',
      redirect: { name: 'story' },
    },
    {
      path: '/admin',
      redirect: '/admin/index.html',
    },
    {
      path: '/:catchall(.*)*',
      redirect: (to: any) => {
        return `/${DEFAULT_LOCALE}${to.path}`
      },
    },
  ],
})

export default router

// NAVIGATION GUARDS
// https://vue-i18n.intlify.dev/guide/advanced/lazy.html

router.beforeEach(async (to, from, next) => {
  const paramsLocale = to.params.locale as PageLocale

  // NOTE: This path is handled by the last router directive (catch-all)
  if (!SUPPORT_LOCALES.includes(paramsLocale)) {
    return next()
  }

  // load locale messages
  if (!i18n.global.availableLocales.includes(paramsLocale)) {
    await loadMessages(i18n, paramsLocale)
  }

  // set i18n language
  setLocale(i18n, paramsLocale)

  return next()
})
