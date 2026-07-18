import { reactive } from 'vue'

/**
 * Global read-only state driven by the backend's license enforcement. When a
 * write is refused with 403 + `license_expired`, the API interceptors flip this
 * on so the UI can show a banner and disable create/edit/delete actions.
 */
export const licenseState = reactive({
  readOnly: false,
  message:
    'Your license has expired. You can still view your data, but adding, editing and deleting are disabled until you renew.',
})

export function markLicenseExpired(message?: string) {
  licenseState.readOnly = true
  if (message) licenseState.message = message
}

/** Inspect an axios-style error and flip read-only mode when the license expired. */
export function handleLicenseError(error: unknown): void {
  const err = error as { response?: { status?: number; data?: { license_expired?: boolean; message?: string } } }
  const data = err?.response?.data
  if (err?.response?.status === 403 && data?.license_expired) {
    markLicenseExpired(data?.message)
  }
}
