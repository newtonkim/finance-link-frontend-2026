<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  X,
  ChevronLeft,
  Upload,
  Users,
  Phone,
  Calendar,
  MapPin,
  Check,
} from 'lucide-vue-next'
import { useSidebar } from '@/Global/ui/sidebar'
import { groupsApi } from '@/tenant/apis/savings'
import { toast } from 'vue-sonner'
import { Label, InputError, Spinner } from '@/Global'

interface SavingsGroup {
  id: number
  name: string
  date_created?: string
  location?: string
  description?: string
  primary_contact_phone?: string
  primary_contact_country_code?: string
  other_contact_phone?: string
  other_contact_country_code?: string
  image_url?: string | null
}

const props = defineProps<{
  open: boolean
  group: SavingsGroup | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'success', group: any): void
}>()

const { state: sidebarState } = useSidebar()

const form = ref({
  name: '',
  date_created: '',
  location: '',
  description: '',
  primary_contact_phone: '',
  primary_contact_country_code: 'UG',
  other_contact_phone: '',
  other_contact_country_code: 'UG',
})

const logoFile    = ref<File | null>(null)
const logoPreview = ref<string | null>(null)
const processing  = ref(false)
const errors      = ref<Record<string, string>>({})

// Populate form whenever the group prop changes (or drawer opens)
watch(
  () => [props.open, props.group],
  () => {
    if (props.open && props.group) {
      const g = props.group
      form.value = {
        name:                         g.name ?? '',
        date_created:                 g.date_created ?? '',
        location:                     g.location ?? '',
        description:                  g.description ?? '',
        primary_contact_phone:        g.primary_contact_phone ?? '',
        primary_contact_country_code: g.primary_contact_country_code ?? 'UG',
        other_contact_phone:          g.other_contact_phone ?? '',
        other_contact_country_code:   g.other_contact_country_code ?? 'UG',
      }
      logoFile.value    = null
      logoPreview.value = g.image_url
        ? ((() => { try { return new URL(g.image_url!).pathname } catch { return g.image_url! } })())
        : null
      errors.value = {}
    }
  },
  { immediate: true }
)

function onLogoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  logoFile.value    = file
  logoPreview.value = file ? URL.createObjectURL(file) : null
}

function sanitizePhone(value: string) {
  return value.replace(/\D/g, '').slice(0, 9)
}

function close() {
  emit('update:open', false)
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

  processing.value = true
  errors.value = {}

  try {
    const id = props.group!.id
    const payload = {
      name:                         form.value.name,
      date_created:                 form.value.date_created,
      location:                     form.value.location,
      description:                  form.value.description,
      primary_contact_phone:        form.value.primary_contact_phone,
      primary_contact_country_code: form.value.primary_contact_country_code,
      other_contact_phone:          form.value.other_contact_phone,
      other_contact_country_code:   form.value.other_contact_country_code,
    }

    let response
    if (logoFile.value) {
      const formData = new FormData()
      Object.entries(payload).forEach(([key, value]) => {
        if (value) formData.append(key, value as string)
      })
      formData.append('image', logoFile.value)
      formData.append('_method', 'PUT')
      response = await groupsApi.updateFormData(id, formData)
    } else {
      response = await groupsApi.update(id, payload)
    }

    const updated = response.data?.data ?? response.data
    emit('success', updated)
    toast.success('Group updated successfully.')
    close()
  } catch (error: any) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    } else {
      toast.error(error.response?.data?.message ?? 'Failed to update group.')
    }
  } finally {
    processing.value = false
  }
}

