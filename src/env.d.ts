/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: 'mock' | 'api'
  readonly VITE_ADMIN_API_BASE_URL?: string
  readonly VITE_APP_ENV?: 'development' | 'staging' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
