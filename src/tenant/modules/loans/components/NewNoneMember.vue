<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
const emits = defineEmits(['update:form']);
const OptionList = reactive({
  memberTypeOptions: [{ id: 'new_member', name: 'New Member' }, { id: 'existing_member', name: 'Existing Member' }],
  salutationOptions: [{ id: 'Mr', name: 'Mr' }, { id: 'Mrs', name: 'Mrs' }, { id: 'Ms', name: 'Ms' }, { id: 'Dr', name: 'Dr' }, { id: 'Prof', name: 'Prof' }],
  genderOptions: [{ id: 'male', name: 'Male' }, { id: 'female', name: 'Female' }, { id: 'other', name: 'Other' }],
  maritalOptions: [{ id: 'single', name: 'Single' }, { id: 'married', name: 'Married' }, { id: 'divorced', name: 'Divorced' }, { id: 'widowed', name: 'Widowed' }]
})
const props = defineProps({
  data: {
    type: Object,
    default: {},
  },
})
const fields = ref<any[]>([

  {
    label: 'Full Name',
    name: 'full_name',
    type: 'text',
    required: true,
    placeholder: 'Enter Full Name',
  },
  {
    label: 'Salutation',
    name: 'Salutation',
    type: 'select',
    required: true,
    placeholder: 'Search Salutation',
    options: OptionList.salutationOptions
  },
  {
    label: 'gender',
    name: 'gender',
    type: 'select',
    required: true,
    placeholder: 'Search gender',
    options: OptionList.genderOptions
  },
  {
    label: 'Date Of Birth',
    name: 'date_of_birth',
    type: 'datec',
    required: true,
    props: { placeholder: 'Select Start & End Dates' },
  },
  {
    label: 'Primary Contact',
    name: 'primary_contact',
    type: 'phone',
    required: true,
    placeholder: 'Enter Primary Contact',
  },
  {
    label: 'Other Contacts',
    name: 'other_contacts',
    type: 'phone',
    required: false,
    placeholder: 'Enter Other Contacts',
  },
  {
    label: 'Mobile Money Number',
    name: 'mobile_money_number',
    type: 'phone',
    required: true,
    placeholder: 'Enter Primary Contact',
  },
  {
    label: 'Email',
    name: 'email',
    type: 'text',
    required: false,
    placeholder: 'Enter Email',
  },
  {
    label: 'NATIONAL ID (NIN)',
    name: 'national_id',
    type: 'text',
    required: true,
    placeholder: 'Enter national id (NIN)',
  },
  {
    label: 'Marital Status',
    name: 'marital_status',
    type: 'select',
    required: true,
    options: OptionList.maritalOptions,
    placeholder: 'Enter Marital Status',
  },
  {
    label: 'Nationality',
    name: 'nationality',
    type: 'nationality',
    required: true,
    placeholder: 'Enter Nationality',
  },
  {
    label: 'Address',
    name: 'address',
    type: 'textarea',
    required: true,
    placeholder: 'Enter Address',
  },
  {
    label: 'profile picture',
    name: 'profile_picture',
    type: 'profile',
    required: false,
    placeholder: 'Enter profile picture',
  },
  {
    label: 'Next of Kin',
    name: 'next_of_kin',
    type: 'text',
    required: true,
    placeholder: 'Enter Next of Kin',
  },
  {
    label: 'Next of Kin Contact',
    name: 'next_of_kin_contact',
    type: 'phone',
    required: true,
    placeholder: 'Enter Next of Kin Contact',
  },
  {
    label: 'opening balance',
    name: 'opening_balance',
    type: 'money',
    required: true,
    placeholder: 'Enter opening balance',
  },
  {
    label: 'joined date',
    name: 'joined_date',
    type: 'date',
    required: true,
    placeholder: 'Referred by',
  },
  {
    label: 'referred by',
    name: 'referred_by',
    type: 'select',
    required: false,
    url: 'staff/users-drop-down',
    placeholder: 'Referred by',
    dataOnMount: true,
  },
  {
    label: "application_id",
    hidden: true,
    name: 'application_id',
    type: 'number',
    required: true,
    value: props?.data?.id,
  },
]);
watch(() => fields.value, (data) => {
  if (data) {
    emits('update:form', data)
  }
},{ deep: true })

</script>
<template>
  <div class="h-[85vh] overflow-auto card shadow-md p-4 py-10 bg-white dark:bg-neutral-800 rounded-md">
    <Form :action="data?.action" parentStyle="grid  grid-cols-2 gap-4 md:gap-6" v-model:form="fields" />
  </div>
</template>