const inputCls = 'w-full rounded-2xl border border-neutral-200 bg-[#f4f7f6] px-4 py-3 text-sm text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:bg-white focus:border-[#0A2318] focus:ring-4 focus:ring-[#0A2318]/5'
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
      <div class="flex-1 overflow-hidden px-10 pb-6 pt-6">

        <!-- Header -->
        <div class="flex items-center justify-between mb-2 max-w-6xl mr-auto ml-6">
          <div class="flex flex-col gap-2">
            <h1 class="text-[26.5px] font-black text-[#0A2318] tracking-tight italic leading-tight">Edit Group</h1>
            <p class="text-[10px] text-[#124b30] font-bold uppercase tracking-[0.2em] opacity-40 leading-relaxed -mt-1">Update Savings Group Details</p>
          </div>
          <button @click="close" class="rounded-full p-2 hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-600">
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="max-w-6xl mr-auto ml-6 pr-12 flex gap-12">

          <!-- Left: Logo + Description -->
          <div class="w-[320px] flex flex-col gap-8 shrink-0">
            <!-- Logo -->
            <div class="flex flex-col items-center">
              <div class="relative group h-52 w-52">
                <div class="h-full w-full rounded-full border-2 border-dashed border-[#124b30]/30 bg-neutral-50 flex flex-col items-center justify-center gap-3 transition-all group-hover:bg-neutral-100 overflow-hidden">
                  <img v-if="logoPreview" :src="logoPreview" class="h-full w-full object-cover rounded-full" />
                  <template v-else>
                    <div class="flex flex-col items-center gap-1.5">
                      <Upload class="h-8 w-8 text-[#124b30]/40" />
                      <span class="text-sm font-bold text-neutral-800 tracking-tight">Upload Logo</span>
                      <span class="text-[10px] text-neutral-400">(500×500px recommended)</span>
                    </div>
                  </template>
                </div>
                <label class="mt-5 flex flex-col items-center cursor-pointer">
                  <span class="text-xs font-black text-[#124b30] hover:underline uppercase tracking-[0.2em]">CHANGE IMAGE</span>
                  <input type="file" class="sr-only" @change="onLogoChange" accept="image/*" />
                </label>
              </div>
            </div>

            <div class="my-4 h-0.5 w-full bg-neutral-200"></div>

            <!-- Description -->
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

          <!-- Vertical divider -->
          <div class="w-px bg-neutral-100 self-stretch"></div>

          <!-- Right: Fields -->
          <div class="flex-1 -mt-6 flex flex-col gap-6 pb-2 px-2">

            <!-- Institutional Details -->
            <div class="space-y-4">
              <div class="flex items-center gap-4">
                <span class="text-xs font-black text-neutral-900 whitespace-nowrap uppercase tracking-[0.2em]">Institutional Details</span>
                <div class="h-px w-full bg-neutral-100"></div>
              </div>

              <div class="space-y-4">
                <!-- Name -->
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

                <!-- Date + Location -->
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-1.5">
                    <Label class="text-xs font-bold text-neutral-800 mb-2 inline-block">Date Created</Label>
                    <div class="relative">
                      <Calendar class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 pointer-events-none z-10" />
                      <input
                        v-model="form.date_created"
                        type="date"
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

            <!-- Communication Protocols -->
            <div class="space-y-4 mt-2">
              <div class="flex items-center gap-4">
                <span class="text-xs font-black text-neutral-900 whitespace-nowrap uppercase tracking-[0.2em]">Communication Protocols</span>
                <div class="h-px w-full bg-neutral-100"></div>
              </div>

              <div class="space-y-4">
                <!-- Primary contact -->
                <div class="space-y-1.5">
                  <Label class="text-xs font-bold text-neutral-800 mb-2 inline-block">
                    Primary Admin Contact <span class="text-red-500">*</span>
                  </Label>
                  <div class="flex items-center gap-3">
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
                  </div>
                  <InputError :message="errors.primary_contact_phone" />
                </div>

                <!-- Secondary contact -->
                <div class="space-y-1.5">
                  <Label class="text-xs font-bold text-neutral-800 mb-2 inline-block">
                    Secondary / Alternative Line <span class="text-neutral-400 font-normal">(Optional)</span>
                  </Label>
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

            <!-- Footer actions -->
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
                class="flex items-center gap-3 px-10 py-3.5 text-sm font-bold text-white bg-nfuko-primary rounded-2xl hover:bg-[#0A2318]/90 transition-all shadow-xl shadow-[#0A2318]/10 active:scale-95 disabled:opacity-70"
              >
                <Spinner v-if="processing" class="h-4 w-4" />
                <span v-else>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
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
