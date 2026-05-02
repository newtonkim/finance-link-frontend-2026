<script setup>
import { computed, ref } from 'vue'
import { permissionsApi } from '@/central/modules/apis'
import { Form, TableDrawer } from '@/Global'
import ConfirmationDialog from '@/Global/confirmationDialog/confirmationDialog.vue'
const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})
const showDelete = ref(false)

const { ErasePermissionFromUser,AttachPermissionToUser } = permissionsApi()
const action = {
  close: () => {
      ErasePermissionFromUser(showDelete.value.data)

  },
  attach: () => {
    AttachPermissionToUser(showDelete.value.data)

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
  // label: 'user Name',
  name: 'user',
  type: 'select',
  url: 'central/staff/users-drop-down',
  required: true,
  props: { placeholder: 'Enter  User Name' },
},
])
function onFormResults(user) {
  if (user?.[0]?.['value']){
    showDelete.value = { data: { id: props.data?.id, pu: user?.[0]?.['value'] }, action: "attach" }
  }

}


const urlShaffle = computed(() => `/central/settings/permisions/holders_list?id=${props.data?.id}`)
</script>

<template>
  <div>
  
    <label class="px-5">Attach User Permission</label>
    <Form v-model:form="form" parentStyle="grid grid-cols-2 sm:grid-cols-1 gap-3 px-5"
      @results="onFormResults" />
  </div>
  <TableDrawer ref="drawer" drawerWidth="w-1/2" :showAddButton="false" :url="urlShaffle"
    state="staff-attached-permission" :columns="columns" @save="saveUser">
  </TableDrawer>
  <ConfirmationDialog v-model:show="showDelete" @confirm="() => {
    action[showDelete?.action]?.(showDelete?.data)
    showDelete = false
  }" />
</template>