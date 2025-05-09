interface UseEnvReturnValue {
  viteTaledeckPocApiBaseUrl: string
  viteTaledeckLegacyStorySlugs: Array<string>
}

export default function useEnv(): UseEnvReturnValue {
  const { VITE_TALEDECK_POC_API_BASE_URL, VITE_TALEDECK_LEGACY_STORY_SLUGS } = import.meta.env

  return {
    viteTaledeckPocApiBaseUrl: VITE_TALEDECK_POC_API_BASE_URL,
    viteTaledeckLegacyStorySlugs: VITE_TALEDECK_LEGACY_STORY_SLUGS.trim().split(',').filter(Boolean),
  }
}
