const STORAGE_SEPARATOR = '::'

const join = (...list: Array<string>): string => list.join(STORAGE_SEPARATOR)

export default function useStorageKey(presetList: Array<string> = []) {
  return {
    join,
    compose: (...list: Array<string>) => join(...[...presetList, ...list]),
  }
}
