<template>
  <div class="card shadow-md p-4 py-5 bg-white dark:bg-neutral-800 rounded-md h-[82vh] overflow-hidden">
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
        <Form :action="data?.action" parentStyle="grid  grid-cols-1 gap-4  " v-model:form="fields" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted,   } from 'vue'
import { Form,  UploadLogo } from '@/Global'
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
          type: 'datec',
          required: true,
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
async function promtValueOnUpdate() {
  loading.value = true
  if (props.data) {
    const data = {
      tenant_id: props.data.tenant_id,
      plan: props.data.plan_id,
      date: [props.data.starts, props.data.expires],
      status: props.data.status,
    }
    await Object.entries(data).forEach(([key, value]) => {
      const field = fields.value.find((f: any) => f.name === key)
      if (field) field.value = value
    })
  }
  loading.value = false
}
onMounted(() => {
  promtValueOnUpdate()
})

</script>
