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
  UserPlus2,
  Check
} from 'lucide-vue-next'
import { useSidebar } from '@/Global/ui/sidebar'
import { groupsApi } from '@/tenant/apis/savings'
import { toast } from 'vue-sonner'

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
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

const { state: sidebarState } = useSidebar()

// ─── Form State ──────────────────────────────────────────────────────────────
const initialForm = {
  name: '',
  date_created: '',
  location: '',
  description: '',
  primary_contact_phone: '',
  primary_contact_country_code: 'UG',
  other_contact_phone: '',
  other_contact_country_code: 'UG',
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

function sanitizePhone(value: string) {
  return value.replace(/\D/g, '').slice(0, 9)
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
  if (!form.value.name.trim()) {
    errors.value = { name: 'Group official name is required' }
    toast.error('Please provide a group official name.')
    return
  }

  if (!form.value.primary_contact_phone.trim()) {
    errors.value = { primary_contact_phone: 'Primary admin contact is required' }
    toast.error('Please provide a primary admin contact.')
    return
  }

  if (sanitizePhone(form.value.primary_contact_phone).length !== 9) {
    errors.value = { primary_contact_phone: 'Primary admin contact must be 9 digits' }
    toast.error('Primary admin contact must be exactly 9 digits.')
    return
  }

  if (form.value.other_contact_phone && sanitizePhone(form.value.other_contact_phone).length !== 9) {
    errors.value = { other_contact_phone: 'Secondary contact must be 9 digits' }
    toast.error('Secondary contact must be exactly 9 digits.')
    return
  }

  if (!form.value.description.trim()) {
    errors.value = { description: 'Group description is required' }
    toast.error('Please provide a group description.')
    return
  }
  
  processing.value = true
  errors.value = {}
  
  try {
    const payload = {
      name: form.value.name,
      date_created: form.value.date_created,
      location: form.value.location,
      description: form.value.description,
      primary_contact_phone: form.value.primary_contact_phone,
      primary_contact_country_code: form.value.primary_contact_country_code,
      other_contact_phone: form.value.other_contact_phone,
      other_contact_country_code: form.value.other_contact_country_code,
    }

    let response
    if (logoFile.value) {
      const formData = new FormData()
      Object.entries(payload).forEach(([key, value]) => {
        if (value) formData.append(key, value as string)
      })
      formData.append('image', logoFile.value)
      response = await groupsApi.storeFormData(formData)
    } else {
      response = await groupsApi.store(payload)
    }

    const newGroup = response.data.data || response.data
    emit('success', newGroup)
    resetForm()
    close()
  } catch (error: any) {
    console.error('Failed to register group:', error)
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    } else {
      errors.value = { general: 'Failed to register group. Please try again.' }
    }
  } finally {
    processing.value = false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputCls = 'w-full rounded-2xl border border-neutral-200 bg-[#f4f7f6] px-4 py-3 text-sm text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:bg-white focus:border-[#1d4780] focus:ring-4 focus:ring-[#1d4780]/5'
</script>

<template>
  <Transition
    enter-active-class="transform transition ease-in-out duration-500"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transform transition ease-in-out duration-500"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div 
      v-if="open"
      :class="[
        sidebarState === 'expanded' ? 'ml-[16rem] w-[calc(100vw-16rem)]' : 'ml-[3rem] w-[calc(100vw-3rem)]',
        'fixed top-16 inset-x-0 bottom-0 z-40 bg-white flex flex-col font-sans'
      ]"
    >
      <!-- Main Content Area - Optimized for No Scroll -->
      <div class="flex-1 overflow-hidden px-10 pb-6 pt-6">
        <!-- Integrated Layout Title -->
        <div class="flex items-center justify-between mb-2 max-w-6xl mr-auto ml-6">
          <div class="flex flex-col gap-2">
            <h1 class="text-[26.5px] font-black text-[#1d4780] tracking-tight italic leading-tight">Register Group</h1>
            <p class="text-[10px] text-[#124b30] font-bold uppercase tracking-[0.2em] opacity-40 leading-relaxed -mt-1">Savings Institutional Onboarding Protocol</p>
          </div>
        </div>

        <div class="max-w-6xl mr-auto ml-6 pr-12 flex gap-12">
          <!-- Left Identity Column -->
          <div class="w-[320px] flex flex-col gap-8 shrink-0">
            <!-- Logo Section -->
            <div class="flex flex-col items-center">
              <div class="relative group h-52 w-52">
                <div class="h-full w-full rounded-full border-2 border-dashed border-[#124b30]/30 bg-neutral-50 flex flex-col items-center justify-center gap-3 transition-all group-hover:bg-neutral-100">
                  <div v-if="logoPreview" class="absolute inset-0 p-4">
                    <img :src="logoPreview" class="h-full w-full object-cover rounded-full" />
                  </div>
                  <template v-else>
                    <div class="flex flex-col items-center gap-1.5">
                       <Upload class="h-8 w-8 text-[#124b30]/40" />
                       <span class="text-sm font-bold text-neutral-800 tracking-tight">Upload Logo</span>
                       <span class="text-[10px] text-neutral-400">(500x500px recommended)</span>
                    </div>
                  </template>
                </div>
                
                <label class="mt-5 flex flex-col items-center">
                  <span class="text-xs font-black text-[#124b30] hover:underline cursor-pointer uppercase tracking-[0.2em]">UPLOAD IMAGE</span>
                  <input type="file" class="sr-only" @change="onLogoChange" accept="image/*" />
                </label>
              </div>
            </div>

            <!-- Separator -->
            <div class="my-4 h-0.5 w-full bg-neutral-200"></div>

            <!-- Group Description -->
            <div class="mt-4 flex flex-col gap-2">
              <label class="text-sm font-bold text-neutral-800">
                Group Description <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <textarea 
                  v-model="form.description"
                  placeholder="Describe the group's purpose..."
                  class="w-full h-40 rounded-3xl bg-[#f4f7f6] p-5 text-sm text-neutral-600 outline-none border border-transparent focus:bg-white focus:border-[#124b30]/20 transition-all resize-none placeholder:text-neutral-400"
                ></textarea>
                <div class="absolute bottom-4 right-6 text-[11px] font-bold text-neutral-300">
                  {{ form.description.length }}/300
                </div>
              </div>
              <InputError :message="errors.description" />
            </div>
          </div>

          <!-- Vertical Divider -->
          <div class="w-px bg-neutral-100 self-stretch"></div>

          <!-- Right Form Column -->
          <div class="flex-1 -mt-6 flex flex-col gap-6 pb-2 px-2">
            
            <!-- Institutional Details Section -->
            <div class="space-y-4">
              <div class="flex items-center gap-4">
                <span class="text-xs font-black text-neutral-900 whitespace-nowrap uppercase tracking-[0.2em]">Institutional Details</span>
                <div class="h-px w-full bg-neutral-100"></div>
              </div>

              <div class="space-y-4">
                <div class="space-y-1.5">
                  <Label class="text-xs font-bold text-neutral-800 mb-2 inline-block">
                    Group Official Name <span class="text-red-500">*</span>
                  </Label>
                  <div class="relative">
                    <Users class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input 
                      v-model="form.name"
                      type="text" 
                      placeholder="Enter group name" 
                      :class="[inputCls, 'pl-12 pr-12']"
                    />
                    <div v-if="form.name.length > 3" class="absolute right-4 top-1/2 -translate-y-1/2">
                       <Check class="h-5 w-5 text-[#124b30]" />
                    </div>
                  </div>
                  <InputError :message="errors.name" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-1.5">
                    <Label class="text-xs font-bold text-neutral-800 mb-2 inline-block">Date Created</Label>
                    <div class="relative">
                      <Calendar class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 pointer-events-none z-10" />
                      <input 
                        v-model="form.date_created"
                        type="date" 
                        placeholder="mm/dd/yyyy"
                        :class="[inputCls, 'pl-12']"
                      />
                    </div>
                  </div>
                  <div class="space-y-1.5">
                    <Label class="text-xs font-bold text-neutral-800 mb-2 inline-block">Location</Label>
                    <div class="relative">
                      <MapPin class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <input 
                        v-model="form.location"
                        type="text" 
                        placeholder="Enter location" 
                        :class="[inputCls, 'pl-12']"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Communication Protocols Section -->
            <div class="space-y-4 mt-2">
              <div class="flex items-center gap-4">
                <span class="text-xs font-black text-neutral-900 whitespace-nowrap uppercase tracking-[0.2em]">Communication Protocols</span>
                <div class="h-px w-full bg-neutral-100"></div>
              </div>

              <div class="space-y-4">
                <!-- Primary Admin Contact -->
                <div class="space-y-1.5">
                  <Label class="text-xs font-bold text-neutral-800 mb-2 inline-block">
                    Primary Admin Contact <span class="text-red-500">*</span>
                  </Label>
                  <div class="flex items-center gap-3">
                    <!-- Custom Country Picker Mock UI -->
                    <div class="flex items-center gap-2 rounded-2xl bg-[#f4f7f6] px-4 py-3.5 border border-neutral-200 min-w-[120px]">
                       <img src="https://flagcdn.com/w20/ug.png" class="w-5 h-3 object-contain" />
                       <span class="text-sm font-bold text-neutral-800">+256</span>
                       <ChevronLeft class="h-4 w-4 text-neutral-400 rotate-[-90deg]" />
                    </div>
                    
                    <div class="relative flex-1">
                      <Phone class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <input 
                        v-model="form.primary_contact_phone"
                        type="text"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        maxlength="9"
                        placeholder="Phone number" 
                        :class="[inputCls, 'pl-12 pr-12 border-[#124b30]/30 focus:border-[#124b30]']"
                        @input="form.primary_contact_phone = sanitizePhone(form.primary_contact_phone)"
                      />
                      <div v-if="form.primary_contact_phone.length >= 7" class="absolute right-4 top-1/2 -translate-y-1/2">
                         <Check class="h-5 w-5 text-[#124b30]" />
                      </div>
                    </div>
                    <InputError :message="errors.primary_contact_phone" />
                  </div>
                </div>
                
                <!-- Secondary Admin Contact -->
                <div class="space-y-1.5">
                  <Label class="text-xs font-bold text-neutral-800 mb-2 inline-block">Secondary / Alternative Line <span class="text-neutral-400 font-normal">(Optional)</span></Label>
                  <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2 rounded-2xl bg-[#f4f7f6] px-4 py-3.5 border border-neutral-200 min-w-[120px]">
                       <img src="https://flagcdn.com/w20/ug.png" class="w-5 h-3 object-contain" />
                       <span class="text-sm font-bold text-neutral-800">+256</span>
                       <ChevronLeft class="h-4 w-4 text-neutral-400 rotate-[-90deg]" />
                    </div>
                    
                    <div class="relative flex-1">
                      <Phone class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <input 
                        v-model="form.other_contact_phone"
                        type="text"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        maxlength="9"
                        placeholder="Phone number" 
                        :class="[inputCls, 'pl-12 pr-12']"
                        @input="form.other_contact_phone = sanitizePhone(form.other_contact_phone)"
                      />
                      <div v-if="form.other_contact_phone.length >= 7" class="absolute right-4 top-1/2 -translate-y-1/2">
                         <Check class="h-5 w-5 text-[#124b30]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Footer -->
            <div class="flex items-center justify-between gap-3 mt-4 pt-1">
              <button 
                @click="close"
                class="px-10 py-3.5 text-sm font-bold text-neutral-600 rounded-2xl hover:bg-neutral-50 transition-colors border border-neutral-200"
              >
                Cancel
              </button>
              <button 
                @click="handleSubmit"
                :disabled="processing"
                class="flex items-center gap-3 px-10 py-3.5 text-sm font-bold text-white bg-nfuko-primary rounded-2xl hover:bg-[#1d4780]/90 transition-all shadow-xl shadow-[#1d4780]/10 active:scale-95 disabled:opacity-70"
              >
                <Spinner v-if="processing" class="h-4 w-4" />
                <span v-else>Register Group</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.font-sans {
  font-family: 'Inter', sans-serif;
}

/* Custom scrollbar for form area */
div::-webkit-scrollbar {
  width: 5px;
}
div::-webkit-scrollbar-track {
  background: transparent;
}
div::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
div::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

/* Date input appearance cleanup */
input[type="date"]::-webkit-calendar-picker-indicator {
  opacity: 0;
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

input[type="date"] {
  position: relative;
}
</style>
