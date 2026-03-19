<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, AlertTriangle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { savingsAccountsApi } from '@/tenant/apis/savingsAccounts/savingsAccountsApi'

const props = defineProps<{
  open: boolean
  accountId: number | null
  accountNo?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: []
}>()

const processing = ref(false)
const errors = ref<Record<string, string>>({})

const form = ref({
  charge_name: '',
  amount: '' as string | number,
  charge_date: new Date().toISOString().split('T')[0],
  narration: '',
  is_reversible: true,
})

watch(() => props.open, (val) => {
  if (val) {
    form.value = {
      charge_name: '',
      amount: '',
      charge_date: new Date().toISOString().split('T')[0],
      narration: '',
      is_reversible: true,
    }
    errors.value = {}
  }
})

function close() {
  emit('update:open', false)
}

async function submit() {
  if (!props.accountId) return
  errors.value = {}
  processing.value = true

  try {
    await savingsAccountsApi.charge(props.accountId, {
      charge_name: form.value.charge_name,
      amount: Number(form.value.amount),
      charge_date: form.value.charge_date,
      narration: form.value.narration || undefined,
      is_reversible: form.value.is_reversible,
    })
    toast.success('Charge applied successfully.')
    emit('success')
    close()
  } catch (err: any) {
    const data = err?.response?.data
    if (data?.errors) {
      errors.value = Object.fromEntries(
        Object.entries(data.errors as Record<string, string[]>).map(([k, v]) => [k, v[0]])
      )
    } else {
      toast.error(data?.message ?? 'Failed to apply charge.')
    }
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
      @click="close"
    />
  </Transition>

  <!-- Drawer -->
  <Transition name="slide-right">
    <aside
      v-if="open"
      class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-neutral-100 px-6 py-5" style="background-color: var(--color-nfuko-primary);">
        <div>
          <h2 class="text-base font-bold text-white">Add Charge</h2>
          <p v-if="accountNo" class="text-xs text-white/70 mt-0.5">Account: {{ accountNo }}</p>
        </div>
        <button
          @click="close"
          class="rounded-full p-2 text-white/70 hover:bg-white/10 transition-colors"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-6 py-6 space-y-5">

        <!-- Charge Name -->
        <div>
          <label class="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-neutral-500">
            Charge Name <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.charge_name"
            type="text"
            placeholder="e.g. Registration Charge, Maintenance Fee"
            class="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-[var(--color-nfuko-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--color-nfuko-primary)]/10"
          />
          <p v-if="errors.charge_name" class="mt-1 text-xs text-rose-500">{{ errors.charge_name }}</p>
        </div>

        <!-- Amount -->
        <div>
          <label class="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-neutral-500">
            Charge Amount (UGX) <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            class="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-[var(--color-nfuko-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--color-nfuko-primary)]/10"
          />
          <p v-if="errors.amount" class="mt-1 text-xs text-rose-500">{{ errors.amount }}</p>
        </div>

        <!-- Charge Date -->
        <div>
          <label class="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-neutral-500">
            Charge Date <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.charge_date"
            type="date"
            class="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition-all focus:border-[var(--color-nfuko-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--color-nfuko-primary)]/10"
          />
          <p v-if="errors.charge_date" class="mt-1 text-xs text-rose-500">{{ errors.charge_date }}</p>
        </div>

        <!-- Narration -->
        <div>
          <label class="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-neutral-500">
            Narration (Optional)
          </label>
          <textarea
            v-model="form.narration"
            rows="3"
            placeholder="Additional notes about this charge..."
            class="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-[var(--color-nfuko-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--color-nfuko-primary)]/10 resize-none"
          />
        </div>

        <!-- Is Reversible Toggle -->
        <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-neutral-800">Allow Reversal</p>
              <p class="text-xs text-neutral-500 mt-0.5">When enabled, this charge can be reversed later.</p>
            </div>
            <button
              type="button"
              @click="form.is_reversible = !form.is_reversible"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
              :style="form.is_reversible ? 'background-color: var(--color-nfuko-primary)' : 'background-color: #d1d5db'"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200"
                :class="form.is_reversible ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>

          <!-- Warning when non-reversible -->
          <Transition name="fade">
            <div v-if="!form.is_reversible" class="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
              <AlertTriangle class="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p class="text-xs text-amber-700">
                This charge will be <strong>permanent</strong> and cannot be reversed once applied.
                Use this only for charges like registration or one-time setup fees.
              </p>
            </div>
          </Transition>
        </div>

      </div>

      <!-- Footer -->
      <div class="border-t border-neutral-100 px-6 py-4 flex gap-3">
        <button
          type="button"
          @click="close"
          class="flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="submit"
          :disabled="processing"
          class="flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all disabled:opacity-60"
          style="background-color: var(--color-nfuko-primary);"
        >
          {{ processing ? 'Applying...' : 'Apply Charge' }}
        </button>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>
