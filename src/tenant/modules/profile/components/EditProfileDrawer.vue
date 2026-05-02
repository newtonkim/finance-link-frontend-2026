<script setup lang="ts">
import { reactive, watch } from 'vue'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/Global/ui/sheet'
import { Button } from '@/Global/ui/button'
import { Input } from '@/Global/ui/input'
import { Label } from '@/Global/ui/label'
import { useProfileStore } from '@/stores/profileStore'
import { toast } from 'vue-sonner'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const profileStore = useProfileStore()

const form = reactive({ name: '' })

watch(
  () => props.open,
  (val) => {
    if (val) form.name = profileStore.combinedProfile.name
  },
)

async function save() {
  try {
    await profileStore.updateProfile({ name: form.name })
    toast.success('Profile updated.')
    emit('update:open', false)
  } catch {
    toast.error('Failed to update profile. Please try again.')
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="right" class="w-[420px] flex flex-col gap-0 p-0">
      <SheetHeader class="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
        <SheetTitle class="text-lg font-black text-neutral-900 dark:text-white">
          Edit Profile
        </SheetTitle>
      </SheetHeader>

      <div class="flex-1 px-6 py-6 space-y-6">
        <!-- Name -->
        <div class="space-y-2">
          <Label for="profile-name" class="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Full Name
          </Label>
          <Input
            id="profile-name"
            v-model="form.name"
            placeholder="Enter your full name"
            class="rounded-xl"
          />
        </div>

        <!-- Email — read-only -->
        <div class="space-y-2">
          <Label class="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Email Address
          </Label>
          <div class="px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            {{ profileStore.combinedProfile.email }}
          </div>
          <p class="text-xs text-neutral-400">Contact your admin to change your email address.</p>
        </div>

        <!-- Role — read-only -->
        <div class="space-y-2">
          <Label class="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Role
          </Label>
          <div class="px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            {{ profileStore.combinedProfile.role }}
          </div>
        </div>
      </div>

      <SheetFooter class="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
        <Button
          variant="outline"
          class="rounded-xl"
          @click="emit('update:open', false)"
        >
          Cancel
        </Button>
        <Button
          class="rounded-xl bg-nfuko-primary hover:bg-nfuko-primary/90 text-white font-bold"
          :disabled="profileStore.isUpdating || !form.name.trim()"
          @click="save"
        >
          <span v-if="profileStore.isUpdating" class="flex items-center gap-2">
            <svg class="animate-spin size-4" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Saving…
          </span>
          <span v-else>Save Changes</span>
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
