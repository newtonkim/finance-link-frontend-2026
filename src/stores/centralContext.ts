import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCentralContextStore = defineStore('centralContext', () => {
  const centralConfig = ref<unknown | null>(null)

  function setConfig(config: unknown) {
    centralConfig.value = config
  }

  return { centralConfig, setConfig }
})
