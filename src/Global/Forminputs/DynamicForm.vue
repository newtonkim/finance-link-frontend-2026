<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import SearchableSelect from '@/Global/SearchableSelect.vue';
import MultiSearchableSelect from '@/Global/MultiSearchableSelect.vue'

import PhoneInput from '@/Global/PhoneInput.vue';
import FormField from '@/Global/FormField.vue';
import MoneyInput from '@/Global/MoneyInput.vue';
import { Printer, UserCircle2, Eye, EyeOff } from 'lucide-vue-next';
import { pomPinia } from 'septor-store';
import { formawtacher } from './formWatcher';
const Store = pomPinia();
const formStore = formawtacher()
const props = defineProps<{
    action?: string,
    isSubmitted?: boolean,
    remount?: boolean,
    form: Array<{
        label: string;
        name: string;
        type: string;
        value?: any;
        options?: Array<{ id: any; name: string }>;
        props?: Record<string, any>;
        required?: boolean;
        error?: string;
        suffix?: string;
        change?: (value: any, field: any, index: number) => void;
    }>;
    parentStyle?: string;
    /**
     * this form to show will depend on  {
     * field: 'field_name',
     * value: 'value'
     * 
     * }
     * **/
    dependsOn?: {
        field: string;
        value: any;
    } | Array<{
        field: string;
        value: any;
    }>
}>();

const emits = defineEmits(['update:form', 'field-changed', 'results']);

const prfields = ref<any>([]);
const remountComponent = ref<any>(true);

onMounted(() => {
    if (Array.isArray(props.form))
        prfields.value = [...(props.form)];

    if (props.action == 'add')
        prfields.value = prfields.value.map((f: any) => ({ value: null, ...f }))
    remountComponent.value = false;
    formStore.isFormSubmitted = false
})
const avatarPreviews = ref<Record<number, string>>({});
const showPasswordFields = ref<Record<number, boolean>>({});

function handlePasswordChange(field: any, index: number) {
    field.change?.(field.value, field, index);
    if (field.matchName) {
        const matchField = prfields.value.find((f: any) => f.name === field.matchName);
        if (matchField) {
            const mismatch = field.value !== matchField.value;
            field.error = mismatch ? 'Password mismatch' : null;
            field.showError = mismatch;
        }
    }
    const dependentField = prfields.value.find((f: any) => f.matchName === field.name);
    if (dependentField && dependentField.value !== undefined && dependentField.value !== null && dependentField.value !== '') {
        const mismatch = field.value !== dependentField.value;
        dependentField.error = mismatch ? 'Password mismatch' : null;
        dependentField.showError = mismatch;
    }
    DatawhistleBlower(prfields.value);
}

const inputClass = 'w-full rounded-lg border focus:border-nfuko-primary/50 focus:ring-1    bg-white px-3 py-2.5 text-sm outline-none transition  border-nfuko-primary/10 focus:ring-1 focus:ring-bg-nfuko-primary/90 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-[#8ba8a2]/90 dark:focus:ring-[#8ba8a2]/90';
function DatawhistleBlower(newFields: any) {
    emits('update:form', newFields);
    emits('results', newFields);
    const NewCollectionSet: any[] = [];
    if (Array.isArray(newFields)) {
        newFields.forEach((field: any) => {
            if (field?.fields) {
                NewCollectionSet.push(...field.fields)
            } else
                NewCollectionSet.push(field)
        })
    }
    // let remove the duplicate in the data  
    /// to sa ve the clean version of the data 
    formStore.currentFormValues = Object.values([
        ...(Array.isArray(formStore.currentFormValues) ? formStore.currentFormValues : []),
        ...NewCollectionSet
    ].reduce((acc: any, item: any) => {
        acc[item.name] = item;
        return acc;
    }, {})
    );


}

watch(
    prfields,
    (newFields) => {


        DatawhistleBlower(newFields);
    },
    { deep: true }
);
const isTriggered = computed(() => props.isSubmitted || formStore.isFormSubmitted)

