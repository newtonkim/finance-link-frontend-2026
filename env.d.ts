/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module 'vue-sonner' {
  import type { DefineComponent } from 'vue'

  export const Toaster: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export const toast: {
    (message?: string, options?: Record<string, unknown>): void
    success: (message?: string, options?: Record<string, unknown>) => void
    info: (message?: string, options?: Record<string, unknown>) => void
    warning: (message?: string, options?: Record<string, unknown>) => void
    error: (message?: string, options?: Record<string, unknown>) => void
    loading: (message?: string, options?: Record<string, unknown>) => void
  }
}
