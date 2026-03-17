<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import SearchableSelect from '@/Global/SearchableSelect.vue';
import PhoneInput from '@/Global/PhoneInput.vue';
import FormField from '@/Global/FormField.vue';
import MoneyInput from '@/Global/MoneyInput.vue';
import { UserCircle2 } from 'lucide-vue-next';
import { pomPinia } from 'septor-store';
const Store = pomPinia();
const props = defineProps<{
    action: string,
    remount: boolean,
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
}>();

const emits = defineEmits(['update:form', 'field-changed', 'results']);

const prfields = ref<any>([]);
const remountComponent = ref<any>(true);

onMounted(() => {

    if (Array.isArray(props.form))
        prfields.value = [...(props.form)];
    if (props.action == 'add')
        prfields.value = prfields.value.map((f: any) => ({ value: null, ...f }))
        remountComponent.value=false
})
const avatarPreviews = ref<Record<number, string>>({});

const inputClass = 'w-full rounded-lg border focus:border-nfuko-primary/50 focus:ring-1    bg-white px-3 py-2.5 text-sm outline-none transition  border-nfuko-primary/10 focus:ring-1 focus:ring-bg-nfuko-primary/90 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-[#8ba8a2]/90 dark:focus:ring-[#8ba8a2]/90';
function DatawhistleBlower(newFields){
        emits('update:form', newFields);
        emits('results', newFields);
        Store.currentFormValues = newFields
}

watch(
    prfields,
    (newFields) => {

      DatawhistleBlower(newFields)
    },
    { deep: true }
);

const handleChange = (field: any, index: number) => {
    field.change?.(field.value, field, index);
};

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
const nationalityOptions  = [
  { id: 'Ugandan', name: 'Uganda' }, { id: 'Kenyan', name: 'Kenya' },
  { id: 'Tanzanian', name: 'Tanzania' }, { id: 'Rwandan', name: 'Rwanda' },
  { id: 'Burundian', name: 'Burundi' }, { id: 'South Sudanese', name: 'South Sudan' },
  { id: 'Congolese', name: 'DR Congo' }, { id: 'Ethiopian', name: 'Ethiopia' },
  { id: 'Somali', name: 'Somalia' }, { id: 'Nigerian', name: 'Nigeria' },
  { id: 'Ghanaian', name: 'Ghana' }, { id: 'South African', name: 'South Africa' },
  { id: 'British', name: 'United Kingdom' }, { id: 'American', name: 'United States' },
  { id: 'Indian', name: 'India' }, { id: 'Other', name: 'Other' },
]



</script>

<template>
    <div  :class="(parentStyle || '') + ' space-y-2'">

        <div v-for="(field, index) in prfields" :key="index">
            
            <FormField class="capitalize" :label="field?.label?.toLowerCase().replace(/^./, c => c.toUpperCase())"
                :required="field.required" :html-for="field.name" :error="field.error">

                <!-- Text/Email/Date/Tel -->
                <template v-if="['text', 'email', 'date', 'tel'].includes(field.type)">
                    <div class="flex">
                        <input :id="field.name" v-bind="field" v-model="field.value"
                            :class="[inputClass, field.suffix ? 'flex-1 rounded-xl rounded-r-none border-neutral-200 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white' : '']"
                            @input="() => field?.change && handleChange(field, index)" />
                        <div v-if="field?.suffix"
                            class="px-2 flex items-center bg-neutral-100 dark:bg-red-200 border border-l-0 rounded-xl rounded-l-none text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                            {{ field.suffix }}
                        </div>
                    </div>
                </template>

                <!-- Textarea -->
                <template v-else-if="field.type === 'textarea'">
                    <textarea :id="field.name" v-model="field.value" :class="inputClass + ' resize-y min-h-[80px]'"
                        v-bind="field.props ?? field" @input="() => field?.change && handleChange(field, index)" />
                </template>

                <!-- Select -->
                <template v-else-if="field.type === 'select'">
                    <SearchableSelect v-model="field.value" :options="field.options || []"
                        :placeholder="field.props?.placeholder || ''" v-model:item-selected="field.selected"
                        @update:modelValue="() => handleChange(field, index)" v-bind="field" />
                </template>
                <template v-else-if="field.type === 'nationality'">
                    <SearchableSelect v-model="field.value" :options="field.options || nationalityOptions"
                        :placeholder="field.props?.placeholder || ''" v-model:item-selected="field.selected"
                        @update:modelValue="() => handleChange(field, index)" v-bind="field" />
                </template>

                <!-- Phone -->
                <template v-else-if="field.type === 'phone'">
                    <PhoneInput v-model="field.value" :placeholder="field.props?.placeholder || ''"
                        @input="() => field?.change && handleChange(field, index)" />
                </template>

                <!-- Money -->
                <template v-else-if="field.type === 'money'">
                    <MoneyInput :id="field.name" v-model="field.value" :placeholder="field.props?.placeholder || ''"
                        @input="() => field?.change && handleChange(field, index)" />
                </template>
                <!-- date -->
                <template v-else-if="field.type === 'datec'">

                    <DatePicker :id="field.name" v-model="field.value" v-bind="field"
                        @input="() => field?.change && handleChange(field, index)" />
                </template>

                <!-- Avatar -->
                <template v-else-if="['avatar', 'avatar2','prifile'].includes(field.type) ">
                    <div class="flex items-center gap-4 mt-2">
                        <div
                            class="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                            <img v-if="avatarPreviews[index] || field.value" :src="avatarPreviews[index] || field.value"
                                alt="Avatar" class="h-full w-full object-cover" />
                            <UserCircle2 v-else :size="32" class="text-neutral-400" />
                        </div>
                        <div class="flex-1">
                            <input type="file" accept="image/*" @change="(e) => handleAvatarChange(field, index, e)"
                                class="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#10C469]/10 file:text-[#10C469] hover:file:bg-[#10C469]/20 transition-colors" />
                            <p class="text-xs text-neutral-400 mt-1">Recommended: Square image, max 2MB.</p>
                        </div>
                    </div>
                </template>

                <!-- Default -->
                <template v-else>
                    <input type="text" v-model="field.value" :class="inputClass" v-bind="field.props ?? field"
                        @input="() => field?.change && handleChange(field, index)" />
                </template>

            </FormField>
        </div>
    </div>
</template>