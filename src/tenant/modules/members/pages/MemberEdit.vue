<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { isAxiosError } from 'axios'
import { ArrowLeft, UserCircle2 } from 'lucide-vue-next'
import { Label, InputError, Spinner } from '@/Global'
import PhoneInput from '@/Global/PhoneInput.vue'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import { membersApi } from '@/tenant/apis/members/membersApi'

const router = useRouter()
const route = useRoute()
const memberId = computed(() => Number(route.params.id))

// ─── Select options ────────────────────────────────────────────────────────────
const salutationOptions = [{ id: 'Mr', name: 'Mr' }, { id: 'Mrs', name: 'Mrs' }, { id: 'Ms', name: 'Ms' }, { id: 'Dr', name: 'Dr' }, { id: 'Prof', name: 'Prof' }]
const genderOptions = [{ id: 'male', name: 'Male' }, { id: 'female', name: 'Female' }, { id: 'other', name: 'Other' }]
const maritalOptions = [{ id: 'single', name: 'Single' }, { id: 'married', name: 'Married' }, { id: 'divorced', name: 'Divorced' }, { id: 'widowed', name: 'Widowed' }]
const nationalityOptions = [
  { id: 'Ugandan', name: 'Uganda' }, { id: 'Kenyan', name: 'Kenya' },
  { id: 'Tanzanian', name: 'Tanzania' }, { id: 'Rwandan', name: 'Rwanda' },
  { id: 'Burundian', name: 'Burundi' }, { id: 'South Sudanese', name: 'South Sudan' },
  { id: 'Congolese', name: 'DR Congo' }, { id: 'Ethiopian', name: 'Ethiopia' },
  { id: 'Somali', name: 'Somalia' }, { id: 'Nigerian', name: 'Nigeria' },
  { id: 'Ghanaian', name: 'Ghana' }, { id: 'South African', name: 'South Africa' },
  { id: 'British', name: 'United Kingdom' }, { id: 'American', name: 'United States' },
  { id: 'Indian', name: 'India' }, { id: 'Other', name: 'Other' },
]

// ─── State ────────────────────────────────────────────────────────────────────
const pageLoading = ref(true)
const processing = ref(false)
const errors = ref<Record<string, string>>({})

const form = ref({
  name: '',
  salutation: '',
  gender: '',
  dob: '',
  phone: '',
  phone_country: 'UG',
  other_contact: '',
  other_contact_country: 'UG',
  mobile_money_number: '',
  mobile_money_country: 'UG',
  email: '',
  id_number: '',
  marital_status: '',
  nationality: 'Ugandan',
  address: '',
  next_of_kin: '',
  next_of_kin_contact: '',
  next_of_kin_contact_country: 'UG',
  joined_at: '',
  member_type: 'individual',
})

const existingAvatarUrl = ref<string | null>(null)
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDateForInput(dateStr: string | null | undefined) {
  if (!dateStr) return ''
  // Extracts YYYY-MM-DD from ISO strings like "2024-03-10T11:00:00Z"
  return (dateStr as string).split('T')[0] as string
}

// ─── Load member ──────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const res = await membersApi.show(memberId.value)
    const body = res.data
    const data = body?.data?.member ?? body?.member ?? body?.data ?? body ?? {}

    form.value = {
      name: data.name ?? '',
      salutation: data.salutation ?? '',
      gender: data.gender ?? '',
      dob: formatDateForInput(data.dob),
      phone: data.phone ?? '',
      phone_country: data.phone_country ?? 'UG',
      other_contact: data.other_contact ?? '',
      other_contact_country: data.other_contact_country ?? 'UG',
      mobile_money_number: data.mobile_money_number ?? '',
      mobile_money_country: data.mobile_money_country ?? 'UG',
      email: data.email ?? '',
      id_number: data.id_number ?? '',
      marital_status: data.marital_status ?? '',
      nationality: data.nationality ?? 'Ugandan',
      address: data.address ?? '',
      next_of_kin: data.next_of_kin ?? '',
      next_of_kin_contact: data.next_of_kin_contact ?? '',
      next_of_kin_contact_country: data.next_of_kin_contact_country ?? 'UG',
      joined_at: formatDateForInput(data.joined_at),
      member_type: data.member_type ?? 'individual',
    }
    existingAvatarUrl.value = data.avatar_url ?? null
  } catch (err) {
    console.error('Error loading member:', err)
    errors.value.form = 'Failed to load member data.'
  } finally {
    pageLoading.value = false
  }
})

