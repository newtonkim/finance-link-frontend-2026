<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Calendar, User, Banknote, FileText, CheckCircle2, Loader2 } from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'

const props = defineProps<{
  open: boolean
  posting: boolean
  tellerName: string
  borrowerName: string
  installmentAmount: number | string
  currency: string
}>()

const emit = defineEmits<{
  close: []
  submit: [data: {
    amount: number
    payment_date: string
    description: string
  }]
}>()

const state = ref<'entry' | 'success'>('entry')

const form = ref({
  payment_date: new Date().toISOString().split('T')[0],
  amount: Number(props.installmentAmount),
  description: '',
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      form.value.amount = Number(props.installmentAmount)
      form.value.payment_date = new Date().toISOString().split('T')[0]
      form.value.description = ''
      state.value = 'entry'
    }
  },
)

function handleSubmit() {
  emit('submit', {
    amount: form.value.amount,
    payment_date: form.value.payment_date,
    description: form.value.description
  })
}

// Exposed to parent to trigger success view
function setSuccess() {
  state.value = 'success'
}

defineExpose({ setSuccess, reset: () => { state.value = 'entry' } })

function fmt(v: number | string | null | undefined) {
  if (v == null || v === '') return '—'
  return formatMoneyValue(v)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" @mousedown.self="state === 'entry' ? emit('close') : null" />
    </Transition>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="open" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          
          <!-- ENTRY STATE -->
          <template v-if="state === 'entry'">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
              <h2 class="text-xl font-bold text-neutral-800 dark:text-white">Receive Cash Transaction</h2>
              <button 
                class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1"
                @click="emit('close')"
              >
                <X class="h-6 w-6" />
              </button>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Date -->
                <div class="space-y-1.5">
                  <label class="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                    <Calendar class="h-4 w-4" /> Date
                  </label>
                  <input 
                    v-model="form.payment_date"
                    type="date" 
                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>

                <!-- Officer (Disabled) -->
                <div class="space-y-1.5">
                  <label
                    class="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400"
                  >
                    <User class="h-4 w-4" /> Officer
                  </label>
                  <input
                    type="text"
                    :value="tellerName"
                    disabled
                    class="w-full cursor-not-allowed rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-black/20 dark:text-neutral-400"
                  />
                </div>

                <!-- Amount -->
                <div class="space-y-1.5">
                  <label
                    class="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400"
                  >
                    <Banknote class="h-4 w-4" /> Amount
                  </label>
                  <div class="relative">
                    <span
                      class="absolute left-3 top-1/2 text-xs font-bold -translate-y-1/2 text-neutral-400"
                      >{{ currency }}</span
                    >
                    <input
                      v-model="form.amount"
                      type="number"
                      step="0.01"
                      class="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-12 pr-3 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>
                </div>

                <!-- Transaction Description -->
                <div class="row-span-2 space-y-1.5">
                  <label
                    class="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400"
                  >
                    <FileText class="h-4 w-4" /> Transaction Description
                    <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    v-model="form.description"
                    rows="5"
                    placeholder="Enter Transaction Description"
                    class="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  ></textarea>
                </div>

                <!-- Member Name (Disabled) -->
                <div class="space-y-1.5">
                  <label
                    class="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400"
                  >
                    <User class="h-4 w-4" /> Member Name
                  </label>
                  <input
                    type="text"
                    :value="borrowerName"
                    disabled
                    class="w-full cursor-not-allowed rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 text-sm font-semibold uppercase text-neutral-500 dark:border-neutral-800 dark:bg-black/20 dark:text-neutral-400"
                  />
                </div>


              </div>
            </div>

            <!-- Footer -->
            <div
              class="flex items-center justify-center gap-4 border-t border-neutral-100 p-6 dark:border-neutral-800"
            >
              <button
                class="min-w-[140px] rounded-lg bg-neutral-500 px-6 py-3 font-bold text-white transition-colors hover:bg-neutral-600"
                @click="emit('close')"
              >
                Cancel
              </button>
              <button
                class="flex min-w-[180px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="posting || !form.description.trim()"
                @click="handleSubmit"
              >
                <Loader2 v-if="posting" class="h-5 w-5 animate-spin" />
                Receive Cash
              </button>
            </div>
          </template>

          <!-- SUCCESS STATE -->
          <div v-else class="p-10 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
             <div class="relative">
                <div class="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25"></div>
                <div class="relative bg-white rounded-full p-4 border-[6px] border-green-50 shadow-sm">
                   <div class="bg-green-100/50 rounded-full p-4">
                      <CheckCircle2 class="h-16 w-16 text-green-500" stroke-width="1.5" />
                   </div>
                </div>
             </div>
             
             <div class="space-y-2">
                <h2 class="text-4xl font-extrabold text-neutral-800 dark:text-white leading-tight">
                   Payment Received Successfully!
                </h2>
                <p class="text-lg text-neutral-500 dark:text-neutral-400 font-medium max-w-sm mx-auto">
                   You have successfully recorded the payment.
                </p>
             </div>

             <button 
                class="min-w-[120px] px-8 py-3 rounded-lg bg-[#7A69E5] text-white font-bold text-lg hover:bg-[#6857cc] transition-all shadow-lg hover:shadow-xl active:scale-95"
                @click="emit('close')"
             >
                Okay
             </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
