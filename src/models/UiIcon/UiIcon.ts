export const enum UiIconResource {
  Fullscreen24 = 'fullscreen_FILL1_wght400_GRAD0_opsz24',
  FullscreenExit24 = 'fullscreen_exit_FILL1_wght400_GRAD0_opsz24',
  PanoramaHorizontal24 = 'panorama_horizontal_FILL1_wght400_GRAD0_opsz24',
  PanoramaPhotosphere24 = 'panorama_photosphere_FILL1_wght400_GRAD0_opsz24',
  QuestionMark24 = 'question_mark_FILL1_wght400_GRAD0_opsz24',
  VolumeOff24 = 'volume_off_FILL1_wght400_GRAD0_opsz24',
  VolumeUp24 = 'volume_up_FILL1_wght400_GRAD0_opsz24',
}

export const enum UiIconId {
  Fullscreen = 'Fullscreen',
  FullscreenExit = 'FullscreenExit',
  PanoramaHorizontal = 'PanoramaHorizontal',
  PanoramaPhotosphere = 'PanoramaPhotosphere',
  QuestionMark = 'QuestionMark',
  VolumeOff = 'VolumeOff',
  VolumeUp = 'VolumeUp',
}

export const enum UiIconSizeId {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

export type MaybeIconId = UiIconId | undefined | null

export interface UiIconEntry {
  id: UiIconId
  size?: UiIconSizeId
  icon: string
}

export type UiIconList = Array<UiIconEntry>
export type UiIconDict = Record<UiIconId, UiIconEntry>

export const uiIconList: UiIconList = [
  {
    id: UiIconId.Fullscreen,
    size: UiIconSizeId.Medium,
    icon: UiIconResource.Fullscreen24,
  },
  {
    id: UiIconId.FullscreenExit,
    size: UiIconSizeId.Medium,
    icon: UiIconResource.FullscreenExit24,
  },
  {
    id: UiIconId.PanoramaHorizontal,
    size: UiIconSizeId.Medium,
    icon: UiIconResource.PanoramaHorizontal24,
  },
  {
    id: UiIconId.PanoramaPhotosphere,
    size: UiIconSizeId.Medium,
    icon: UiIconResource.PanoramaPhotosphere24,
  },
  {
    id: UiIconId.QuestionMark,
    size: UiIconSizeId.Medium,
    icon: UiIconResource.QuestionMark24,
  },
  {
    id: UiIconId.VolumeOff,
    size: UiIconSizeId.Medium,
    icon: UiIconResource.VolumeOff24,
  },
  {
    id: UiIconId.VolumeUp,
    size: UiIconSizeId.Medium,
    icon: UiIconResource.VolumeUp24,
  },
]

export const uiIconDict: UiIconDict = uiIconList.reduce((acc, entry) => {
  acc[entry.id] = entry
  return acc
}, {} as UiIconDict)