watch(isTriggered, (val) => {
    // console.log(props.isSubmitted);

    if (val)
        formStore.AnyErrorsFoundInTheFOrm = FormValidate()
})

const handleChange = (field: any, index: number) => {
    if (field?.change)
        field.change?.(field.value, field, index);
};
function FormValidate() {
    const data = prfields.value.filter((field: any) => shouldShowField(field)) || [];
    console.log(prfields.value);

    if (isTriggered) {
        data.forEach((field: any) => {
            // field?.error = null
            if (field?.fields) {
                field.fields.forEach((subfield: any) => {
                    subfield.showError = false

                    if (subfield.required) {
                        subfield.error = null;
                        const isEmpty =
                            subfield.value === null ||
                            subfield.value === undefined ||
                            subfield.value === '';
                        if (isEmpty) {
                            subfield.error = subfield?.error || 'This field is required *';
                            subfield.showError = true
                        }

                    }
                })
            } else if (field?.error?.length > 0) {
                const isEmpty = field.value === null || field.value === undefined || field.value === '';
                if (isEmpty) {

                } else {
                    field.error = false
                }
                // field.showError = true
            } else if (field.required) {
                const isEmpty = field.value === null || field.value === undefined || field.value === '';
                if (isEmpty) {
                    field.error = field?.error || 'This field is required *';
                } else {
                    field.error = null;

                }
            }
        });
    }
    formStore.isFormSubmitted = false

    return data.some((field: any) => {

        if (field.error) {
            console.log(field);


        }
        return field.error

    });
}

const handleAvatarChange = (field: any, index: number, event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        const file = target.files[0];
        field.value = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            avatarPreviews.value[index] = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    } else {
        field.value = null;
        avatarPreviews.value[index] = '';
    }
    emits('field-changed', { field, index });
    DatawhistleBlower(field);
};
const nationalityOptions = [
    { id: 'Ugandan', name: 'Uganda' }, { id: 'Kenyan', name: 'Kenya' },
    { id: 'Tanzanian', name: 'Tanzania' }, { id: 'Rwandan', name: 'Rwanda' },
    { id: 'Burundian', name: 'Burundi' }, { id: 'South Sudanese', name: 'South Sudan' },
    { id: 'Congolese', name: 'DR Congo' }, { id: 'Ethiopian', name: 'Ethiopia' },
    { id: 'Somali', name: 'Somalia' }, { id: 'Nigerian', name: 'Nigeria' },
    { id: 'Ghanaian', name: 'Ghana' }, { id: 'South African', name: 'South Africa' },
    { id: 'British', name: 'United Kingdom' }, { id: 'American', name: 'United States' },
    { id: 'Indian', name: 'India' }, { id: 'Other', name: 'Other' },
]

defineExpose({
    FormValidate,

})

const getGridClass = (len: number = 1) => {
    if (len <= 1) return 'grid grid-cols-1 gap-3 space-y-2'
    if (len === 2) return 'grid grid-cols-2 gap-3 space-y-2'
    if (len >= 3) return 'grid grid-cols-3 gap-3 space-y-2'
    return 'grid grid-cols-4 gap-3 space-y-2'
}


// dependsOn: {
//     field: 'amount',
//     condition: (value: any) => Number(value) > 0
//   }
function shouldShowField(field: any) {

    if (!field.dependsOn) return true;

    // Handle new structure
    if (field.dependsOn.conditions) {
        const { operator = 'and', conditions } = field.dependsOn;

        const results = conditions.map((condition: any) => {
            const target = prfields.value.find(
                (f: any) => f.name === condition.field
            );

            if (!target) return false;

            if (typeof condition.condition === 'function') {
                return condition.condition(target.value);
            }

            return target.value === condition.value;
        });

        return operator === 'or'
            ? results.some(Boolean)
            : results.every(Boolean);
    }

    // fallback (old format)
    const conditions = Array.isArray(field.dependsOn)
        ? field.dependsOn
        : [field.dependsOn];

    return conditions.every((condition: any) => {
        const target = prfields.value.find(
            (f: any) => f.name === condition.field
        );

        if (!target) return false;
        return target.value === condition.value;
    });
}

