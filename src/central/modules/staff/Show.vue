<script setup>
import { DetailsTable } from '@/Global';

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const columns = [
  {
    header: "Staff Details",
    type: "Descriptions",
    column: 3,
    list: [
      { key: "staff_fall_name", label: "Staff Name" },
      { key: "staff_email", label: "Email" },
      { key: "system_role", label: "Role" },
      { key: "status", label: "Status", type: "status" },
      { key: "created_at", label: "Created At" }
    ]
  }
]
</script>

<template>
  <DetailsTable :data="data" :columns="columns" />
</template>