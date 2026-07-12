<template>
  <card class="card shadow-md  border-0 px-2 bg-white dark:bg-neutral-800 rounded-md h-[82vh] overflow-hidden">
    <span v-if="loading"></span>
    <div class="grid grid-cols-8" v-else>
      <div class="col-span-3">
        <div class="flex flex-col font-sans">
          <UploadLogo name="group_logo" :existing="existingGroupLogo" v-model:form="fields">
            <template #header>
              <h1 class="text-2xl font-black italic text-slate-900 tracking-tight">
                {{ data?.action === 'edit' ? 'Update Group' : 'Register Group' }}
              </h1>
              <p class="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-2">
                Savings Institutional Onboarding Protocol
              </p>
            </template>
          </UploadLogo>
        </div>
      </div>
      <div class="col-span-5">
        <Form :action="data?.action" parentStyle="grid  grid-cols-1 gap-3  " v-model:form="fields" />
      </div>
    </div>
  </card>
</template>
<script setup lang="ts">
import { computed, ref, onMounted, } from 'vue'
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
