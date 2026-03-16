<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import { ArrowLeft, UserCircle2, Share2, AlertCircle, TrendingUp, Wallet } from 'lucide-vue-next'
import { Label, InputError, Spinner } from '@/Global'
import PhoneInput from '@/Global/PhoneInput.vue'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import { membersApi } from '@/tenant/apis/members/membersApi'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { useSettingsStore } from '@/stores/settingsStore'
import { useCurrencyStore } from '@/stores/currency'

const settingsStore = useSettingsStore()
const currencyStore = useCurrencyStore()
const { currencyCode } = storeToRefs(currencyStore)

const router = useRouter()

const staffList = ref<Array<{ id: number; name: string; role: string }>>([])

onMounted(async () => {
  settingsStore.fetchOnboardingSettings()
  try {
    const res = await tenantClient.get('/members/create')
    staffList.value = res.data?.data?.staff ?? []
  } catch {
    // non-critical, staff list will just be empty
  }
})

// ─── Select options ───────────────────────────────────────────────────────────
const memberTypeOptions   = [{ id: 'new_member', name: 'New Member' }, { id: 'existing_member', name: 'Existing Member' }]
const salutationOptions   = [{ id: 'Mr', name: 'Mr' }, { id: 'Mrs', name: 'Mrs' }, { id: 'Ms', name: 'Ms' }, { id: 'Dr', name: 'Dr' }, { id: 'Prof', name: 'Prof' }]
const genderOptions       = [{ id: 'male', name: 'Male' }, { id: 'female', name: 'Female' }, { id: 'other', name: 'Other' }]
const maritalOptions      = [{ id: 'single', name: 'Single' }, { id: 'married', name: 'Married' }, { id: 'divorced', name: 'Divorced' }, { id: 'widowed', name: 'Widowed' }]
const shareholderOptions  = [{ id: 'yes', name: 'Yes' }, { id: 'no', name: 'No' }]
const nationalityOptions  = [
  { id: 'Ugandan', name: 'Uganda' }, { id: 'Kenyan', name: 'Kenya' },
  { id: 'Tanzanian', name: 'Tanzania' }, { id: 'Rwandan', name: 'Rwanda' },
  { id: 'Burundian', name: 'Burundi' }, { id: 'South Sudanese', name: 'South Sudan' },
  { id: 'Congolese', name: 'DR Congo' }, { id: 'Ethiopian', name: 'Ethiopia' },
  { id: 'Somali', name: 'Somalia' }, { id: 'Nigerian', name: 'Nigeria' },
  { id: 'Ghanaian', name: 'Ghana' }, { id: 'South African', name: 'South Africa' },
  { id: 'British', name: 'United Kingdom' }, { id: 'American', name: 'United States' },
  { id: 'Indian', name: 'India' }, { id: 'Other', name: 'Other' },
]

// ─── Form state ───────────────────────────────────────────────────────────────
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
  is_shareholder: '',
  savings_product_id: '',
  opening_balance: '',
  shares_quantity: '' as string | number,
  referred_by: '' as string | number,
})

const avatarFile    = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)
const processing    = ref(false)
const errors        = ref<Record<string, string>>({})

const isExisting = computed(() => form.value.member_type === 'existing_member')

// ─── Shares onboarding ────────────────────────────────────────────────────────
const sharesRequired = computed(() => {
  if (!settingsStore.sharesCompulsory) return false
  if (!isExisting.value) return true
  return settingsStore.sharesCompulsoryAppliesToExisting
})

const sharesTotalAmount = computed(() => {
  const qty = Number(form.value.shares_quantity) || 0
  return qty * settingsStore.sharePrice
})

