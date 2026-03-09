<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import { ArrowLeft, UserCircle2 } from 'lucide-vue-next'
import { Button, Input, Label, InputError, Spinner } from '@/Global'
import PhoneInput from '@/Global/PhoneInput.vue'
import { membersApi } from '@/tenant/apis/members/membersApi'

const router = useRouter()

// ─── Form fields ──────────────────────────────────────────────────────────────
const form = ref({
  member_type: 'new_member',
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
  initial_deposit: '',
  joined_at: '',
  // existing_member extras
  is_shareholder: '',
  savings_product_id: '',
  opening_balance: '',
})

const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)
const processing = ref(false)
const errors = ref<Record<string, string>>({})

const isExisting = computed(() => form.value.member_type === 'existing_member')

// ─── Avatar preview ───────────────────────────────────────────────────────────
function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  avatarFile.value = file
  if (file) {
    avatarPreview.value = URL.createObjectURL(file)
  } else {
    avatarPreview.value = null
  }
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function submit() {
  processing.value = true
  errors.value = {}

  try {
    const payload: Record<string, any> = { ...form.value }

    // Remove empty optional strings so backend validation doesn't trip on them
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') payload[k] = null
    })

    if (avatarFile.value) {
      const fd = new FormData()
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, String(v))
      })
      fd.append('avatar', avatarFile.value)
      await membersApi.storeFormData(fd)
    } else {
      await membersApi.store(payload)
    }

    router.push('/tenant/members')
  } catch (err) {
    if (isAxiosError(err)) {
      const data = err.response?.data as { message?: string; errors?: Record<string, string[]> }
      if (data?.errors) {
        Object.entries(data.errors).forEach(([k, v]) => {
          errors.value[k] = v[0]
        })
      } else {
        errors.value.form = data?.message ?? 'Something went wrong. Please try again.'
      }
    } else {
      errors.value.form = 'Something went wrong. Please try again.'
    }
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f2f6f5] px-6 py-8">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-3">
      <button
        type="button"
        @click="router.push('/tenant/members')"
        class="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 transition-colors"
      >
        <ArrowLeft class="h-5 w-5" />
      </button>
      <h1 class="text-xl font-bold text-neutral-900">Register New Member</h1>
    </div>

    <!-- Form card -->
    <div class="rounded-2xl bg-white shadow-sm p-8">
      <form @submit.prevent="submit">
        <!-- Global error -->
        <div
          v-if="errors.form"
          class="mb-6 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600"
        >
          {{ errors.form }}
        </div>

        <div class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">

          <!-- Member Type -->
          <div class="grid gap-1.5">
            <Label for="member_type">Member type <span class="text-red-500">*</span></Label>
            <div class="relative">
              <select
                id="member_type"
                v-model="form.member_type"
                class="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 pr-10 text-sm text-neutral-800 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
              >
                <option value="new_member">New Member</option>
                <option value="existing_member">Existing Member</option>
              </select>
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">▾</span>
            </div>
            <InputError :message="errors.member_type" />
          </div>

          <!-- Full Name -->
          <div class="grid gap-1.5">
            <Label for="name">Full Name <span class="text-red-500">*</span></Label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="Enter Full name"
              required
              class="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
            />
            <InputError :message="errors.name" />
          </div>

          <!-- Salutation -->
          <div class="grid gap-1.5">
            <Label for="salutation">Salutation</Label>
            <div class="relative">
              <select
                id="salutation"
                v-model="form.salutation"
                class="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 pr-10 text-sm text-neutral-800 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
              >
                <option value="">Select Salutation</option>
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
                <option value="Prof">Prof</option>
              </select>
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">▾</span>
            </div>
            <InputError :message="errors.salutation" />
          </div>

          <!-- Gender -->
          <div class="grid gap-1.5">
            <Label for="gender">Gender <span class="text-red-500">*</span></Label>
            <div class="relative">
              <select
                id="gender"
                v-model="form.gender"
                required
                class="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 pr-10 text-sm text-neutral-800 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">▾</span>
            </div>
            <InputError :message="errors.gender" />
          </div>

          <!-- Date of Birth -->
          <div class="grid gap-1.5">
            <Label for="dob">Date Of Birth</Label>
            <input
              id="dob"
              v-model="form.dob"
              type="date"
              class="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
            />
            <InputError :message="errors.dob" />
          </div>

          <!-- Primary Contact -->
          <div class="grid gap-1.5">
            <Label>Primary Contact <span class="text-red-500">*</span></Label>
            <PhoneInput
              v-model="form.phone"
              v-model:countryCode="form.phone_country"
              placeholder="Contact"
              :error="errors.phone"
            />
            <InputError :message="errors.phone" />
          </div>

          <!-- Other Contact -->
          <div class="grid gap-1.5">
            <Label>Other Contact</Label>
            <PhoneInput
              v-model="form.other_contact"
              v-model:countryCode="form.other_contact_country"
              placeholder="Other Contact"
              :error="errors.other_contact"
            />
            <InputError :message="errors.other_contact" />
          </div>

          <!-- Mobile Money Number -->
          <div class="grid gap-1.5">
            <Label>Mobile Money Number</Label>
            <PhoneInput
              v-model="form.mobile_money_number"
              v-model:countryCode="form.mobile_money_country"
              placeholder="Mobile Money Number"
              :error="errors.mobile_money_number"
            />
            <InputError :message="errors.mobile_money_number" />
          </div>

          <!-- Email -->
          <div class="grid gap-1.5">
            <Label for="email">Email</Label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="Enter Email"
              class="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
            />
            <InputError :message="errors.email" />
          </div>

          <!-- NIN / ID Number -->
          <div class="grid gap-1.5">
            <Label for="id_number">NIN</Label>
            <input
              id="id_number"
              v-model="form.id_number"
              type="text"
              placeholder="Enter NIN"
              class="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
            />
            <InputError :message="errors.id_number" />
          </div>

          <!-- Marital Status -->
          <div class="grid gap-1.5">
            <Label for="marital_status">Marital Status <span class="text-red-500">*</span></Label>
            <div class="relative">
              <select
                id="marital_status"
                v-model="form.marital_status"
                required
                class="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 pr-10 text-sm text-neutral-800 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
              >
                <option value="">Select Marital Status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">▾</span>
            </div>
            <InputError :message="errors.marital_status" />
          </div>

          <!-- Nationality -->
          <div class="grid gap-1.5">
            <Label for="nationality">Nationality <span class="text-red-500">*</span></Label>
            <div class="relative">
              <select
                id="nationality"
                v-model="form.nationality"
                required
                class="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 pr-10 text-sm text-neutral-800 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
              >
                <option value="Ugandan">Uganda</option>
                <option value="Kenyan">Kenya</option>
                <option value="Tanzanian">Tanzania</option>
                <option value="Rwandan">Rwanda</option>
                <option value="Burundian">Burundi</option>
                <option value="South Sudanese">South Sudan</option>
                <option value="Congolese">DR Congo</option>
                <option value="Ethiopian">Ethiopia</option>
                <option value="Somali">Somalia</option>
                <option value="Nigerian">Nigeria</option>
                <option value="Ghanaian">Ghana</option>
                <option value="South African">South Africa</option>
                <option value="British">United Kingdom</option>
                <option value="American">United States</option>
                <option value="Other">Other</option>
              </select>
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">▾</span>
            </div>
            <InputError :message="errors.nationality" />
          </div>

          <!-- Address -->
          <div class="grid gap-1.5">
            <Label for="address">Address <span class="text-red-500">*</span></Label>
            <textarea
              id="address"
              v-model="form.address"
              rows="3"
              placeholder="Location"
              required
              class="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300 resize-none"
            />
            <InputError :message="errors.address" />
          </div>

          <!-- Profile Picture -->
          <div class="grid gap-1.5">
            <Label>Profile Picture <span class="text-neutral-400 font-normal">(Optional)</span></Label>
            <div class="flex items-center gap-4">
              <!-- Preview circle -->
              <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 border border-neutral-200">
                <img v-if="avatarPreview" :src="avatarPreview" class="h-full w-full object-cover" alt="Avatar preview" />
                <UserCircle2 v-else class="h-10 w-10 text-neutral-300" />
              </div>
              <div class="flex flex-col gap-1">
                <label
                  for="avatar"
                  class="inline-flex cursor-pointer items-center rounded-full bg-[#3ab88a] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#32a87e] transition-colors"
                >
                  Choose File
                  <input id="avatar" type="file" accept="image/*" class="sr-only" @change="onAvatarChange" />
                </label>
                <span class="text-xs text-neutral-400">
                  {{ avatarFile ? avatarFile.name : 'No file chosen' }}
                </span>
                <span class="text-xs text-neutral-400">Recommended: Square image, max 2MB.</span>
              </div>
            </div>
            <InputError :message="errors.avatar" />
          </div>

          <!-- Next of Kin -->
          <div class="grid gap-1.5">
            <Label for="next_of_kin">Next of kin</Label>
            <input
              id="next_of_kin"
              v-model="form.next_of_kin"
              type="text"
              placeholder="Enter Next of kin"
              class="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
            />
            <InputError :message="errors.next_of_kin" />
          </div>

          <!-- Next of Kin Contact -->
          <div class="grid gap-1.5">
            <Label>Next of kin contact</Label>
            <PhoneInput
              v-model="form.next_of_kin_contact"
              v-model:countryCode="form.next_of_kin_contact_country"
              placeholder="Enter Next of kin's contact"
              :error="errors.next_of_kin_contact"
            />
            <InputError :message="errors.next_of_kin_contact" />
          </div>

          <!-- Initial Deposit -->
          <div class="grid gap-1.5">
            <Label for="initial_deposit">Initial deposit <span class="text-red-500">*</span></Label>
            <div class="flex overflow-hidden rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-300">
              <span class="flex items-center border-r border-neutral-200 bg-neutral-50 px-4 text-sm font-medium text-neutral-500">UGX</span>
              <input
                id="initial_deposit"
                v-model="form.initial_deposit"
                type="number"
                min="0"
                step="0.01"
                placeholder="Initial deposit"
                required
                class="flex-1 bg-white px-4 py-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
              />
            </div>
            <InputError :message="errors.initial_deposit" />
          </div>

          <!-- Date Joined -->
          <div class="grid gap-1.5">
            <Label for="joined_at">Date Joined <span class="text-neutral-400 font-normal">(Optional)</span></Label>
            <input
              id="joined_at"
              v-model="form.joined_at"
              type="date"
              class="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
            />
            <InputError :message="errors.joined_at" />
          </div>

          <!-- Existing member extras -->
          <template v-if="isExisting">
            <!-- Is Shareholder -->
            <div class="grid gap-1.5">
              <Label for="is_shareholder">Is Shareholder <span class="text-red-500">*</span></Label>
              <div class="relative">
                <select
                  id="is_shareholder"
                  v-model="form.is_shareholder"
                  class="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 pr-10 text-sm text-neutral-800 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">▾</span>
              </div>
              <InputError :message="errors.is_shareholder" />
            </div>

            <!-- Opening Balance -->
            <div class="grid gap-1.5">
              <Label for="opening_balance">Opening Balance <span class="text-red-500">*</span></Label>
              <div class="flex overflow-hidden rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-300">
                <span class="flex items-center border-r border-neutral-200 bg-neutral-50 px-4 text-sm font-medium text-neutral-500">UGX</span>
                <input
                  id="opening_balance"
                  v-model="form.opening_balance"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Opening balance"
                  class="flex-1 bg-white px-4 py-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
                />
              </div>
              <InputError :message="errors.opening_balance" />
            </div>
          </template>

        </div>

        <!-- Footer actions -->
        <div class="mt-8 flex items-center justify-between border-t border-neutral-100 pt-6">
          <button
            type="button"
            @click="router.push('/tenant/members')"
            class="rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="processing"
            class="inline-flex items-center gap-2 rounded-full bg-[#001d22] px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#001d22]/90 transition-colors disabled:opacity-60"
          >
            <Spinner v-if="processing" class="h-4 w-4" />
            Register Member
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