// ─── Avatar ───────────────────────────────────────────────────────────────────
function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  avatarFile.value = file
  avatarPreview.value = file ? URL.createObjectURL(file) : null
}

const displayAvatar = computed(() => avatarPreview.value ?? existingAvatarUrl.value)

// ─── Submit ───────────────────────────────────────────────────────────────────
async function submit() {
  processing.value = true
  errors.value = {}
  try {
    const payload: Record<string, any> = { ...form.value }

    // Convert empty strings to empty strings for API (some backends prefer null, but Laravel often works well with empty strings for nullable fields)
    // Actually, let's keep them as strings. String(null) is "null" which is BAD.

    if (avatarFile.value) {
      const fd = new FormData()
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          fd.append(k, String(v))
        } else {
          fd.append(k, '') // Send empty string for null/undefined to clear field if needed
        }
      })
      fd.append('avatar', avatarFile.value)
      fd.append('_method', 'PUT')
      await membersApi.updateFormData(memberId.value, fd)
    } else {
      await membersApi.update(memberId.value, payload)
    }
    router.push(`/tenant/members/${memberId.value}`)
  } catch (err) {
    if (isAxiosError(err)) {
      console.error('Validation/API Error:', err.response?.data)
      const data = err.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
      if (data?.errors) {
        Object.entries(data.errors).forEach(([k, v]) => {
          if (v && v.length > 0) errors.value[k] = v[0] as string
        })
      } else {
        errors.value.form = data?.message ?? 'Something went wrong.'
      }
    } else {
      console.error('Submit error:', err)
      errors.value.form = 'Something went wrong.'
    }
  } finally {
    processing.value = false
  }
}

const inputCls = 'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300'
</script>

