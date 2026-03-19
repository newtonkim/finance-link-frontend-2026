<script setup lang="ts">
import { ImageIcon, X, Loader2 } from 'lucide-vue-next'
import { Spinner } from '@/Global'
import { useSaccoBranding } from '../composables/useSaccoBranding'

const {
  showDrawer, loading, saving,
  name, tagline, logoFile, isDragging, fileInput,
  currentLogo, onFileChange, onDrop, removeLogo,
  openDrawer, closeDrawer, save,
} = useSaccoBranding()

defineExpose({ openDrawer })
</script>

<template>
  <Transition name="drawer-fade">
    <div v-if="showDrawer" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeDrawer" />
      <Transition name="drawer-slide">
        <aside
          class="absolute right-0 top-0 h-full w-full max-w-[560px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
          role="dialog"
          aria-label="Sacco Branding"
        >
          <div class="flex h-full flex-col">
            <!-- Header -->
            <div class="border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                    <ImageIcon class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                  </div>
                  <div>
                    <h3 class="text-lg font-bold tracking-tight text-neutral-900 uppercase dark:text-white">Sacco Branding</h3>
                    <p class="text-xs text-neutral-500">Update your sacco logo, name and tagline</p>
                  </div>
                </div>
                <button type="button" @click="closeDrawer" class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors dark:hover:bg-neutral-800">
                  <X class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div v-if="loading" class="space-y-5">
                <div v-for="i in 3" :key="i" class="h-24 rounded-2xl bg-neutral-100 animate-pulse dark:bg-neutral-800" />
              </div>

              <template v-else>
                <!-- Logo Upload -->
                <div class="space-y-3">
                  <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Sacco Logo</label>
                  <p class="text-xs text-neutral-400">PNG, JPG or SVG · max 2 MB · recommended 256×256 px</p>

                  <div class="flex items-start gap-4">
                    <!-- Preview -->
                    <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 overflow-hidden">
                      <img v-if="currentLogo()" :src="currentLogo()!" class="h-full w-full object-contain p-2" alt="Logo preview" />
                      <ImageIcon v-else class="h-7 w-7 text-neutral-300" />
                    </div>

                    <!-- Drop zone -->
                    <div class="flex-1">
                      <div
                        @click="fileInput?.click()"
                        @dragover.prevent="isDragging = true"
                        @dragleave="isDragging = false"
                        @drop.prevent="onDrop"
                        :class="[
                          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 cursor-pointer transition-all duration-200',
                          isDragging
                            ? 'border-nfuko-primary bg-nfuko-primary/5'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-nfuko-primary/50 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                        ]"
                      >
                        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
                        <p class="text-sm font-medium text-neutral-600 dark:text-neutral-300">Drop here or <span class="text-nfuko-primary">browse</span></p>
                      </div>

                      <div v-if="logoFile" class="mt-2 flex items-center justify-between rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 px-3 py-2">
                        <div class="flex items-center gap-2">
                          <ImageIcon class="h-4 w-4 text-nfuko-primary shrink-0" />
                          <span class="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate max-w-[160px]">{{ logoFile.name }}</span>
                          <span class="text-[11px] text-neutral-400">({{ (logoFile.size / 1024).toFixed(1) }} KB)</span>
                        </div>
                        <button @click="removeLogo" class="flex h-6 w-6 items-center justify-center rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                          <X class="h-3.5 w-3.5 text-neutral-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Sacco Name -->
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Sacco Name</label>
                  <input v-model="name" type="text" placeholder="e.g. Nakuru Sacco" class="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/20 transition-all" />
                  <p class="text-xs text-neutral-400">Displayed in the sidebar and on printed documents.</p>
                </div>

                <!-- Tagline -->
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Tagline <span class="text-neutral-400 font-normal">(optional)</span></label>
                  <input v-model="tagline" type="text" placeholder="e.g. Empowering members since 2005" class="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/20 transition-all" />
                  <p class="text-xs text-neutral-400">Short motto shown below the sacco name.</p>
                </div>

                <!-- Live Preview -->
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Preview</label>
                  <div class="flex items-center gap-3 rounded-xl bg-nfuko-primary px-4 py-3 w-fit min-w-[200px]">
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 overflow-hidden">
                      <img v-if="currentLogo()" :src="currentLogo()!" class="h-8 w-auto object-contain" alt="Preview" />
                      <ImageIcon v-else class="h-5 w-5 text-white/50" />
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="text-sm font-bold text-white truncate">{{ name || 'Sacco Name' }}</span>
                      <span v-if="tagline" class="text-[11px] text-white/50 truncate">{{ tagline }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <button type="button" @click="closeDrawer" class="rounded-lg bg-neutral-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-600 transition-colors">
                Cancel
              </button>
              <button type="button" @click="save" :disabled="saving || loading" class="inline-flex items-center gap-2 rounded-lg bg-nfuko-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002d32] transition-colors disabled:opacity-60 shadow-sm dark:bg-bg-nfuko-yellow dark:text-nfuko-primary">
                <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
                {{ saving ? 'Saving…' : 'Save Branding' }}
              </button>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </Transition>
</template>


<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.25s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
