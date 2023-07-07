// I18N LAZY LOADING
// https://vue-i18n.intlify.dev/guide/advanced/lazy.html

import useTaleDeckApi from '@/composables/TaleDeckApi/TaleDeckApi'
import type { TranslationFile, TranslationRegistry } from '@/models/Translation/Translation'
import { PageLocale } from '@/models/Translation/Translation'
import { nextTick } from 'vue'
import type { I18n, I18nOptions } from 'vue-i18n'
import { createI18n } from 'vue-i18n'

type I18nInstance = I18n<{}, {}, {}, string, false>

export const SUPPORT_LOCALES = [PageLocale.DE, PageLocale.EN]
export const DEFAULT_LOCALE = PageLocale.DE

const transformCmsTranslationFile = (
  acc: TranslationRegistry,
  locale: PageLocale,
  { slug, items }: TranslationFile,
): TranslationRegistry => {
  items?.forEach((item) => (acc[`${slug}.${item.key}`] = item[`value_${locale}`]))
  // itemsMarkdown?.forEach((item) => (acc[`MD.${slug}.${item.key}`] = item[`value_${locale}`]))
  // itemsPlural?.forEach((item) => (acc[`PL.${slug}.${item.key}`] = item[`value_${locale}`]))

  return acc
}

export function setupI18n(options: I18nOptions) {
  const i18n: I18nInstance = createI18n(options)
  setLocale(i18n, (options.locale as PageLocale) || DEFAULT_LOCALE)
  return i18n
}

export function setLocale(i18n: I18nInstance, locale: PageLocale) {
  const htmlEl = document.querySelector('html') as HTMLHtmlElement

  i18n.global.locale.value = locale
  htmlEl.setAttribute('lang', locale)
}

export async function loadMessages(i18n: I18nInstance, locale: PageLocale) {
  const { getTranslationList } = useTaleDeckApi()
  const { data } = await getTranslationList()

  if (Array.isArray(data) && data.length > 0) {
    const messages = data.reduce((acc: TranslationRegistry, entryContent) => {
      return transformCmsTranslationFile(acc, locale, entryContent)
    }, {})

    // set locale and locale message
    i18n.global.setLocaleMessage(locale, messages)
  } else {
    // TODO: Handle no entries error
  }

  return nextTick()
}
