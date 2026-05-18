<template>
  <div class="card shadow-md px-4 py-3 bg-white dark:bg-neutral-800 rounded-md">
    <span v-if="loading"></span>
    <Form :action="data?.action" v-else parentStyle="grid  grid-cols-1 gap-3" v-model:form="fields" />
    <br>
    <br>
    <br>
    <br>
  
   
  </div>

</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { exptendAformField, Form, getSystemSetting, tryCatch } from '@/Global'
import { memberAccountApi } from '@/tenant/apis'
import debounce from 'lodash/debounce'
const { getProductCharges } = memberAccountApi()

const emits = defineEmits(['update:form']),
  loading = ref(true),
  settingList = ref({}),
  yesNoOptions = [
    { id: 1, name: 'Yes' },
    { id: '0', name: 'No' },
  ],
  props = defineProps({
    data: {
      type: Object,
      default: {},
    },
    disableMemberFields: {
      type: Boolean,
      default: false,
      required: false
    }
  }),
  fields = ref<any[]>([
    {
      label: 'Member',
      name: 'member',
      type: 'select',
      required: true,
      url: 'global/member-dropdown-list',
      placeholder: 'select a member',
      dataOnMount: true,
      value: props?.data?.member_id,
      disabled: props?.disableMemberFields,


    },

    {
      label: 'free input code',
      name: 'code',
      value: settingList.value?.['free-code'],
      type: 'text',
      required: false,
      placeholder: 'Enter code',
      dependsOn: {
        conditions: [

          {
            condition: (val) => settingList.value?.['free-code'],
            field: 'member',
          },
        ],
      }
    },
    {
      label: 'savings product',
      name: 'product_id',
      type: 'select',
      required: true,
      options: [],
      placeholder: 'Enter a savings product',
      url: 'global/savings-products',
      dataOnMount: true,
      change: async (val: any) => {
        const amount = fields.value.find((f: any) => f.name === 'in_deposit')?.value
        if (amount)
          watchChangeInProductOrCharges(fields, amount)

      }
    },

    {
      label: 'is New Account',
      name: 'new_account',
      type: 'select',
      required: true,
      options: yesNoOptions,
      value: 1,
      // disabled: true,
      placeholder: 'Enter is New Account',
    }, 
    {
      label: 'inital deposit',
      name: 'in_deposit',
      type: 'number',
      value: 0,
      required: true,
      placeholder: 'Select initial deposit',

      dependsOn: {
        conditions: [
          {
            field: 'new_account',
            condition: (val: any) => settingList.value['hide-initial-deposit-field'],
            // condition: (val: any) => Number(val) === 1 && !settingList.value['hide-initial-deposit-field'],
          },
          // {
          //   field: 'cm_balance',
          //   condition: (val: any) => Number(val) >= 0
          // },
        ],
      },
      change: async (val: any) => {
        const amount = val?.target ? val.target.value : val
        watchChangeInProductOrCharges(fields, amount)
      },
    },
    {
      label: 'charges',
      name: 'charges',
      type: 'text',
      required: true,
      disabled: true,
      placeholder: 'Enter charges',
      dependsOn: {
        conditions: [
          {
            field: 'in_deposit',
            condition: (val: any) => Number(val) > 0 && settingList.value['hide-initial-deposit-field'],
          },
          {
            field: 'product_id',
            condition: (val: any) => !!val,
          },
        ],
      }
    },
    {
      label: 'payment mode (Debit Account)',
      name: 'payment_mode_id',
      type: 'select',
      url: "global/chart-of-accounts",
      data: { account_type: 'ASSET' },
      dataOnMount: true,
    required: true,

      options: [],
      placeholder: 'Select income account',
      // condition: (val: string) => ['on_registration', 'on_loan_application'].includes(val)
    },
    {
      label: 'Status',
      name: 'Status',
      type: 'select',
      value: 'active',
      required: true,
      options: [
        { id: 'active', name: 'active' },
        { name: 'dormant', id: 'dormant' },
      ],
      placeholder: 'Enter account Status',
    },
  ] as any[])
async function promtValueOnUpdate() {
  loading.value = true
  if (props.data) {
    const data = {
      tenant_id: props.data.tenant_id,
      plan: props.data.plan_id,
      date: [props.data.starts, props.data.expires],
      status: props.data.status,
    }
    await Object.entries(data).forEach(([key, value]) => {
      const field = fields.value.find((f: any) => f.name === key)
      if (field) field.value = value
    })
  }
  loading.value = false
}
function checkForSettings() {
  const checkForVaailableSetting = getSystemSetting()

  settingList.value = {
    'hide-initial-deposit-field': checkForVaailableSetting?.['sacco-members-show-initial-deposit-field'] ?? 0,
    'free-code': checkForVaailableSetting?.['sacco-savings-accounts-free-input-code'] ?? 0,
  }
  console.log(checkForVaailableSetting);
}
const watchChangeInProductOrCharges = debounce(async (fields: any, amount: any) => {
  const finedProduct = fields.value.find((f: any) => f.name === 'product_id')
  const chargeField = fields.value.find((f: any) => f.name === 'charges')

  if (!finedProduct || !finedProduct.value) return

  tryCatch(async () => {
    const res: any = await getProductCharges({
      product_id: finedProduct.value,
      amount: amount,
      type: 'deposit',
    })

    if (chargeField) {
      chargeField.value = `${res?.cost ?? 0} (charges)`
      chargeField.hidden = false
      chargeField.label = 'charges'
    }
  })
}, 900)

onMounted(() => {
  promtValueOnUpdate()
  checkForSettings()
}) 
</script>
