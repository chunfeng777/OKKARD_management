import type { Permission } from '@/domain/common'
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    requiresTwoFactor?: boolean
    permission?: Permission
    titleKey?: string
  }
}

export {}
