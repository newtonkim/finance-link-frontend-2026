<script setup lang="ts">
import { onMounted } from 'vue'
import { Calendar, Search, Plus, Pencil, Trash2, X, ArrowLeft } from 'lucide-vue-next'
import { Spinner, InputError, Label } from '@/Global'
import ConfirmationDialog from '@/Global/confirmationDialog/confirmationDialog.vue'
import { useFiscalYears } from '../composables/useFiscalYears'

const {
  showListDrawer, years, meta, loading, search, pages,
  fetch, openListDrawer, closeListDrawer,
  showForm, formMode, processing, errors, form,
  openAddForm, openEditForm, closeForm, submitForm,
  showDeleteDialog, deleteTarget, openDeleteDialog, confirmDelete,
  formatDate,
} = useFiscalYears()

onMounted(() => {
  // Pre-fetch so the button can show loading state reactively
})
</script>

<template>
  <!-- Trigger card -->
  <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Fiscal Year</h3>
    <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Define and manage your organisation's financial periods.</p>
    <button
      @click="openListDrawer"
      :disabled="loading"
      class="inline-flex items-center gap-1.5 text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline disabled:opacity-60"
    >
      <Spinner v-if="loading" class="h-3.5 w-3.5" />
      {{ loading ? 'Loading…' : 'Set Fiscal Year →' }}
    </button>
  </div>

  <!-- ═══ Fiscal Year List Drawer ═══════════════════════════════════════════ -->
  <Transition name="drawer-fade">
    <div v-if="showListDrawer" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeListDrawer" />
      <Transition name="drawer-slide">
        <aside class="absolute right-0 top-0 h-full w-full max-w-[680px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900" role="dialog" aria-label="Financial Years">
          <div class="flex h-full flex-col">
            <!-- Header -->
            <div class="border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                    <Calendar class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                  </div>
                  <div>
                    <h3 class="text-lg font-bold tracking-tight text-neutral-900 uppercase dark:text-white">Financial Years</h3>
                    <p class="text-xs text-neutral-500">Manage your organisation's fiscal periods</p>
                  </div>
                </div>
                <button type="button" @click="closeListDrawer" class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors dark:hover:bg-neutral-800">
                  <X class="h-4 w-4" />
                </button>
              </div>
              <!-- Search + Add -->
              <div class="mt-4 flex items-center gap-3">
                <div class="relative flex-1">
                  <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input v-model="search" type="text" placeholder="Search for financial year" class="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-nfuko-primary focus:ring-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                </div>
                <button @click="openAddForm" class="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-nfuko-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#002d32] transition-colors shadow-sm dark:bg-bg-nfuko-yellow dark:text-nfuko-primary">
                  <Plus class="h-4 w-4" />
                  Add financial year
                </button>
              </div>
            </div>

            <!-- Table -->
            <div class="flex-1 overflow-y-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-neutral-100 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-800/30">
                    <th class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">S/N</th>
                    <th class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Financial year</th>
                    <th class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Start</th>
                    <th class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">End</th>
                    <th class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
                  <template v-if="loading">
                    <tr v-for="i in 4" :key="i" class="animate-pulse">
                      <td v-for="j in 5" :key="j" class="px-6 py-4">
                        <div class="h-4 rounded bg-neutral-100 dark:bg-neutral-800" :class="j === 2 ? 'w-28' : 'w-20'" />
                      </td>
                    </tr>
                  </template>
                  <tr v-else-if="years.length === 0">
                    <td colspan="5" class="px-6 py-16 text-center text-sm text-neutral-400">No financial years found.</td>
                  </tr>
                  <tr v-else v-for="(fy, idx) in years" :key="fy.id" class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                    <td class="px-6 py-4 text-neutral-500">{{ idx + 1 + (meta.current_page - 1) * 15 }}</td>
                    <td class="px-6 py-4 font-medium text-neutral-900 dark:text-white">{{ fy.name }}</td>
                    <td class="px-6 py-4 text-neutral-600 dark:text-neutral-300">{{ formatDate(fy.start_date) }}</td>
                    <td class="px-6 py-4 text-neutral-600 dark:text-neutral-300">{{ formatDate(fy.end_date) }}</td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <button @click="openEditForm(fy)" class="inline-flex items-center gap-1.5 rounded-lg bg-nfuko-primary px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#002d32] transition-colors shadow-sm dark:bg-bg-nfuko-yellow dark:text-nfuko-primary">
                          <Pencil class="h-3 w-3" />Edit
                        </button>
                        <button @click="openDeleteDialog(fy)" class="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors shadow-sm">
                          <Trash2 class="h-3 w-3" />Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div v-if="meta.last_page > 1" class="flex items-center justify-between border-t border-neutral-100 px-6 py-3 dark:border-neutral-800">
              <p class="text-xs text-neutral-400">Page {{ meta.current_page }} of {{ meta.last_page }} ({{ meta.total }} records)</p>
              <div class="flex gap-1">
                <button v-for="page in pages" :key="page" @click="fetch(page)" class="h-8 w-8 rounded-lg text-xs font-medium transition-colors" :class="page === meta.current_page ? 'bg-nfuko-primary text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'">
                  {{ page }}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </Transition>

  <!-- ═══ Add / Edit Form Drawer ════════════════════════════════════════════ -->
  <Transition name="drawer-fade">
    <div v-if="showForm" class="fixed inset-0 z-[60]">
      <div class="absolute inset-0 bg-black/30 backdrop-blur-[2px]" @click="closeForm" />
      <Transition name="drawer-slide">
        <aside class="absolute right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900" role="dialog" :aria-label="formMode === 'edit' ? 'Edit financial year' : 'Add financial year'">
          <div class="flex h-full flex-col">
            <div class="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <div class="flex items-center gap-3">
                <button type="button" @click="closeForm" class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors dark:hover:bg-neutral-800">
                  <ArrowLeft class="h-4 w-4" />
                </button>
                <h3 class="text-[15px] font-bold text-neutral-900 dark:text-white">
                  {{ formMode === 'edit' ? 'Edit financial year' : 'Add financial year' }}
                </h3>
              </div>
              <button type="button" @click="closeForm" class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors dark:hover:bg-neutral-800">
                <X class="h-4 w-4" />
              </button>
            </div>
            <form @submit.prevent="submitForm" class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div class="space-y-2">
                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Financial year name <span class="text-red-500">*</span></Label>
                <input v-model="form.name" type="text" placeholder="e.g. 2026" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                <InputError v-if="errors.name" :message="errors.name?.[0] ?? errors.name" />
              </div>
              <div class="space-y-2">
                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Start date</Label>
                <input v-model="form.start_date" type="date" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                <InputError v-if="errors.start_date" :message="errors.start_date?.[0] ?? errors.start_date" />
              </div>
              <div class="space-y-2">
                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">End date <span class="text-red-500">*</span></Label>
                <input v-model="form.end_date" type="date" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                <InputError v-if="errors.end_date" :message="errors.end_date?.[0] ?? errors.end_date" />
              </div>
            </form>
            <div class="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <button type="button" @click="closeForm" class="rounded-lg bg-neutral-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-600 transition-colors">Close</button>
              <button type="button" @click="submitForm" :disabled="processing" class="inline-flex items-center gap-2 rounded-lg bg-nfuko-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002d32] transition-colors disabled:opacity-60 shadow-sm dark:bg-bg-nfuko-yellow dark:text-nfuko-primary">
                <Spinner v-if="processing" class="h-4 w-4" />
                {{ formMode === 'edit' ? 'Update financial year' : 'Save financial year' }}
              </button>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </Transition>

  <!-- Delete confirmation -->
  <ConfirmationDialog
    :show="showDeleteDialog"
    title="Delete Financial Year"
    :message="`Are you sure you want to delete '${deleteTarget?.name}'? This action cannot be undone.`"
    confirm-label="Delete"
    @confirm="confirmDelete"
    @cancel="showDeleteDialog = false"
  />
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