</script>

<template>
    <div class="">

        <div
            :class="(parentStyle || 'grid grid-cols-1 xl:grid-cols-6 sm:grid-cols-2 md:grid-cols-3 gap-5') + ' space-y-2  print-container'">
            <template v-for="(field, index) in prfields" :key="index" class="pom ">
                <template v-if="shouldShowField(field)">
                    <template v-if="field.group >= 0">
                        <div :class="[field?.class, 'capitalize']">
                            {{field?.label?.toLowerCase().replace(/^./, (c: any) => c.toUpperCase())}}
                        </div>
                        <DynamicForm :parentStyle="getGridClass(field.group ?? field?.fields?.length)"
                            :form="field.fields" :action="field.action" @results="emits('results', $event)"
                            @field-changed="emits('field-changed', $event)" />
                    </template>
                    <div v-else :class="[field.hidden ? 'hidden' : '', field?.class]">

                        <FormField class="capitalize"
                            :label="field?.label?.toLowerCase().replace(/^./, (c: any) => c.toUpperCase())"
                            :required="field.required" :html-for="field.name" :error="field.error"
                            :showError="field?.showError">
                            <slot name='field.name' v-if='$slots[field.name]' />
                            <span v-else>
                                <!-- Text/Email/Date/Tel -->
                                <template v-if="['text', 'email', 'date', 'tel'].includes(field.type)">
                                    <div class="flex">
                                        <input :id="field.name" v-bind="field" v-model="field.value"
                                            class="rounded-xl cursor-pointer   hover:border-nfuko-primary-300 hover:bg-nfuko-primary-50 dark:hover:bg-neutral-800 transition group"
                                            :class="[inputClass, field?.class, field.suffix ? 'flex-1 rounded-xl rounded-r-none border-neutral-200 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white' : '']"
                                            @input="() => field?.change && handleChange(field, Number(index))" />
                                        <div v-if="field?.suffix"
                                            class="px-2 flex items-center bg-neutral-100 dark:bg-red-200 border border-l-0 rounded-xl rounded-l-none text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                                            {{ field.suffix }}
                                        </div>
                                    </div>
                                </template>

                                <!-- Password -->
                                <template v-else-if="field.type === 'password'">
                                    <div class="relative">
                                        <input
                                            :id="field.name"
                                            :type="showPasswordFields[index] ? 'text' : 'password'"
                                            v-model="field.value"
                                            v-bind="field.props ?? {}"
                                            :class="[inputClass, field?.class, 'pr-11']"
                                            class="rounded-xl"
                                            @input="() => handlePasswordChange(field, Number(index))"
                                        />
                                        <button
                                            type="button"
                                            @click="showPasswordFields[index] = !showPasswordFields[index]"
                                            class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                        >
                                            <EyeOff v-if="showPasswordFields[index]" class="size-4" />
                                            <Eye v-else class="size-4" />
                                        </button>
                                    </div>
                                </template>

                                <!-- Textarea -->
                                <template v-else-if="field.type === 'textarea'">
                                    <textarea :id="field.name" v-model="field.value"
                                        :class="[inputClass, field?.class, 'resize-y min-h-[80px]']"
                                        v-bind="field.props ?? field"
                                        @input="() => field?.change && handleChange(field, Number(index))" />
                                </template>

                                <!-- Select -->
                                <template v-else-if="field.type === 'select'">
                                    <SearchableSelect :class="[field?.class]" v-model="field.value"
                                        :options="field.options || []" :placeholder="field?.placeholder || ''"
                                        v-model:item-selected="field.selected"
                                        @update:modelValue="() => handleChange(field, Number(index))" v-bind="field" />
                                </template>
                                <template v-else-if="field.type === 'multi-select'">
                                    <MultiSearchableSelect :class="[field?.class]" v-model="field.value"
                                        :options="field.options || []" :placeholder="field?.placeholder || ''"
                                        v-model:item-selected="field.selected"
                                        @update:modelValue="() => handleChange(field, Number(index))" v-bind="field" />
                                </template>
                                <template v-else-if="field.type === 'nationality'">
                                    <SearchableSelect :class="[field?.class]" v-model="field.value"
                                        :options="field.options || nationalityOptions"
                                        :placeholder="field.props?.placeholder || ''"
                                        v-model:item-selected="field.selected"
                                        @update:modelValue="() => handleChange(field, Number(index))" v-bind="field" />
                                </template>

                                <!-- Phone -->
                                <template v-else-if="field.type === 'phone'">
                                    <PhoneInput :BigClass="[field?.class]" v-model="field.value"
                                        :placeholder="field.props?.placeholder || ''"
                                        @input="() => field?.change && handleChange(field, Number(index))"
                                        v-bind="field" />
                                </template>

                                <!-- Money -->
                                <template v-else-if="field.type === 'money'">
                                    <div class='flex'>
                                        <div v-if="field?.suffix"
                                            class="px-2 flex items-center border-gray-300 bg-neutral-100 dark:bg-red-200 border border-l-0 rounded-xl rounded-r-none text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                                            {{ field.suffix }}
                                        </div>
                                        <MoneyInput :disabled="field?.disabled"
                                            :class="[field?.class, field.suffix ? ' rounded-xl rounded-l-none ' : ''].join(' ')"
                                            :id="field.name" v-model="field.value"
                                            :placeholder="field?.placeholder || ''"
                                            @change="() => field?.change && handleChange(field, Number(index))" />
                                        <!-- {{ field.error }} -->
                                    </div>
                                    <div v-if="field.error" class="mt-2 px-1 text-xs text-red-500 font-medium">{{
                                        field.error }}</div>
                                </template>
                                <!-- date -->
                                <template v-else-if="field.type === 'datec'">

                                    <DatePicker :id="field.name" v-model="field.value" v-bind="field"
                                        :class="[field?.class]"
                                        @input="() => field?.change && handleChange(field, Number(index))" />
                                </template>

                                <!-- Avatar -->
                                <template v-else-if="['avatar', 'avatar2', 'profile'].includes(field.type)">
                                    <div class="flex items-center gap-4 mt-2" :class="[field?.class]">
                                        <div
                                            class="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                                            <img v-if="avatarPreviews[Number(index)] || field.value"
                                                :src="avatarPreviews[Number(index)] || field.value" alt="Avatar"
                                                class="h-full w-full object-cover" />
                                            <UserCircle2 v-else :size="32" class="text-neutral-400" />
                                        </div>
                                        <div class="flex-1">
                                            <input type="file" accept="image/*"
                                                @change="(e) => handleAvatarChange(field, Number(index), e)"
                                                class="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#10C469]/10 file:text-[#10C469] hover:file:bg-[#10C469]/20 transition-colors" />
                                            <p class="text-xs text-neutral-400 mt-1">Recommended: Square image, max 2MB.
                                            </p>
                                        </div>
                                    </div>
                                    <div v-if="field.error" class="mt-2 px-1 text-xs text-red-500 font-medium">{{
                                        field.error }}</div>
                                </template>

                                <!-- Default -->
                                <template v-else>
                                    <input type="text" v-model="field.value" :class="[field?.class, inputClass]"
                                        v-bind="field.props ?? field"
                                        class="rounded-xl cursor-pointer   hover:border-nfuko-primary-300 hover:bg-nfuko-primary-50 dark:hover:bg-neutral-800 transition group"
                                        @input="() => field?.change && handleChange(field, Number(index))" />
                                </template>

                                <span v-if="field?.helper">
                                    <span class="text-[10x] " v-html="field?.helper"></span>
                                </span>
                            </span>


                        </FormField>
                    </div>
                </template>
            </template>
        </div>
    </div>

</template>