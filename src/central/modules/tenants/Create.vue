<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
    Building2,
    UserPlus,
    CreditCard,
    FileCheck,
    ChevronRight,
    ChevronLeft,
} from 'lucide-vue-next'
import { Form, Card, Button } from '@/Global'
import { tenantStep1, tenantStep2, tenantStep3, TenantStep4 } from '../components/tenantsCreationSteps'
import { pomPinia } from 'septor-store';
const emits = defineEmits(['update:form', "changedStep"]);
const Store = pomPinia(),
    currentStep = ref(null), remount = ref<boolean>(true), form = ref([]), formValues = ref([]), steps = [
        { label: 'SACCO Info', icon: Building2 },
        { label: 'Admin Account', icon: UserPlus },
        { label: 'Licensing', icon: CreditCard },
        { label: 'Review', icon: FileCheck }
    ]
const props = defineProps({
    watcher: {
        type: Object,
        default: {},
        required: false

    }
})



watch(currentStep, (step) => {
    remount.value = false
    switch (step) {
        case 0:
            form.value = tenantStep1
            break
        case 1:
            form.value = tenantStep2
            break
        default:
            form.value = []
    }

    setTimeout(() => {
        remount.value = true
    }, 100)
    if (step == steps.length - 1) {
        Store.showSaveButton = true
    }

})


const onFormResults = (fields: any) => {
    const saccoName = fields.find((f: any) => f.name === 'name')
    const subdomain = fields.find((f: any) => f.name === 'subdomain')
    if (saccoName && subdomain) {
        subdomain.value = saccoName.value
            ?.replace(/\s+/g, '')
            ?.toLowerCase()

        form.value = fields
    }
    
    fields.forEach((field: any) => {
        const index = formValues.value.findIndex((f: any) => f.name === field.name)
        if (index > -1) {
            formValues.value[index] = { ...formValues.value[index], ...field }
        } else {
            formValues.value.push(field)
        }
    })
}



const canProceed = computed(() => {
    if (currentStep.value === 2) {
        const plan = formValues.value.find((f: any) => f.name === 'plan')?.value
        const duration = formValues.value.find((f: any) => f.name === 'license_months')?.value
        return !!plan && !!duration
    }
    return form.value.every((field: any) => {
        if (field.required) {
            return !!field.value
        }
        return true
    })
})
function prevStep() {
    if (currentStep.value > 0) {
        currentStep.value--
    }
}

function nextStep() {
    if (canProceed.value && currentStep.value < steps.length - 1) {
        currentStep.value++
    }

}


function storeStep3Data(data: any) {
    data.forEach((field: any) => {
        const index = formValues.value.findIndex((f: any) => f.name === field.name)
        if (index > -1) {
            formValues.value[index] = { ...formValues.value[index], ...field }
        } else {
            formValues.value.push(field)
        }
    })
}
onMounted(() => {

    setTimeout(() => {
        Store.showSaveButton = false
        if (['edit', 'view'].includes(props.watcher.action)) {
            currentStep.value = 1

        } else {
            currentStep.value = 0
            form.value = tenantStep1.map((f: any) => {
                f.value = null
                return f
            });
            form.value = tenantStep2.map((f: any) => {
                f.value = null
                return f
            })
        }
    }, 50)
})

watch(() => formValues.value, (value) => {
    if (value) {
        emits('update:form', value);
    }
}, { deep: true, immediate: true })

watch(() => currentStep.value, (value) => {
    if (value) {



        emits('changedStep', currentStep.value == steps.length - 1);
    }
}, { deep: true, immediate: true })
</script>

<template>
    <form @submit.prevent>
        <div class="p-2 space-y-6">
            <div class="flex items-center justify-between">
                <template v-for="(step, index) in steps" :key="step.label">
                    <div class="flex flex-col items-center gap-2 z-10">
                        <div class="size-10 rounded-full flex items-center justify-center transition-all duration-300"
                            :class="index <= currentStep
                                ? ' bg-nfuko-primary dark:bg-white text-white dark: text-nfuko-primary'
                                : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'">

                            <component :is="step.icon" class="size-5" />

                        </div>

                        <span class="text-xs font-semibold" :class="index <= currentStep
                            ? 'text-neutral-900 dark:text-white'
                            : 'text-neutral-400'">

                            {{ step.label }}

                        </span>

                    </div>


                    <div v-if="index < steps.length - 1" class="flex-1 h-px mx-3 -mt-6" :class="index < currentStep
                        ? ' bg-nfuko-primary dark:bg-white'
                        : 'bg-neutral-200 dark:bg-white/10'"></div>

                </template>

            </div>
            <Card
                class="border-neutral-100 h-[67vh] dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-2xl overflow-auto">
                <div v-if="remount">
                    <div v-if="currentStep <= 1">

                        <Form v-model:form="form" parentStyle="grid grid-cols-2 sm:grid-cols-1 gap-4 md:gap-6 p-5"
                            @results="onFormResults" />
                    </div>
                    <tenantStep3 v-else-if="currentStep <= 2" :selected="formValues" @change="storeStep3Data" />
                    <TenantStep4 v-else-if="currentStep <= 3" :form="formValues" @change="storeStep3Data" />
                </div>

                <div class="px-8 py-5 border-t border-neutral-100 dark:border-white/10 flex justify-between">
                    <Button v-if="currentStep > 0" @click="prevStep" variant="ghost" class="flex items-center gap-1">
                        <ChevronLeft class="size-4" />
                        Back
                    </Button>
                    <div v-else></div>
                    <Button v-if="currentStep < steps.length" @click="nextStep" :disabled="steps.length === currentStep"
                        class="flex items-center gap-1">
                        Next
                        <ChevronRight class="size-4" />
                    </Button>

                </div>

            </Card>

        </div>
    </form>
</template>