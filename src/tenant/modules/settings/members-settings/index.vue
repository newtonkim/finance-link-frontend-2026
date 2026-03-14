<template>
    <div v-if="statusFilter == 'permissions'">
        <memberspermissions v-model="statusFilter" />
    </div>
    <div v-else>
        <membersroles v-model="statusFilter"  />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { memberspermissions, membersroles } from '.';
const statusFilter = ref('permissions')
</script>