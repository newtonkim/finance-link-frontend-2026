<script setup lang="ts">
import { ImageIcon, Loader2, Pencil, X } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { brandingApi } from '@/central/modules/apis'

const { getBranding, updateBranding } = brandingApi()

const platformName = ref('')
const platformTagline = ref('')
const logoPreview = ref<string | null>(null)
const logoFile = ref<File | null>(null)
const isDragging = ref(false)
const isSaving = ref(false)
const isLoading = ref(true)
const fileInput = ref<HTMLInputElement | null>(null)
const existingLogoUrl = ref<string | null>(null)

onMounted(async () => {
    const res = await getBranding()
    const data = res?.payload ?? res
    if (data) {
        platformName.value = data.platform_name ?? ''
        platformTagline.value = data.tagline ?? ''
        if (data.logo_url) existingLogoUrl.value = data.logo_url
    }
    isLoading.value = false
})

function onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) applyFile(file)
}

function onDrop(e: DragEvent) {
    isDragging.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')) applyFile(file)
}

function applyFile(file: File) {
    logoFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => { logoPreview.value = e.target?.result as string }
    reader.readAsDataURL(file)
}

function removeLogo() {
    logoPreview.value = null
    logoFile.value = null
    if (fileInput.value) fileInput.value.value = ''
}

const currentLogoSrc = () => logoPreview.value ?? existingLogoUrl.value

async function handleSave() {
    isSaving.value = true
    try {
        const res = await updateBranding({
            platform_name: platformName.value,
            tagline: platformTagline.value,
            logo: logoFile.value,
        })
        const data = res?.payload ?? res
        if (data?.logo_url) {
            existingLogoUrl.value = data.logo_url
            logoFile.value = null
            logoPreview.value = null
        }
    } finally {
        isSaving.value = false
    }
}
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-background">
        <!-- Header -->
        <div class="flex flex-col gap-1">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <ImageIcon class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Logo & Details</h1>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">Customize your platform logo and name</p>
                </div>
            </div>
        </div>

        <!-- Loading skeleton -->
        <div v-if="isLoading" class="space-y-5">
            <div v-for="i in 3" :key="i"
                class="rounded-2xl border border-neutral-100 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 h-36 animate-pulse" />
        </div>

        <template v-else>
            <div class="space-y-5">
                <!-- Logo Upload Card -->
                <div
                    class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-1">Platform Logo</h3>
                    <p class="text-xs text-neutral-400 dark:text-neutral-500 mb-5">
                        Recommended size: 256×256px. PNG or SVG with transparent background.
                    </p>

                    <div class="flex items-start gap-6">
                        <!-- Current logo preview -->
                        <div
                            class="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 overflow-hidden">
                            <img v-if="currentLogoSrc()" :src="currentLogoSrc()!" alt="Logo preview"
                                class="h-full w-full object-contain p-2" />
                            <img v-else src="/images/mfuko_plus_logo.webp" alt="Current logo"
                                class="h-14 w-auto object-contain" />
                        </div>

                        <!-- Drop zone -->
                        <div class="flex-1">
                            <div @click="fileInput?.click()" @dragover.prevent="isDragging = true"
                                @dragleave="isDragging = false" @drop.prevent="onDrop" :class="[
                                    'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all duration-200',
                                    isDragging
                                        ? 'border-nfuko-primary bg-nfuko-primary/5'
                                        : 'border-neutral-200 dark:border-neutral-700 hover:border-nfuko-primary/50 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                ]">
                                <input ref="fileInput" type="file" accept="image/*" class="hidden"
                                    @change="onFileChange" />
                                <div
                                    class="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-700">
                                    <ImageIcon class="h-5 w-5 text-neutral-400" />
                                </div>
                                <div class="text-center">
                                    <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Drop image here or <span class="text-nfuko-primary">browse</span>
                                    </p>
                                    <p class="text-xs text-neutral-400 mt-0.5">PNG, JPG, SVG up to 2MB</p>
                                </div>
                            </div>

                            <!-- File selected info -->
                            <div v-if="logoFile"
                                class="mt-3 flex items-center justify-between rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 px-3 py-2">
                                <div class="flex items-center gap-2">
                                    <div class="flex h-7 w-7 items-center justify-center rounded-md bg-nfuko-primary/10">
                                        <ImageIcon class="h-4 w-4 text-nfuko-primary" />
                                    </div>
                                    <div>
                                        <p
                                            class="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate max-w-[180px]">
                                            {{ logoFile.name }}
                                        </p>
                                        <p class="text-[11px] text-neutral-400">
                                            {{ (logoFile.size / 1024).toFixed(1) }} KB
                                        </p>
                                    </div>
                                </div>
                                <button @click="removeLogo"
                                    class="flex h-6 w-6 items-center justify-center rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                                    <X class="h-3.5 w-3.5 text-neutral-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Platform Name Card -->
                <div
                    class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-5">Platform Identity</h3>
                    <div class="space-y-5">
                        <div class="flex flex-col gap-1.5">
                            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Platform Name
                            </label>
                            <div class="relative">
                                <input v-model="platformName" type="text" placeholder="e.g. Boss Portal"
                                    class="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 pr-10 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/20 transition-all" />
                                <Pencil
                                    class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300 pointer-events-none" />
                            </div>
                            <p class="text-xs text-neutral-400">Shown in the sidebar header and browser tab.</p>
                        </div>

                        <div class="flex flex-col gap-1.5 border-t border-neutral-100 dark:border-neutral-800 pt-5">
                            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Tagline <span class="text-neutral-400 font-normal">(optional)</span>
                            </label>
                            <div class="relative">
                                <input v-model="platformTagline" type="text"
                                    placeholder="e.g. Central Administration Platform"
                                    class="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 pr-10 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/20 transition-all" />
                                <Pencil
                                    class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300 pointer-events-none" />
                            </div>
                            <p class="text-xs text-neutral-400">Short description shown below the platform name.</p>
                        </div>
                    </div>
                </div>

                <!-- Live Preview Card -->
                <div
                    class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Preview</h3>
                    <div class="flex items-center gap-3 rounded-xl bg-nfuko-primary px-4 py-3 w-fit min-w-[220px]">
                        <div
                            class="flex shrink-0 items-center justify-center rounded-xl bg-nfuko-yellow/20 h-12 w-12 overflow-hidden">
                            <img v-if="currentLogoSrc()" :src="currentLogoSrc()!" alt="Logo"
                                class="h-8 w-auto object-contain" />
                            <img v-else src="/images/mfuko_plus_logo.webp" alt="Logo" class="h-8 w-auto" />
                        </div>
                        <div class="flex flex-col min-w-0">
                            <span class="text-base font-bold leading-tight text-white italic truncate">
                                {{ platformName || 'Platform Name' }}
                            </span>
                            <span v-if="platformTagline" class="text-[11px] text-white/50 truncate">
                                {{ platformTagline }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Save Button -->
            <div class="flex justify-end">
                <button @click="handleSave" :disabled="isSaving"
                    class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#002e35] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none dark:bg-nfuko-yellow dark:text-[#0A2318] dark:hover:bg-[#b8973f]">
                    <Loader2 v-if="isSaving" class="h-4 w-4 animate-spin" />
                    {{ isSaving ? 'Saving…' : 'Save Changes' }}
                </button>
            </div>
        </template>
    </div>
</template>
