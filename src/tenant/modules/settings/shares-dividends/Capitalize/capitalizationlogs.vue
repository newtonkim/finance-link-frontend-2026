<template>
  <TableDrawer
    permission="view-capitalization-logs-list"
    :showAddButton="false"
    drawerWidth=" w-2/4"
    :url="tableUrl"
    state="capitalize-list-log"
    :columns="columns"
  >
    <template #header-action>
      <PainPageHeader title="Capitalize log" dec="capitalize log/history " />
    </template>
  </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
const tableUrl = computed(() => `settings/shares-dividends/capitalize/list-log?status`),
  columns = [
    { key: "code", label: "Code", copy: true },
    { key: "capital", label: "capital", type: "money" },
    { key: "blc", label: "blc", type: "money" },
    { key: "amount", label: "amount", type: "money" },
    { key: "price", label: "share price", type: "money" },
    { key: "new_capital_remaining", label: "new capital balance", type: "money" },
    { key: "new_capital", label: " new capital", type: "money" },
    { key: "new_share_price", label: "new share price", type: "money" },
    { key: "created_at", label: "created at", type: "date" },
  ];
</script>
