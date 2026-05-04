<template>
    <UploadTemplateColumn :defaults="['group_type',
        'group_code',
        'savings_product',
        'opening_balance',
        'initial_deposit',
        'group_name',
        'primary_contact_phone',
        'date_created',
        'group_location',
        'group_description',]" title=" Group Template" url="group-account-savings/download-template" />
</template>

<script setup>
import { UploadTemplateColumn } from '@/Global';


</script>