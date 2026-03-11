import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'mfuko_settings'

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : {}
    } catch {
        return {}
    }
}

function saveToStorage(data: Record<string, unknown>) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const useSettingsStore = defineStore('settings', () => {
    const stored = loadFromStorage()

    const hideInitialDeposit = ref<boolean>(Boolean(stored.hideInitialDeposit ?? false))
    const hideOpeningBalance = ref<boolean>(Boolean(stored.hideOpeningBalance ?? false))

    function setHideInitialDeposit(value: boolean) {
        hideInitialDeposit.value = value
        saveToStorage({ ...loadFromStorage(), hideInitialDeposit: value })
    }

    function setHideOpeningBalance(value: boolean) {
        hideOpeningBalance.value = value
        saveToStorage({ ...loadFromStorage(), hideOpeningBalance: value })
    }

    return {
        hideInitialDeposit,
        hideOpeningBalance,
        setHideInitialDeposit,
        setHideOpeningBalance,
    }
})
