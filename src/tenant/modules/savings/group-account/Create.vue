<template>
  <card class="card shadow-md  border-0 px-2 bg-white dark:bg-neutral-800 rounded-md h-[82vh] overflow-hidden">
    <span v-if="loading"></span>
    <div class="grid grid-cols-8" v-else>
      <div class="col-span-3">
        <div class="flex flex-col font-sans">
          <UploadLogo name="group_logo" v-model:form="fields">
            <template #header>
              <h1 class="text-2xl font-black italic text-slate-900 tracking-tight">
                Register Group
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
import { ref, onMounted, } from 'vue'
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
      label: 'add group member',
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
    const map: Record<string, any> = {
      group_name: d.group_name ?? d.name,
      dcreated: d.dcreated ?? d.date_created,
      address: d.location ?? d.address,
      phone1: d.phone ?? d.primary_contact_phone ?? d.phone1,
      phone2: d.phone2 ?? d.other_contact_phone,
      group_description: d.group_description ?? d.description ?? d.desc,
      memberslist: Array.isArray(d.memberslist) ? d.memberslist : d.members,
    }
    for (const [key, value] of Object.entries(map)) {
      if (value === undefined || value === null || value === '') continue
      const field = findField(fields.value, key)
      if (field) field.value = value
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