const sharesError = computed(() => {
  if (!sharesRequired.value) return ''
  const qty = Number(form.value.shares_quantity)
  if (!qty || qty <= 0) return `At least ${settingsStore.minSharesOnOnboarding} share(s) required.`
  if (qty < settingsStore.minSharesOnOnboarding) {
    return `Minimum ${settingsStore.minSharesOnOnboarding} share(s) required (${currencyCode.value} ${(settingsStore.minSharesOnOnboarding * settingsStore.sharePrice).toLocaleString()}).`
  }
  return ''
})

// ─── Avatar ───────────────────────────────────────────────────────────────────
function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  avatarFile.value = file
  avatarPreview.value = file ? URL.createObjectURL(file) : null
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function submit() {
  if (sharesRequired.value && sharesError.value) return
  processing.value = true
  errors.value = {}
  try {
    const payload: Record<string, any> = { ...form.value }
    Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null })

    if (avatarFile.value) {
      const fd = new FormData()
      Object.entries(payload).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, String(v)) })
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
        Object.entries(data.errors).forEach(([k, v]) => { errors.value[k] = v[0] ?? '' })
      } else {
        errors.value.form = data?.message ?? 'Something went wrong.'
      }
    } else {
      errors.value.form = 'Something went wrong.'
    }
  } finally {
    processing.value = false
  }
}

// ─── Shared input class ───────────────────────────────────────────────────────
const inputCls = 'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300'
</script>

