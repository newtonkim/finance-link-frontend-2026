<script setup lang="ts">
import { ref,  watch } from 'vue';
import SearchableSelect from '@/components/SearchableSelect.vue';
import PhoneInput from '@/components/PhoneInput.vue';
import FormField from '@/components/FormField.vue';
import MoneyInput from '@/components/MoneyInput.vue';
import { UserCircle2 } from 'lucide-vue-next';

// Props: form object + array of dynamic fields
const props = defineProps<{
    form: any;
    fields: Array<{
        label: string;
        name: string;
        type: string;
        options?: Array<{ id: any; name: string }>;
        props?: Record<string, any>;
        required?: boolean;
        error?: string;
    }>;
    parentStyle?: string;
}>();

const emits = defineEmits(['submit', 'clear', 'update:form']);

const inputClass = 'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#001d22]/90 focus:ring-1 focus:ring-[#001d22]/90 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-[#8ba8a2]/90 dark:focus:ring-[#8ba8a2]/90';

// Avatar handling
const avatarPreview = ref<string | null>(null);
const handleAvatarChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        const file = target.files[0];
        props.form.avatar = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            avatarPreview.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    } else {
        props.form.avatar = null;
        avatarPreview.value = props.form.avatar_url || null;
    }
};


watch(
    () => props.form,
    (newVal) => {
        emits('update:form', newVal);
    },
    { deep: true },
);

</script>

<template>
    <div :class="parentStyle + ' space-y-2'">
        <div v-for="(field, index) in fields" :key="index">
            <FormField :label="field.label" :required="field.required" :html-for="field.name"
                :error="props.form.errors?.[field.name]">
                <!-- Text/Email/Date/Tel Input -->
                <template v-if="['text', 'email', 'date', 'tel'].includes(field.type)">
                    <input :id="field.name" :type="field.type" v-model="form[field.name]" :class="inputClass"
                        v-bind="field.props" />
                </template>

                <!-- Textarea -->
                <template v-else-if="field.type === 'textarea'">
                    <textarea :id="field.name" v-model="form[field.name]" :class="inputClass + ' resize-y min-h-[80px]'"
                        v-bind="field.props" />
                </template>

                <!-- Searchable Select -->
                <template v-else-if="field.type === 'select'">
                    <SearchableSelect v-model="form[field.name]" :options="field.options || []"
                        :placeholder="field.props?.placeholder || ''" :error="form.errors?.[field.name]" />
                </template>

                <!-- Phone Input -->
                <template v-else-if="field.type === 'phone'">
                    <!-- {{ form[field.name] }} -->
                    <PhoneInput v-model="form[field.name]" :placeholder="field.props?.placeholder || ''" />
                </template>

                <!-- Money Input -->
                <template v-else-if="field.type === 'money'">
                    <MoneyInput :id="field.name" v-model="form[field.name]"
                        :placeholder="field.props?.placeholder || ''" />
                </template>

                <!-- Avatar Input -->
                <template v-else-if="field.type === 'avatar'">
                    <div class="flex items-center gap-4 mt-2">
                        <div
                            class="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                            <img v-if="avatarPreview || form.avatar_url" :src="avatarPreview || form.avatar_url"
                                alt="Avatar" class="h-full w-full object-cover" />
                            <UserCircle2 v-else :size="32" class="text-neutral-400" />
                        </div>
                        <div class="flex-1">
                            <input id="avatar" type="file" accept="image/*" @change="handleAvatarChange"
                                class="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#10C469]/10 file:text-[#10C469] hover:file:bg-[#10C469]/20 transition-colors" />
                            <p class="text-xs text-neutral-400 mt-1">Recommended: Square image, max 2MB.</p>
                        </div>
                    </div>
                </template>

                <!-- Default Text Input -->
                <template v-else>
                    <input type="text" v-model="form[field.name]" :class="inputClass" v-bind="field.props" />
                </template>
                <slot name="after" :field="field" />
            </FormField>
        </div>
    </div>
</template>