<script setup lang="ts">
import { ref } from 'vue'
import { 
  X, 
  ChevronLeft, 
  Image as ImageIcon, 
  Upload, 
  Users, 
  LayoutGrid, 
  Info, 
  Phone, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  UserPlus2 
} from 'lucide-vue-next'
import {
  Sheet,
  SheetContent,
} from '@/Global/ui/sheet'
import { Label, InputError, Spinner } from '@/Global'
import PhoneInput from '@/Global/PhoneInput.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'success', group: any): void
}>()

// ─── Form State ──────────────────────────────────────────────────────────────
const initialForm = {
  name: '',
  date_created: '',
  location: '',
  description: '',
  primary_contact: '',
  primary_contact_country: 'UG',
  secondary_contact: '',
  secondary_contact_country: 'UG',
}

const form = ref({ ...initialForm })

const logoFile = ref<File | null>(null)
const logoPreview = ref<string | null>(null)
const processing = ref(false)
const errors = ref<Record<string, string>>({})

// ─── Handlers ─────────────────────────────────────────────────────────────────
function onLogoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  logoFile.value = file
  logoPreview.value = file ? URL.createObjectURL(file) : null
}

function close() {
  emit('update:open', false)
}

function resetForm() {
  form.value = { ...initialForm }
  logoFile.value = null
  logoPreview.value = null
}

