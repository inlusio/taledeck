export default function useEnv() {
  const { VITE_TALEDECK_POC_API_BASE_URL, VITE_TALEDECK_POC_API_STORY_SLUGS } = import.meta.env

  return {
    viteTaledeckPocApiBaseUrl: VITE_TALEDECK_POC_API_BASE_URL,
    viteTaledeckPocApiStorySlugs: VITE_TALEDECK_POC_API_STORY_SLUGS.split(',').filter(Boolean),
  }
}
