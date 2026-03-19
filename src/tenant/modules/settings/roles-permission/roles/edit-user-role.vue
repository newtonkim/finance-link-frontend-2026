<script setup>
import { computed, ref } from 'vue'
import { Form, TableDrawer } from '@/Global'
import {tenantRolesApi } from '@/tenant/apis/onboardingSettings/index.ts'
import {ConfirmDialog} from '@/Global'
const { EraseRolesFromUser, AttachRolesToUser } = tenantRolesApi()

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})
const showDelete = ref(false)

const action = {
  close: () => {
    EraseRolesFromUser(showDelete.value.data)
  },
  attach: () => {
   
    AttachRolesToUser(showDelete.value.data)

  }
}

function saveUser(type, payload) {
  showDelete.value = { data: { id: props.data?.id, pu: payload?.staff_id }, action: type }
}

const columns = [
  { key: 'staff_id', label: 'ID' },
  { key: 'staff_name', label: 'Name' },
  { key: 'actions', label: 'actions', show: ['close'] },
]

const form = ref([{
  label: 'user Name',
  name: 'user',
  type: 'select',
  url: '/staff/users-drop-down',
  required: true,
 placeholder: 'Enter  User Name'
},
])
function onFormResults(user) {
  if (user?.[0]?.['value']) {
    showDelete.value = { data: { id: props.data?.id, pu: user?.[0]?.['value'] }, action: "attach" }
  }
}

const urlShaffle = computed(() => {
  return `settings/roles/holders_list?id=${props.data?.id}`
})
</script>

<template>

  <div class='my-5'>
    <Form v-model:form="form" parentStyle="grid grid-cols-2 sm:grid-cols-1 gap-4 md:gap-6 px-2"
      @results="onFormResults" />
  </div>
 
 <div class='my-8'>
 <h1 class='text-2xl text-left mx-3 text-gray-700 font-bold dark:text-white'> Memebers  attached on the role</h1>
  <TableDrawer ref="drawer" :showSearchbar="false" drawerWidth="w-1/2" :showAddButton="false" :url="urlShaffle"
    state="staff-attached-roles" :columns="columns" @save="saveUser">
  </TableDrawer>
 </div>
  <ConfirmDialog
  type='delete'
   v-model:show="showDelete" @confirm="() => {
    action[showDelete?.action]?.(showDelete?.data)
    showDelete = false
  }" >
  <template #body>
  <div class='bg-amber-100 dark:bg-amber-900'>
<div class="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
  <input
    id="reset-permissions"
    type="checkbox"
    @change="showDelete.data.reset = $event.target.checked"
    class="mt-1 h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
  />

  <label for="reset-permissions" class="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed cursor-pointer">
    Remove the user from this role and reset them to default permissions.
  </label>
</div>
</div>
  
  </template>
  </ConfirmDialog>
</template>