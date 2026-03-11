<script setup>
import { computed, ref } from 'vue'
import { rolesApi } from '@/central/modules/apis'
import { Form, TableDrawer } from '@/Global'
import ConfirmationDialog from '@/Global/confirmationDialog/confirmationDialog.vue'
const { EraseRolesFromUser, AttachRolesToUser } = rolesApi()

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
  url: 'central/staff/users-drop-down',
  required: true,
  props: { placeholder: 'Enter  User Name' },
},
])
function onFormResults(user) {
  if (user?.[0]?.['value']) {
    showDelete.value = { data: { id: props.data?.id, pu: user?.[0]?.['value'] }, action: "attach" }
  }
}

const urlShaffle = computed(() =>{
 return  `/central/settings/roles/holders_list?id=${props.data?.id}`
   })
</script>

<template>

    <div>
      <Form v-model:form="form" parentStyle="grid grid-cols-2 sm:grid-cols-1 gap-4 md:gap-6 px-5"
      @results="onFormResults" />
    </div>
    <TableDrawer ref="drawer" drawerWidth="w-1/2" :showAddButton="false" :url="urlShaffle"
    state="staff-attached-roles" :columns="columns" @save="saveUser">
  </TableDrawer>
  <ConfirmationDialog v-model:show="showDelete" @confirm="() => {
    action[showDelete?.action]?.(showDelete?.data)
    showDelete = false
  }" />
</template>