async function handleSubmit() {
  processing.value = true
  errors.value = {}
  
  // Mock submission delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const newGroup = {
    id: Date.now(),
    name: form.value.name,
    primary_contact: `(${form.value.primary_contact_country}) ${form.value.primary_contact}`,
    location: form.value.location,
    status: 'Active',
    date_created: new Date().toLocaleDateString(),
    logo: logoPreview.value
  }

  processing.value = false
  emit('success', newGroup)
  resetForm()
  close()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputCls = 'w-full rounded-xl border border-neutral-200 bg-[#f9fbfb] px-4 py-3 text-sm text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:border-[#0A2318] focus:ring-1 focus:ring-[#0A2318]'
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="bottom" class="h-screen w-screen p-0 border-none bg-[#f2f6f5] flex flex-col overflow-hidden">
      
      <!-- Top Header Bar -->
      <header class="bg-[#0A2318] text-white px-8 py-4 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-6">
          <button 
            @click="close"
            class="h-8 w-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft class="h-5 w-5" />
          </button>
          
          <div class="flex items-center gap-3">
            <span class="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-[#C9A84C]"></span>
              Institutional Onboarding
            </span>
            <div class="h-4 w-px bg-white/10 mx-1"></div>
            <h2 class="text-xl font-serif italic text-white tracking-tight">Create New Savings Group</h2>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Completion <span class="text-[#C9A84C]">0%</span></p>
            <div class="h-1 w-32 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-[#C9A84C] w-0 transition-all duration-500"></div>
            </div>
          </div>
        </div>
      </header>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-12 flex justify-center items-start">
        <div class="w-full max-w-6xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex min-h-[600px] border border-neutral-100">
          
          <!-- Left Sidebar (Visual Identity) -->
          <aside class="w-[340px] bg-[#0A2318] p-8 flex flex-col gap-8 shrink-0">
            <div>
              <div class="flex items-center gap-2.5 text-[#C9A84C] mb-8">
                <LayoutGrid class="h-4 w-4" />
                <span class="text-[11px] font-black uppercase tracking-[0.2em]">Visual Identity</span>
              </div>

              <!-- Logo Upload Area -->
              <div class="relative group">
                <div class="aspect-square rounded-2xl border-2 border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center gap-4 p-6 transition-all group-hover:border-white/20">
                  <div v-if="logoPreview" class="absolute inset-0 p-4">
                    <img :src="logoPreview" class="h-full w-full object-contain rounded-xl" />
                  </div>
                  <template v-else>
                    <div class="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center">
                      <ImageIcon class="h-8 w-8 text-white/20" />
                    </div>
                    <div class="text-center">
                      <p class="text-white font-bold tracking-tight">Upload Logo</p>
                      <p class="text-[11px] text-white/40 mt-1">500 × 500 px recommended</p>
                    </div>
                  </template>
                </div>
                
                <label class="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-[#C9A84C] py-3 text-sm font-bold text-[#0A2318] hover:bg-[#D4B866] transition-all cursor-pointer shadow-lg active:scale-95">
                  <Upload class="h-4 w-4" />
                  Select File
                  <input type="file" class="sr-only" @change="onLogoChange" accept="image/*" />
                </label>
              </div>
            </div>

            <!-- Group Description -->
            <div class="flex flex-col flex-1">
              <label class="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 flex items-center justify-between">
                Group Description *
              </label>
              <div class="relative flex-1 flex flex-col">
                <textarea 
                  v-model="form.description"
                  placeholder="Describe the group's purpose, goals and membership criteria..."
                  class="w-full flex-1 rounded-2xl bg-white/5 p-5 text-sm text-white outline-none border border-white/5 focus:border-white/20 transition-all resize-none placeholder:text-white/20"
                ></textarea>
                <div class="absolute bottom-4 right-4 text-[10px] font-mono text-white/20">
                  {{ form.description.length }}/300
                </div>
              </div>
            </div>
          </aside>

          <!-- Right Content Area (Form) -->
          <main class="flex-1 bg-white p-20 flex flex-col items-center overflow-y-auto">
            <div class="max-w-xl w-full flex flex-col gap-10">
              <!-- Form Header Chips -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 rounded-full bg-[#f2f6f5] px-4 py-1.5">
                  <Users class="h-4 w-4 text-[#0A2318]" />
                  <span class="text-[10px] font-bold uppercase tracking-widest text-[#0A2318]/60">Group Registration</span>
                </div>
                <div class="text-[11px] font-bold text-neutral-400 bg-neutral-50 px-3 py-1 rounded-lg">
                  Step 1 of 1
                </div>
              </div>

              <h1 class="text-4xl font-serif italic text-[#0A2318] tracking-tight">Core Details</h1>

              <form @submit.prevent="handleSubmit" class="space-y-10">
                <!-- Institutional Details -->
                <div class="space-y-6">
                  <div class="flex items-center gap-4">
                    <div class="h-px flex-1 bg-neutral-100"></div>
                    <div class="flex items-center gap-2 text-neutral-400">
                      <LayoutGrid class="h-3.5 w-3.5" />
                      <span class="text-[10px] font-bold uppercase tracking-[0.2em]">Institutional Details</span>
                    </div>
                    <div class="h-px flex-1 bg-neutral-100"></div>
                  </div>

                  <div class="grid grid-cols-1 gap-6">
                    <div class="space-y-2">
                      <Label class="text-xs font-bold uppercase tracking-widest text-neutral-400 p-0">Group Official Name <span class="text-[#C9A84C]">*</span></Label>
                      <div class="relative">
                        <LayoutGrid class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
                        <input 
                          v-model="form.name"
                          type="text" 
                          placeholder="e.g. Kampala Women's Savings Circle" 
                          :class="[inputCls, 'pl-11']"
                          required
                        />
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                      <div class="space-y-2">
                        <Label class="text-xs font-bold uppercase tracking-widest text-neutral-400 p-0">Date Created <span class="text-[#C9A84C]">*</span></Label>
                        <div class="relative">
                          <Calendar class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
                          <input 
                            v-model="form.date_created"
                            type="date" 
                            :class="[inputCls, 'pl-11']"
                            required
                          />
                        </div>
                      </div>
                      <div class="space-y-2">
                        <Label class="text-xs font-bold uppercase tracking-widest text-neutral-400 p-0">Location <span class="text-[#C9A84C]">*</span></Label>
                        <div class="relative">
                          <MapPin class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
                          <input 
                            v-model="form.location"
                            type="text" 
                            placeholder="District, Street" 
                            :class="[inputCls, 'pl-11']"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Communication Protocols -->
                <div class="space-y-6">
                  <div class="flex items-center gap-4">
                    <div class="h-px flex-1 bg-neutral-100"></div>
                    <div class="flex items-center gap-2 text-neutral-400">
                      <Phone class="h-3.5 w-3.5" />
                      <span class="text-[10px] font-bold uppercase tracking-[0.2em]">Communication Protocols</span>
                    </div>
                    <div class="h-px flex-1 bg-neutral-100"></div>
                  </div>

                  <div class="space-y-6">
                    <div class="space-y-2">
                      <Label class="text-xs font-bold uppercase tracking-widest text-neutral-400 p-0">Primary Admin Contact <span class="text-[#C9A84C]">*</span></Label>
                      <PhoneInput 
                        v-model="form.primary_contact"
                        v-model:countryCode="form.primary_contact_country"
                        class="!bg-[#f9fbfb]"
                      />
                    </div>
                    
                    <div class="space-y-2">
                      <Label class="text-xs font-bold uppercase tracking-widest text-neutral-400 p-0">Secondary / Alternative Line <span class="text-neutral-300 font-normal">(optional)</span></Label>
                      <PhoneInput 
                        v-model="form.secondary_contact"
                        v-model:countryCode="form.secondary_contact_country"
                        class="!bg-[#f9fbfb]"
                      />
                    </div>
                  </div>
                </div>
              </form>

              <div class="mt-auto pt-10 flex items-center justify-between border-t border-neutral-50 mb-0">
                <div class="flex items-center gap-2 text-[10px] font-medium text-neutral-400">
                  <ShieldCheck class="h-3.5 w-3.5 text-neutral-300" />
                  SSL encrypted · Wazalendo Sacco
                </div>

                <div class="flex items-center gap-3">
                  <button 
                    @click="close"
                    class="px-8 py-3 text-sm font-bold text-neutral-600 rounded-xl hover:bg-neutral-50 transition-colors border border-neutral-100"
                  >
                    Cancel
                  </button>
                  <button 
                    @click="handleSubmit"
                    :disabled="processing"
                    class="flex items-center gap-3 px-8 py-3 text-sm font-bold text-white bg-[#0A2318] rounded-xl hover:bg-[#0A2318]/90 transition-all shadow-xl active:scale-95 disabled:opacity-70"
                  >
                    <Spinner v-if="processing" class="h-4 w-4" />
                    <UserPlus2 v-else class="h-4 w-4" />
                    Register Group
                  </button>
                </div>
              </div>
            </div>
          </main>

        </div>
      </div>
      
    </SheetContent>
  </Sheet>
</template>

<style scoped>
/* Custom serif font fallback if required */
:deep(.font-serif) {
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
}

/* Custom scrollbar for form */
div::-webkit-scrollbar {
  width: 6px;
}
div::-webkit-scrollbar-track {
  background: transparent;
}
div::-webkit-scrollbar-thumb {
  background: #e5e5e5;
  border-radius: 10px;
}
</style>
