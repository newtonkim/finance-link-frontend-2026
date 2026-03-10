<script setup>
import { computed, ref } from 'vue'
import { permissionsApi } from '@/central/modules/apis'
import { TableDrawer } from '@/Global'
import ConfirmationDialog from '@/Global/confirmationDialog/confirmationDialog.vue'
const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})
const loading =ref(true)
const showDelete =ref(false)

const { ErasePermissionFromUser } = permissionsApi()
const action = {
  close: (data) => {
    showDelete.value = data
  }
}

function saveUser(type, payload) {
  loading.value = true
  action[type]?.(payload)
  loading.value = false
}

const columns = [
  { key: 'staff_id', label: 'ID' },
  { key: 'staff_name', label: 'Name' },
  { key: 'actions', label: 'actions', show: ['close'] },
]
const urlShaffle = computed(() => `/central/settings/permisions/holders_list?id=${props.data?.id}`)
</script>

<template>
  <TableDrawer ref="drawer" drawerWidth="w-1/2" :showAddButton="false" :url="urlShaffle"
    state="staff-attached-permission" :columns="columns" @save="saveUser">
  </TableDrawer>
<ConfirmationDialog v-model:show="showDelete"  
        @confirm="() => {
    ErasePermissionFromUser({ id: props.data?.id, pu: showDelete?.staff_id })
    showDelete = false
        }" />
</template>