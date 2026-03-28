<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch } from 'vue';
import { Form, } from '@/Global';
const emits = defineEmits(['update:form']);
const OptionList = reactive({
  salutationOptions: [{ id: 'Mr', name: 'Mr' }, { id: 'Mrs', name: 'Mrs' }, { id: 'Ms', name: 'Ms' }, { id: 'Dr', name: 'Dr' }, { id: 'Prof', name: 'Prof' }],
  genderOptions: [{ id: 'male', name: 'Male' }, { id: 'female', name: 'Female' }, { id: 'other', name: 'Other' }],
  maritalOptions: [{ id: 'single', name: 'Single' }, { id: 'married', name: 'Married' }, { id: 'divorced', name: 'Divorced' }, { id: 'widowed', name: 'Widowed' }]
})
const loading = ref(true)
const props = defineProps({
  data: {
    type: Object,
    default: {},
  },
})
const fields = ref([
  {
    label: 'Salutation',
    name: 'Salutation',
    type: 'select',
    required: true,
    placeholder: 'Search Salutation',
    options: OptionList.salutationOptions
  },
  {
    label: 'Full Name',
    name: 'full_name',
    type: 'text',
    required: true,
    placeholder: 'Enter Full Name',
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
    required: true,
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
    required: false,
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
    label: 'referred by',
    name: 'referred_by',
    type: 'select',
    required: false,
    url: 'staff/users-drop-down',
    placeholder: 'Referred by',
    dataOnMount: true,
  },
  {
    label: 'inital deposit',
    name: 'inital_deposit',
    type: 'number',
    required: true,
    placeholder: 'Select initial deposit',
  }
]);
async function promtValueOnUpdate() {
  loading.value = true
  if (props.data) {
    const data = { tenant_id: props.data.tenant_id, plan: props.data.plan_id, date: [props.data.starts, props.data.expires], status: props.data.status }
    await Object.entries(data).forEach(([key, value]) => {
      const field = fields.value.find((f: any) => f.name === key)
      if (field) field.value = value
    });
  }
  loading.value = false
}
const loadingMount = computed(() => loading.value)
onMounted(() => {
  promtValueOnUpdate()
})
watch(() => fields.value, () => {
  emits('update:form', fields.value)
})
</script>
<template>
  <div class="card shadow-md px-2 py-10 bg-white dark:bg-neutral-800 rounded-md h-[75vh] overflow-auto">
    <span v-if='loadingMount'></span>
    <Form :action="data?.action" v-else parentStyle="grid  grid-cols-2 gap-4 md:gap-6" v-model:form="fields" />

  </div>
</template>