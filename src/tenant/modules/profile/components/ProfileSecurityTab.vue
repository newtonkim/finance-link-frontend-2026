<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Lock, KeyRound } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/Global'
import { Input } from '@/Global/ui/input'
import { Label } from '@/Global/ui/label'
import { useProfileStore } from '@/stores/profileStore'
import { toast } from 'vue-sonner'

const profileStore = useProfileStore()

const showPasswordForm = ref(false)
const isSaving = ref(false)
const passwordError = ref('')

const form = reactive({
  current: '',
  next: '',
  confirm: '',
})

function openPasswordForm() {
  showPasswordForm.value = true
  passwordError.value = ''
  form.current = ''
  form.next = ''
  form.confirm = ''
}

function cancelPasswordForm() {
  showPasswordForm.value = false
  passwordError.value = ''
}

async function submitPasswordChange() {
  passwordError.value = ''

  if (!form.current.trim()) {
    passwordError.value = 'Please enter your current password.'
    return
  }
  if (form.next.length < 8) {
    passwordError.value = 'New password must be at least 8 characters.'
    return
  }
  if (form.next !== form.confirm) {
    passwordError.value = 'New passwords do not match.'
    return
  }

  isSaving.value = true
  try {
    await profileStore.changePassword(form.current, form.next)
    toast.success('Password changed successfully.')
    showPasswordForm.value = false
  } catch {
    passwordError.value = 'Password change failed. Check your current password and try again.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Card class="rounded-3xl border-none shadow-sm bg-white dark:bg-neutral-900">
    <CardHeader class="px-8 pt-7 pb-4">
      <CardTitle class="text-lg font-black flex items-center gap-2 text-neutral-900 dark:text-white">
        <KeyRound class="size-5 text-nfuko-yellow" />
        Authentication Security
      </CardTitle>
    </CardHeader>
    <CardContent class="px-8 pb-7 space-y-6">

      <!-- Password Row -->
      <div class="rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="flex items-center justify-between gap-4 p-4">
          <div class="flex items-center gap-4">
            <div class="size-10 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center shadow-sm shrink-0">
              <Lock class="size-5 text-neutral-400" />
            </div>
            <div>
              <div class="font-bold text-neutral-900 dark:text-white text-sm">Account Password</div>
              <div class="text-xs text-neutral-500 font-medium">Keep your account secure</div>
            </div>
          </div>
          <Button
            v-if="!showPasswordForm"
            variant="outline"
            class="rounded-xl font-bold shrink-0"
            @click="openPasswordForm"
          >
            Update Password
          </Button>
        </div>

        <!-- Inline Form -->
        <div v-if="showPasswordForm" class="border-t border-neutral-100 dark:border-neutral-800 px-4 pb-4 pt-4 space-y-4">
          <div class="space-y-2">
            <Label class="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Current Password
            </Label>
            <Input
              v-model="form.current"
              type="password"
              placeholder="••••••••"
              class="rounded-xl"
              autocomplete="current-password"
            />
          </div>
          <div class="space-y-2">
            <Label class="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              New Password
            </Label>
            <Input
              v-model="form.next"
              type="password"
              placeholder="Min. 8 characters"
              class="rounded-xl"
              autocomplete="new-password"
            />
          </div>
          <div class="space-y-2">
            <Label class="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Confirm New Password
            </Label>
            <Input
              v-model="form.confirm"
              type="password"
              placeholder="Repeat new password"
              class="rounded-xl"
              autocomplete="new-password"
            />
          </div>

          <p v-if="passwordError" class="text-xs text-red-500 font-medium">
            {{ passwordError }}
          </p>

          <div class="flex items-center gap-3">
            <Button
              class="rounded-xl bg-nfuko-primary hover:bg-nfuko-primary/90 text-white font-bold"
              :disabled="isSaving"
              @click="submitPasswordChange"
            >
              <span v-if="isSaving" class="flex items-center gap-2">
                <svg class="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Saving…
              </span>
              <span v-else>Change Password</span>
            </Button>
            <button
              class="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 font-bold transition-colors"
              @click="cancelPasswordForm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Sessions (placeholder) -->
      <div class="space-y-3">
        <h3 class="text-xs font-black text-neutral-400 uppercase tracking-widest">Active Sessions</h3>
        <!-- TODO: wire up real sessions API when backend endpoint is available -->
        <div class="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800">
          <div class="flex items-center gap-4">
            <div class="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <div class="size-2 rounded-full bg-emerald-500"></div>
            </div>
            <div>
              <div class="text-sm font-bold text-neutral-900 dark:text-white">Current Browser</div>
              <div class="text-xs text-neutral-500 font-medium">Active now</div>
            </div>
          </div>
          <Badge class="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-none font-black text-[10px]">
            CURRENT
          </Badge>
        </div>
      </div>

    </CardContent>
  </Card>
</template>
