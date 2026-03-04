import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCentralContextStore = defineStore('centralContext', () => {
  const centralConfig = ref(null)

  function setConfig(config: any) {
    centralConfig.value = config
  }

  return { centralConfig, setConfig }
})