<template>
  <div class="min-h-screen bg-[#f2f6f5] px-6 py-8">
    <!-- Page header -->
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

    <!-- Card -->
    <div class="rounded-2xl bg-white shadow-sm p-8">
      <form @submit.prevent="submit">
        <!-- Global error -->
        <div v-if="errors.form" class="mb-6 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {{ errors.form }}
        </div>

        <div class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">

          <!-- ── Row 1 ── Member Type + (Full Name | Is a Shareholder) ───────── -->

          <div class="grid gap-1.5">
            <Label>Member type <span class="text-red-500">*</span></Label>
            <SearchableSelect
              v-model="form.member_type"
              :options="memberTypeOptions"
              placeholder="Select Member Type"
              :error="errors.member_type"
            />
          </div>

          <!-- New Member: Full Name in col 2 of row 1 -->
          <div v-if="!isExisting" class="grid gap-1.5">
            <Label for="name">Full Name <span class="text-red-500">*</span></Label>
            <input id="name" v-model="form.name" type="text" placeholder="Enter Full name" required :class="inputCls" />
            <InputError :message="errors.name" />
          </div>

          <!-- Existing Member: Is a Shareholder in col 2 of row 1 -->
          <div v-else-if="!settingsStore.hideIsShareholderField" class="grid gap-1.5">
            <Label>Is a shareholder <span class="text-red-500">*</span></Label>
            <SearchableSelect
              v-model="form.is_shareholder"
              :options="shareholderOptions"
              placeholder="Select"
              :error="errors.is_shareholder"
            />
          </div>

          <!-- ── Existing Member: Full Name + Salutation in row 2 ─────────── -->
          <template v-if="isExisting">
            <div class="grid gap-1.5">
              <Label for="name-ex">Full Name <span class="text-red-500">*</span></Label>
              <input id="name-ex" v-model="form.name" type="text" placeholder="Enter Full name" required :class="inputCls" />
              <InputError :message="errors.name" />
            </div>
            <div class="grid gap-1.5">
              <Label>Salutation</Label>
              <SearchableSelect v-model="form.salutation" :options="salutationOptions" placeholder="Select Salutation" :error="errors.salutation" />
            </div>
          </template>

          <!-- ── New Member: Salutation + Gender ──────────────────────────── -->
          <template v-else>
            <div class="grid gap-1.5">
              <Label>Salutation</Label>
              <SearchableSelect v-model="form.salutation" :options="salutationOptions" placeholder="Select Salutation" :error="errors.salutation" />
            </div>
            <div class="grid gap-1.5">
              <Label>Gender <span class="text-red-500">*</span></Label>
              <SearchableSelect v-model="form.gender" :options="genderOptions" placeholder="Select Gender" :error="errors.gender" />
            </div>
          </template>

          <!-- ── Existing: Gender + DOB  |  New: DOB + Primary Contact ───── -->
          <template v-if="isExisting">
            <div class="grid gap-1.5">
              <Label>Gender <span class="text-red-500">*</span></Label>
              <SearchableSelect v-model="form.gender" :options="genderOptions" placeholder="Select Gender" :error="errors.gender" />
            </div>
            <div class="grid gap-1.5">
              <Label for="dob-ex">Date Of birth</Label>
              <input id="dob-ex" v-model="form.dob" type="date" :class="inputCls" />
              <InputError :message="errors.dob" />
            </div>
          </template>

          <template v-else>
            <div class="grid gap-1.5">
              <Label for="dob">Date Of Birth</Label>
              <input id="dob" v-model="form.dob" type="date" :class="inputCls" />
              <InputError :message="errors.dob" />
            </div>
            <div class="grid gap-1.5">
              <Label>Primary Contact <span class="text-red-500">*</span></Label>
              <PhoneInput v-model="form.phone" v-model:countryCode="form.phone_country" placeholder="Contact" :error="errors.phone" />
              <InputError :message="errors.phone" />
            </div>
          </template>

          <!-- ── Existing: Primary + Other  |  New: Other + Mobile Money ─── -->
          <template v-if="isExisting">
            <div class="grid gap-1.5">
              <Label>Primary Contact <span class="text-red-500">*</span></Label>
              <PhoneInput v-model="form.phone" v-model:countryCode="form.phone_country" placeholder="Contact" :error="errors.phone" />
              <InputError :message="errors.phone" />
            </div>
            <div class="grid gap-1.5">
              <Label>Other Contact</Label>
              <PhoneInput v-model="form.other_contact" v-model:countryCode="form.other_contact_country" placeholder="Other Contact" :error="errors.other_contact" />
              <InputError :message="errors.other_contact" />
            </div>
          </template>

          <template v-else>
            <div class="grid gap-1.5">
              <Label>Other Contact</Label>
              <PhoneInput v-model="form.other_contact" v-model:countryCode="form.other_contact_country" placeholder="Other Contact" :error="errors.other_contact" />
              <InputError :message="errors.other_contact" />
            </div>
            <div class="grid gap-1.5">
              <Label>Mobile Money Number</Label>
              <PhoneInput v-model="form.mobile_money_number" v-model:countryCode="form.mobile_money_country" placeholder="Mobile Money Number" :error="errors.mobile_money_number" />
              <InputError :message="errors.mobile_money_number" />
            </div>
          </template>

          <!-- ── Existing: Mobile + Email  |  New: Email + NIN ────────────── -->
          <template v-if="isExisting">
            <div class="grid gap-1.5">
              <Label>Mobile Money Number</Label>
              <PhoneInput v-model="form.mobile_money_number" v-model:countryCode="form.mobile_money_country" placeholder="Mobile Money Number" :error="errors.mobile_money_number" />
              <InputError :message="errors.mobile_money_number" />
            </div>
            <div class="grid gap-1.5">
              <Label for="email-ex">Email</Label>
              <input id="email-ex" v-model="form.email" type="email" placeholder="Enter Email" :class="inputCls" />
              <InputError :message="errors.email" />
            </div>
          </template>

          <template v-else>
            <div class="grid gap-1.5">
              <Label for="email">Email</Label>
              <input id="email" v-model="form.email" type="email" placeholder="Enter Email" :class="inputCls" />
              <InputError :message="errors.email" />
            </div>
            <div class="grid gap-1.5">
              <Label for="nin">NIN</Label>
              <input id="nin" v-model="form.id_number" type="text" placeholder="Enter NIN" :class="inputCls" />
              <InputError :message="errors.id_number" />
            </div>
          </template>

          <!-- ── Existing: NIN + Marital  |  New: Marital + Nationality ───── -->
          <template v-if="isExisting">
            <div class="grid gap-1.5">
              <Label for="nin-ex">NIN</Label>
              <input id="nin-ex" v-model="form.id_number" type="text" placeholder="Enter NIN" :class="inputCls" />
              <InputError :message="errors.id_number" />
            </div>
            <div class="grid gap-1.5">
              <Label>Marital Status <span class="text-red-500">*</span></Label>
              <SearchableSelect v-model="form.marital_status" :options="maritalOptions" placeholder="Select Marital Status" :error="errors.marital_status" />
            </div>
          </template>

          <template v-else>
            <div class="grid gap-1.5">
              <Label>Marital Status <span class="text-red-500">*</span></Label>
              <SearchableSelect v-model="form.marital_status" :options="maritalOptions" placeholder="Select Marital Status" :error="errors.marital_status" />
            </div>
            <div class="grid gap-1.5">
              <Label>Nationality <span class="text-red-500">*</span></Label>
              <SearchableSelect v-model="form.nationality" :options="nationalityOptions" placeholder="Select Nationality" :error="errors.nationality" />
            </div>
          </template>

          <!-- ── Existing: Nationality + Address  |  New: Address + Avatar ── -->
          <template v-if="isExisting">
            <div class="grid gap-1.5">
              <Label>Nationality <span class="text-red-500">*</span></Label>
              <SearchableSelect v-model="form.nationality" :options="nationalityOptions" placeholder="Select Nationality" :error="errors.nationality" />
            </div>
            <div class="grid gap-1.5">
              <Label for="address-ex">Address <span class="text-red-500">*</span></Label>
              <textarea id="address-ex" v-model="form.address" rows="3" placeholder="Location" required class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300 resize-none" />
              <InputError :message="errors.address" />
            </div>
          </template>

          <template v-else>
            <div class="grid gap-1.5">
              <Label for="address">Address <span class="text-red-500">*</span></Label>
              <textarea id="address" v-model="form.address" rows="3" placeholder="Location" required class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300 resize-none" />
              <InputError :message="errors.address" />
            </div>
            <!-- Profile Picture (New Member only in this row) -->
            <div class="grid gap-1.5">
              <Label>Profile Picture <span class="text-neutral-400 font-normal">(Optional)</span></Label>
              <div class="flex items-center gap-4">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 border border-neutral-200">
                  <img v-if="avatarPreview" :src="avatarPreview" class="h-full w-full object-cover" alt="Avatar" />
                  <UserCircle2 v-else class="h-10 w-10 text-neutral-300" />
                </div>
                <div class="flex flex-col gap-1">
                  <label for="avatar-new" class="inline-flex cursor-pointer items-center rounded-full bg-[#3ab88a] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#32a87e] transition-colors">
                    Choose File
                    <input id="avatar-new" type="file" accept="image/*" class="sr-only" @change="onAvatarChange" />
                  </label>
                  <span class="text-xs text-neutral-400">{{ avatarFile ? avatarFile.name : 'No file chosen' }}</span>
                  <span class="text-xs text-neutral-400">Recommended: Square image, max 2MB.</span>
                </div>
              </div>
              <InputError :message="errors.avatar" />
            </div>
          </template>

          <!-- ── Next of Kin (same for both) ──────────────────────────────── -->
          <div class="grid gap-1.5">
            <Label for="next_of_kin">Next of kin</Label>
            <input id="next_of_kin" v-model="form.next_of_kin" type="text" placeholder="Enter Next of kin" :class="inputCls" />
            <InputError :message="errors.next_of_kin" />
          </div>

          <div class="grid gap-1.5">
            <Label>Next of kin contact</Label>
            <PhoneInput v-model="form.next_of_kin_contact" v-model:countryCode="form.next_of_kin_contact_country" placeholder="Enter Next of kin's contact" :error="errors.next_of_kin_contact" />
            <InputError :message="errors.next_of_kin_contact" />
          </div>

          <!-- ── Initial Deposit + Date Joined ─────────────────────────────── -->
          <!-- Initial deposit only shown when auto-create savings is ON and field is not hidden -->
          <div v-if="settingsStore.autoCreateSavingsAccount && !settingsStore.hideInitialDeposit" class="grid gap-1.5">
            <Label for="initial_deposit">Initial deposit <span class="text-red-500">*</span></Label>
            <div class="flex overflow-hidden rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-300">
              <span class="flex items-center border-r border-neutral-200 bg-neutral-50 px-4 text-sm font-medium text-neutral-500">{{ currencyCode }}</span>
              <input id="initial_deposit" v-model="form.initial_deposit" type="number" min="0" step="0.01" placeholder="Initial deposit" class="flex-1 bg-white px-4 py-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400" />
            </div>
            <InputError :message="errors.initial_deposit" />
          </div>

          <div class="grid gap-1.5">
            <Label for="joined_at">Date Joined <span class="text-neutral-400 font-normal">(Optional)</span></Label>
            <input id="joined_at" v-model="form.joined_at" type="date" :class="inputCls" />
            <InputError :message="errors.joined_at" />
          </div>

          <!-- ── Referred By (Staff who recruited the member) ───────────────── -->
          <div class="sm:col-span-2 grid gap-1.5">
            <Label>Referred By <span class="text-neutral-400 font-normal">(Staff who brought this member)</span></Label>
            <SearchableSelect
              v-model="form.referred_by"
              :options="staffList.map(s => ({ id: s.id, name: s.name + (s.role ? ' · ' + s.role : '') }))"
              placeholder="Select referring staff (optional)"
              :error="errors.referred_by"
            />
          </div>

          <!-- ── Existing Member: Opening Balance + Avatar ──────────────────── -->
          <template v-if="isExisting">
            <!-- Opening Balance only shown when auto-create savings is ON and field is not hidden -->
            <div v-if="settingsStore.autoCreateSavingsAccount && !settingsStore.hideOpeningBalance" class="grid gap-1.5">
              <Label for="opening_balance">Opening Balance <span class="text-red-500">*</span></Label>
              <div class="flex overflow-hidden rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-300">
                <span class="flex items-center border-r border-neutral-200 bg-neutral-50 px-4 text-sm font-medium text-neutral-500">{{ currencyCode }}</span>
                <input id="opening_balance" v-model="form.opening_balance" type="number" min="0" step="0.01" placeholder="Opening balance" class="flex-1 bg-white px-4 py-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400" />
              </div>
              <InputError :message="errors.opening_balance" />
            </div>

            <!-- Profile Picture for Existing Member -->
            <div class="grid gap-1.5">
              <Label>Profile Picture <span class="text-neutral-400 font-normal">(Optional)</span></Label>
              <div class="flex items-center gap-4">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 border border-neutral-200">
                  <img v-if="avatarPreview" :src="avatarPreview" class="h-full w-full object-cover" alt="Avatar" />
                  <UserCircle2 v-else class="h-10 w-10 text-neutral-300" />
                </div>
                <div class="flex flex-col gap-1">
                  <label for="avatar-ex" class="inline-flex cursor-pointer items-center rounded-full bg-[#3ab88a] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#32a87e] transition-colors">
                    Choose File
                    <input id="avatar-ex" type="file" accept="image/*" class="sr-only" @change="onAvatarChange" />
                  </label>
                  <span class="text-xs text-neutral-400">{{ avatarFile ? avatarFile.name : 'No file chosen' }}</span>
                  <span class="text-xs text-neutral-400">Recommended: Square image, max 2MB.</span>
                </div>
              </div>
              <InputError :message="errors.avatar" />
            </div>
          </template>

        </div>

        <!-- ── Savings Account Info banner (shown when auto-create is OFF) ── -->
        <div v-if="!settingsStore.autoCreateSavingsAccount"
            class="mt-6 flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-blue-50 border border-blue-200">
            <Wallet class="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p class="text-[12px] text-blue-800 leading-relaxed">
                <strong class="font-semibold">No savings account will be created automatically.</strong>
                After registering this member, go to their profile and click
                <em>"New Account"</em> to add a savings account manually.
            </p>
        </div>

        <!-- ── Share Purchase Section (shown when shares compulsory setting is ON) ── -->
        <div v-if="sharesRequired" class="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 overflow-hidden">
          <!-- Section header -->
          <div class="flex items-center gap-2.5 px-5 py-3 bg-emerald-100/80 border-b border-emerald-200">
            <Share2 class="h-4 w-4 text-emerald-700" />
            <span class="text-[12px] font-bold text-emerald-800 uppercase tracking-wider">Share Purchase</span>
            <span class="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wide">
              Required
            </span>
          </div>

          <div class="p-5 space-y-4">
            <!-- Policy info banner -->
            <div class="flex items-start gap-3 px-4 py-3 rounded-xl bg-white border border-emerald-200">
              <AlertCircle class="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p class="text-[12px] text-emerald-800 leading-relaxed">
                This SACCO requires a minimum of
                <strong>{{ settingsStore.minSharesOnOnboarding }} share(s)</strong>
                at <strong>{{ currencyCode }} {{ settingsStore.sharePrice.toLocaleString() }}</strong> each
                (total: <strong>{{ currencyCode }} {{ (settingsStore.minSharesOnOnboarding * settingsStore.sharePrice).toLocaleString() }}</strong>)
                to register a member.
              </p>
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <!-- Shares quantity input -->
              <div class="grid gap-1.5">
                <label class="text-sm font-semibold text-neutral-700">
                  Number of Shares to Purchase <span class="text-red-500">*</span>
                </label>
                <div class="flex overflow-hidden rounded-xl border focus-within:ring-1 transition-all"
                  :class="sharesError ? 'border-red-400 focus-within:ring-red-300' : 'border-neutral-200 focus-within:border-emerald-400 focus-within:ring-emerald-300'">
                  <span class="flex items-center border-r border-neutral-200 bg-neutral-50 px-4 text-sm font-medium text-neutral-500">
                    Shares
                  </span>
                  <input
                    v-model.number="form.shares_quantity"
                    type="number"
                    :min="settingsStore.minSharesOnOnboarding"
                    :placeholder="`Min. ${settingsStore.minSharesOnOnboarding}`"
                    class="flex-1 bg-white px-4 py-3 text-sm font-mono font-bold text-neutral-800 outline-none placeholder:text-neutral-400"
                  />
                </div>
                <p v-if="sharesError" class="text-[11px] text-red-600 font-medium">{{ sharesError }}</p>
                <p v-else-if="errors.shares_quantity" class="text-[11px] text-red-600">{{ errors.shares_quantity }}</p>
              </div>

              <!-- Auto-computed total -->
              <div class="grid gap-1.5">
                <label class="text-sm font-semibold text-neutral-700">Total Share Investment</label>
                <div class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 min-h-[48px]">
                  <TrendingUp class="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <p class="text-[11px] text-neutral-500 font-medium uppercase tracking-wide">
                      {{ form.shares_quantity || 0 }} shares × {{ currencyCode }} {{ settingsStore.sharePrice.toLocaleString() }}
                    </p>
                    <p class="text-[18px] font-black text-emerald-700 font-mono leading-tight">
                      {{ currencyCode }} {{ sharesTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
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
            :disabled="processing || (sharesRequired && !!sharesError)"
            class="inline-flex items-center gap-2 rounded-full  bg-nfuko-primary px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover: bg-nfuko-primary/90 transition-colors disabled:opacity-60"
          >
            <Spinner v-if="processing" class="h-4 w-4" />
            Register Member
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
