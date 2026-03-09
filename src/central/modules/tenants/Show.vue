<script setup>
import { DetailsTable } from '@/Global/DetailsTable';

// import DetailsTable from "@/components/DetailsTable.vue"

const data = {
  id: "e644d973-f31e-4ebb-956a-b59fdb99e7c2",
  sacco_name: "Kathleen Walker",
  sacco_domain: "kathleenwalker",
  host_domain: null,
  storage: "sacco_kathleenwalker",
  status: "active",
  cogs: null,
  created_at: "2026-03-07 23:37:58"
}

const columns = [
  {
    header: "Sacco Details",
    type: "Descriptions",
    column: 3,
    list: [
      { key: "sacco_name", label: "Sacco Name" },
      { key: "sacco_domain", label: "Sacco Domain" },
      { key: "host_domain", label: "Host Domain" },
      { key: "storage", label: "Database" },
      { key: "status", label: "Status", type: "status" },
      { key: "created_at", label: "Created At" }
    ]
  }
]
</script>

<template>
  <DetailsTable
    :data="data"
    :columns="columns"
  />
</template>