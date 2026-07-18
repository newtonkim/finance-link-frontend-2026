<template>
  <div class="h-[82vh] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
    <div v-if="loading" class="flex h-full items-center justify-center">
      <span class="size-9 animate-spin rounded-full border-[3px] border-[#052659]/15 border-t-[#052659]"></span>
    </div>

    <div v-else class="grid h-full grid-cols-1 lg:grid-cols-12">
      <!-- Brand rail: identity + logo + reassurance -->
      <aside class="create-rail relative flex flex-col gap-7 border-b border-slate-100 bg-slate-50/70 px-6 py-8 lg:col-span-5 lg:border-b-0 lg:border-r dark:border-neutral-800 dark:bg-neutral-950/40">
        <div class="flex items-start gap-3">
          <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#052659] text-white ring-1 ring-[#052659]/10">
            <Users2 :size="20" />
          </span>
          <div class="min-w-0">
            <h1 class="text-[20px] font-black leading-tight tracking-tight text-slate-900 dark:text-white">
              {{ data?.action === 'edit' ? 'Update group' : 'Register a group' }}
            </h1>
            <p class="mt-1 text-[13px] font-medium leading-snug text-slate-600 dark:text-neutral-300">
              Set up a savings group and add its members.
            </p>
          </div>
        </div>

        <UploadLogo name="group_logo" :existing="existingGroupLogo" v-model:form="fields">
          <template #header>
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Group logo</p>
          </template>
        </UploadLogo>

        <div class="mt-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-center gap-2">
            <Info :size="14" class="text-[#cda434]" />
            <p class="text-[13px] font-bold text-slate-700 dark:text-neutral-200">Good to know</p>
          </div>
          <ul class="mt-2 space-y-1.5 text-[12px] leading-relaxed text-slate-600 dark:text-neutral-400">
            <li>Add members now, or invite them later.</li>
            <li>The logo, contacts and details stay editable.</li>
          </ul>
        </div>
      </aside>

      <!-- Form -->
      <section class="overflow-y-auto px-6 py-8 lg:col-span-7 md:px-8">
        <h2 class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Group details</h2>
        <div class="mt-5">
          <Form :action="data?.action" parentStyle="grid grid-cols-1 gap-4" v-model:form="fields" />
        </div>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted, } from 'vue'
import { Users2, Info } from 'lucide-vue-next'
import { Form, UploadLogo } from '@/Global'
const loading = ref(true),
  props = defineProps({
    data: {
      type: Object,
      default: {},
    },
  }),
  fields = ref<any[]>([

    {
      label: 'Group official name',
      name: 'group_name',
      type: 'text',
      required: true,
      placeholder: 'Enter Group official name',
    },
    {
      label: 'Group logo',
      name: 'group_logo',
      type: 'text',
      hidden: true,
      value: null,
    },
    {
      label: 'Group members',
      name: 'memberslist',
      type: 'multi-select',
      required: true,
      url: 'global/member-dropdown-list',
      placeholder: 'Enter member name',
      dependsOn: {
        conditions: [
          {
            field: 'group_name',
            condition: (val: any) => val !== null && val !== ''
          }
        ]
      }
    },
    {
      label: 'Group role',
      name: 'member_role',
      type: 'select',
      required: false,
      options: [
        { id: 'member', name: 'Member' },
        { id: 'chairman', name: 'Group Chairman' },
        { id: 'treasurer', name: 'Group Treasurer' },
        { id: 'secretary', name: 'Group Secretary' },
      ],
      value: 'member',
      placeholder: 'Select group role',
    },
    {
      group: 2,
      fields: [
        {
          label: 'Date Create',
          name: 'dcreated',
          type: 'date',
          required: true,
          max: new Date().toISOString().split('T')[0],


          placeholder: 'Enter Date Create',
        },
        {
          label: 'location',
          name: 'address',
          type: 'text',
          required: true,
          placeholder: 'Enter location',
        },
      ],
    },

    {
      label: 'primary Admin contact',
      name: 'phone1',
      type: 'phone',
      required: true,
      placeholder: 'Enter phone number',
    },
    {
      label: 'secondary/alternative line',
      name: 'phone2',
      type: 'phone',
      required: false,
      placeholder: 'Enter phone number',
    },
    {
      label: 'Group description',
      name: 'group_description',
      type: 'textarea',
      required: true,
      placeholder: 'Enter Group description/objective/purpose',
    },
  ])
const normalizeLogoUrl = (raw?: string) => {
  if (!raw || typeof raw !== 'string') return ''
  const imagePath = raw.trim().replace('/public/', '/storage/')
  if (!imagePath) return ''
  if (/^https?:\/\//i.test(imagePath)) return imagePath
  if (imagePath.startsWith('/storage/')) return imagePath
  if (imagePath.startsWith('storage/')) return `/${imagePath}`
  if (imagePath.startsWith('/public/')) return imagePath.replace('/public/', '/storage/')
  if (imagePath.startsWith('public/')) return `/storage/${imagePath.slice(7)}`
  return `/storage/${imagePath.replace(/^\/+/, '')}`
}
const existingGroupLogo = computed(() => normalizeLogoUrl(props.data?.group_image || props.data?.group_log || props.data?.image_path))
function findField(list: any[], name: string): any {
  for (const f of list) {
    if (f?.name === name) return f
    if (Array.isArray(f?.fields)) {
      const nested = findField(f.fields, name)
      if (nested) return nested
    }
  }
  return null
}

async function promtValueOnUpdate() {
  loading.value = true
  const d = props.data
  if (d && d.action === 'edit') {
    const groupMembers = Array.isArray(d.group_members)
      ? d.group_members
      : Array.isArray(d.members)
        ? d.members.map((member: any) => ({
            id: member.id,
            name: member.name || member.member_name || member.member_code || `Member ${member.id}`,
          }))
        : []
    const map: Record<string, any> = {
      group_name: d.group_name ?? d.name,
      dcreated: d.dcreated ?? d.date_created,
      address: d.location ?? d.address,
      phone1: d.phone ?? d.primary_contact_phone ?? d.phone1,
      phone2: d.phone2 ?? d.other_contact_phone,
      group_description: d.group_description ?? d.description ?? d.desc,
      memberslist: Array.isArray(d.memberslist)
        ? d.memberslist
        : groupMembers.map((member: any) => member.id),
    }
    for (const [key, value] of Object.entries(map)) {
      if (value === undefined || value === null || value === '') continue
      const field = findField(fields.value, key)
      if (field) field.value = value
    }
    const membersField = findField(fields.value, 'memberslist')
    if (membersField) {
      membersField.defaultValues = groupMembers
      membersField.label = 'Group members'
    }
    // Send the group id so the backend updates the existing group instead of
    // creating a duplicate. Only added on edit — never on create.
    const gid = d.id ?? d.group_id
    if (gid != null && gid !== '') {
      let idField = findField(fields.value, 'id')
      if (!idField) {
        idField = { name: 'id', type: 'number', hidden: 1 }
        fields.value.unshift(idField)
      }
      idField.value = gid
    }
  }
  loading.value = false
}
onMounted(() => {
  promtValueOnUpdate()
})

</script>

<style scoped>
.create-rail {
  animation: rail-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes rail-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .create-rail { animation: none; }
}
</style>
