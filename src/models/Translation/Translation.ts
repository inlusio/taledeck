export const enum PageLocale {
  DE = 'de',
  EN = 'en',
}

export const enum TranslationLocaleKey {
  DE = 'value_de',
  EN = 'value_en',
}

export interface TranslationEntry {
  key: string
  [TranslationLocaleKey.DE]: string
  [TranslationLocaleKey.EN]: string
}

export interface TranslationFile {
  slug: string
  items: Array<TranslationEntry> | undefined
}

export interface TranslationRegistry {
  [key: string]: string
}
