import type { Serializer } from '@vueuse/core'
import { useStorage } from '@vueuse/core'
import type { StoreId } from '@/models/Store'
import { parse, stringify } from 'superjson'
import useStorageKey from '@/composables/StorageKey/StorageKey'
import useRouteRecord from '@/composables/RouteRecord/RouteRecord'

export const enum CustomSerializerId {
  Set = 'SetSerializer',
  Object = 'ObjectSerializer',
}

export interface PersistentRefOptions {
  mergeDefaults?: boolean
  writeDefaults?: boolean
  customSerializerId?: CustomSerializerId
  useDefaultValueShim?: boolean
  storage?: 'localStorage' | 'sessionStorage'
}

const STORAGE_PREFIX = 'TaleDeck'

const getSerializer = <TValue>(customSerializerId: CustomSerializerId | undefined): Serializer<TValue> | undefined => {
  switch (customSerializerId) {
    case CustomSerializerId.Set:
    case CustomSerializerId.Object:
      return {
        read: (raw) => {
          return parse(raw)
        },
        write: (val) => {
          return stringify(val)
        },
      }
  }
}

export default function usePersistentStorage(storeId: StoreId) {
  const { storyParam } = useRouteRecord()

  if (!storyParam.value) {
    throw new Error(`No active story param in url! Unable to save data!`)
  }

  const { compose } = useStorageKey([STORAGE_PREFIX, storyParam.value])

  const persistentRef = <TValue>(
    key: string,
    defaultValue: TValue,
    persistentRefOptions: PersistentRefOptions = {},
  ) => {
    const storageKey = compose(storeId, key)
    const serializer = getSerializer<TValue>(persistentRefOptions.customSerializerId)
    const { mergeDefaults = false, writeDefaults = false } = persistentRefOptions
    const options = { mergeDefaults, writeDefaults, serializer }
    const storage = window[persistentRefOptions.storage ?? 'localStorage']

    return useStorage<TValue>(storageKey, defaultValue, storage, options)
  }

  return {
    persistentRef,
  }
}
