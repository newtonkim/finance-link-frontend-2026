// stores/useFormWatcher.ts
import { defineStore } from 'pinia'

export const formawtacher = defineStore('formWatcher', {
  state: () => ({
    AnyErrorsFoundInTheFOrm: false,
    currentFormValues: {},
    isFormSubmitted: false,
    loading: false,
    errors: {} as Record<string, string[]>,
  }),

  getters: {
    isValid: (state) => !state.AnyErrorsFoundInTheFOrm,
    errorCount: (state) => Object.keys(state.errors).length,
  },

  actions: {
   

    clearErrors() {
      this.errors = {}
      this.AnyErrorsFoundInTheFOrm = false
    },

    setLoading(status: boolean) {
      this.loading = status
    },
  },
})