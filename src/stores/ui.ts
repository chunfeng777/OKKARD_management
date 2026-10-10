import { defineStore } from 'pinia'

type ToastKind = 'success' | 'warning' | 'danger' | 'info'
interface ToastItem {
  id: string
  kind: ToastKind
  title: string
  message: string
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    sidebarCollapsed: false,
    toasts: [] as ToastItem[],
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    showToast(kind: ToastKind, title: string, message: string) {
      const id = crypto.randomUUID()
      this.toasts.push({ id, kind, title, message })
      window.setTimeout(() => this.dismissToast(id), 4200)
    },
    dismissToast(id: string) {
      this.toasts = this.toasts.filter((item) => item.id !== id)
    },
  },
})
