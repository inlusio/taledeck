export const enum PageLocale {
  DE = 'de',
  EN = 'en',
}

export const enum CmsTranslationLocaleKey {
  DE = 'value_de',
  EN = 'value_en',
}

export interface CmsTranslationEntry {
  key: string
  [CmsTranslationLocaleKey.DE]: string
  [CmsTranslationLocaleKey.EN]: string
}

export interface CmsTranslationFile {
  slug: string
  items: Array<CmsTranslationEntry> | undefined
  itemsMarkdown: Array<CmsTranslationEntry> | undefined
  itemsPlural: Array<CmsTranslationEntry> | undefined
}

export interface TranslationRegistry {
  [key: string]: string
}