<template>
  <div class="min-h-screen bg-[#f2f6f5] px-6 py-8">
    <!-- Page header -->
    <div class="mb-6 flex items-center gap-3">
      <button type="button" @click="router.push(`/tenant/members/${memberId}`)"
        class="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 transition-colors">
        <ArrowLeft class="h-5 w-5" />
      </button>
      <h1 class="text-xl font-bold text-neutral-900">Edit Member</h1>
    </div>

    <!-- Loading -->
    <div v-if="pageLoading" class="flex items-center justify-center py-24">
      <Spinner class="h-8 w-8  text-nfuko-primary" />
    </div>

    <!-- Card -->
    <div v-else class="rounded-2xl bg-white shadow-sm p-8">
      <form @submit.prevent="submit">
        <!-- Global error -->
        <div v-if="errors.form" class="mb-6 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {{ errors.form }}
        </div>

        <div class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">

          <!-- Full Name -->
          <div class="grid gap-1.5">
            <Label for="name">Full Name <span class="text-red-500">*</span></Label>
            <input id="name" v-model="form.name" type="text" placeholder="Enter Full name" required :class="inputCls" />
            <InputError :message="errors.name" />
          </div>

          <!-- Salutation -->
          <div class="grid gap-1.5">
            <Label>Salutation</Label>
            <SearchableSelect v-model="form.salutation" :options="salutationOptions" placeholder="Select Salutation"
              state="member-edit-salutation" :error="errors.salutation" />
            <InputError :message="errors.salutation" />
          </div>

          <!-- Gender -->
          <div class="grid gap-1.5">
            <Label>Gender <span class="text-red-500">*</span></Label>
            <SearchableSelect v-model="form.gender" :options="genderOptions" placeholder="Select Gender"
              state="member-edit-gender" :error="errors.gender" />
            <InputError :message="errors.gender" />
          </div>

          <!-- Date of Birth -->
          <div class="grid gap-1.5">
            <Label for="dob">Date Of Birth</Label>
            <input id="dob" v-model="form.dob" type="date" :class="inputCls" />
            <InputError :message="errors.dob" />
          </div>

          <!-- Primary Contact -->
          <div class="grid gap-1.5">
            <Label>Primary Contact <span class="text-red-500">*</span></Label>
            <PhoneInput v-model="form.phone" v-model:countryCode="form.phone_country" placeholder="Contact"
              :error="errors.phone" />
            <InputError :message="errors.phone" />
          </div>

          <!-- Other Contact -->
          <div class="grid gap-1.5">
            <Label>Other Contact</Label>
            <PhoneInput v-model="form.other_contact" v-model:countryCode="form.other_contact_country"
              placeholder="Other Contact" :error="errors.other_contact" />
            <InputError :message="errors.other_contact" />
          </div>

          <!-- Mobile Money -->
          <div class="grid gap-1.5">
            <Label>Mobile Money Number</Label>
            <PhoneInput v-model="form.mobile_money_number" v-model:countryCode="form.mobile_money_country"
              placeholder="Mobile Money Number" :error="errors.mobile_money_number" />
            <InputError :message="errors.mobile_money_number" />
          </div>

          <!-- Email -->
          <div class="grid gap-1.5">
            <Label for="email">Email</Label>
            <input id="email" v-model="form.email" type="email" placeholder="Enter Email" :class="inputCls" />
            <InputError :message="errors.email" />
          </div>

          <!-- NIN -->
          <div class="grid gap-1.5">
            <Label for="id_number">NIN</Label>
            <input id="id_number" v-model="form.id_number" type="text" placeholder="Enter NIN" :class="inputCls" />
            <InputError :message="errors.id_number" />
          </div>

          <!-- Marital Status -->
          <div class="grid gap-1.5">
            <Label>Marital Status <span class="text-red-500">*</span></Label>
            <SearchableSelect v-model="form.marital_status" :options="maritalOptions"
              placeholder="Select Marital Status" state="member-edit-marital-status" :error="errors.marital_status" />
            <InputError :message="errors.marital_status" />
          </div>

          <!-- Nationality -->
          <div class="grid gap-1.5">
            <Label>Nationality <span class="text-red-500">*</span></Label>
            <SearchableSelect v-model="form.nationality" :options="nationalityOptions" placeholder="Select Nationality"
              state="member-edit-nationality" :error="errors.nationality" />
            <InputError :message="errors.nationality" />
          </div>

          <!-- Date Joined -->
          <div class="grid gap-1.5">
            <Label for="joined_at">Date Joined</Label>
            <input id="joined_at" v-model="form.joined_at" type="date" :class="inputCls" />
            <InputError :message="errors.joined_at" />
          </div>

          <!-- Address -->
          <div class="grid gap-1.5">
            <Label for="address">Address <span class="text-red-500">*</span></Label>
            <textarea id="address" v-model="form.address" rows="3" placeholder="Location" required
              class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300 resize-none" />
            <InputError :message="errors.address" />
          </div>

          <!-- Profile Picture -->
          <div class="grid gap-1.5">
            <Label>Profile Picture <span class="text-neutral-400 font-normal">(Optional)</span></Label>
            <div class="flex items-center gap-4">
              <div
                class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 border border-neutral-200">
                <img v-if="displayAvatar" :src="displayAvatar" class="h-full w-full object-cover" alt="Avatar" />
                <UserCircle2 v-else class="h-10 w-10 text-neutral-300" />
              </div>
              <div class="flex flex-col gap-1">
                <label for="avatar"
                  class="inline-flex cursor-pointer items-center rounded-full bg-[#3ab88a] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#32a87e] transition-colors">
                  Choose File
                  <input id="avatar" type="file" accept="image/*" class="sr-only" @change="onAvatarChange" />
                </label>
                <span class="text-xs text-neutral-400">{{ avatarFile ? avatarFile.name : 'No file chosen' }}</span>
                <span class="text-xs text-neutral-400">Recommended: Square image, max 2MB.</span>
              </div>
            </div>
            <InputError :message="errors.avatar" />
          </div>

          <!-- Next of Kin -->
          <div class="grid gap-1.5">
            <Label for="next_of_kin">Next of Kin</Label>
            <input id="next_of_kin" v-model="form.next_of_kin" type="text" placeholder="Enter Next of kin"
              :class="inputCls" />
            <InputError :message="errors.next_of_kin" />
          </div>

          <!-- Next of Kin Contact -->
          <div class="grid gap-1.5">
            <Label>Next of Kin Contact</Label>
            <PhoneInput v-model="form.next_of_kin_contact" v-model:countryCode="form.next_of_kin_contact_country"
              placeholder="Enter Next of kin's contact" :error="errors.next_of_kin_contact" />
            <InputError :message="errors.next_of_kin_contact" />
          </div>

        </div>

        <!-- Footer -->
        <div class="mt-8 flex items-center justify-between border-t border-neutral-100 pt-6">
          <button type="button" @click="router.push(`/tenant/members/${memberId}`)"
            class="rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button type="submit" :disabled="processing"
            class="inline-flex items-center gap-2 rounded-full  bg-[#052659] px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover: bg-[#052659]/90 transition-colors disabled:opacity-60">
            <Spinner v-if="processing" class="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
