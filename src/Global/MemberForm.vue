<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
/**
 * MemberForm — The complete member registration/edit form.
 *
 * Shared between Create and Edit pages. Receives a reactive form object
 * and renders all fields. The parent page controls submission and layout chrome.
 */
import SearchableSelect from '@/Global/SearchableSelect.vue';
import PhoneInput from '@/Global/PhoneInput.vue';
import FormField from '@/Global/FormField.vue';
import FormRow from '@/Global/FormRow.vue';
import MoneyInput from '@/Global/MoneyInput.vue';
import { UserCircle2 } from 'lucide-vue-next';
import { ref, computed } from 'vue';
import {
    memberTypeOptions,
    salutationOptions,
    genderOptions,
    maritalStatusOptions,
    nationalityOptions,
    shareholderOptions,
} from '@/constants/memberOptions';

const inputClass = 'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus: border-nfuko-primary focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-[#8ba8a2]';

const props = defineProps<{
    form: any;
    savingsProducts?: Array<{ id: number; name: string; type?: string }>;
}>();

const isExistingMember = computed(() => props.form.member_type === 'existing_member');

const savingsProductOptions = computed(() =>
    (props.savingsProducts ?? []).map(p => ({ id: p.id, name: p.name }))
);

defineEmits(['submit', 'clear']);

const avatarPreview = ref<string | null>(null);

const handleAvatarChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        const file = target.files[0];
        props.form.avatar = file;

        // Create preview
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
</script>

<template>
    <!-- eslint-disable vue/no-mutating-props -->
    <form @submit.prevent="$emit('submit')" class="space-y-6">

        <!-- Member Type & Is Shareholder -->
        <FormRow>
            <SearchableSelect
                v-model="form.member_type"
                :options="memberTypeOptions"
                label="Member type *"
                placeholder="Select Member Type"
                :error="form.errors.member_type"
            />
            <SearchableSelect
                v-if="isExistingMember"
                v-model="form.is_shareholder"
                :options="shareholderOptions"
                label="Is a shareholder *"
                placeholder="Select"
                :error="form.errors.is_shareholder"
            />
            <FormField v-else label="Full Name" :required="true" html-for="name" :error="form.errors.name">
                    <input id="name" v-model="form.name" type="text" :class="inputClass" placeholder="Enter Full name" />
            </FormField>
        </FormRow>

        <!-- Full Name & Salutation (for existing member) -->
        <FormRow v-if="isExistingMember">
            <FormField label="Full Name" :required="true" html-for="name" :error="form.errors.name">
                    <input id="name" v-model="form.name" type="text" :class="inputClass" placeholder="Enter Full name" />
            </FormField>
            <SearchableSelect
                v-model="form.salutation"
                :options="salutationOptions"
                label="Salutation"
                placeholder="Select Salutation"
                :error="form.errors.salutation"
            />
        </FormRow>

        <!-- Salutation & Gender (for new member) / Gender & DOB (for existing member) -->
        <FormRow v-if="!isExistingMember">
            <SearchableSelect
                v-model="form.salutation"
                :options="salutationOptions"
                label="Salutation"
                placeholder="Select Salutation"
                :error="form.errors.salutation"
            />
            <SearchableSelect
                v-model="form.gender"
                :options="genderOptions"
                label="Gender *"
                placeholder="Select Gender"
                :error="form.errors.gender"
            />
        </FormRow>
        <FormRow v-else>
            <SearchableSelect
                v-model="form.gender"
                :options="genderOptions"
                label="Gender *"
                placeholder="Select Gender"
                :error="form.errors.gender"
            />
            <FormField label="Date Of birth" html-for="dob" :error="form.errors.dob">
                    <input id="dob" v-model="form.dob" type="date" :class="inputClass" />
            </FormField>
        </FormRow>

        <!-- Date of Birth & Primary Contact (new member) / Primary Contact & Other Contact (existing member) -->
        <FormRow v-if="!isExistingMember">
            <FormField label="Date Of birth" html-for="dob" :error="form.errors.dob">
                    <input id="dob" v-model="form.dob" type="date" :class="inputClass" />
            </FormField>
            <FormField label="Primary Contact" :required="true" :error="form.errors.phone">
                    <PhoneInput
                    v-model="form.phone"
                    v-model:country-code="form.phone_country"
                    placeholder="Contact"
                />
            </FormField>
        </FormRow>
        <FormRow v-else>
            <FormField label="Primary Contact" :required="true" :error="form.errors.phone">
                    <PhoneInput
                    v-model="form.phone"
                    v-model:country-code="form.phone_country"
                    placeholder="Contact"
                />
            </FormField>
            <FormField label="Other Contact" :error="form.errors.other_contact">
                    <PhoneInput
                    v-model="form.other_contact"
                    v-model:country-code="form.other_contact_country"
                    placeholder="Other Contact"
                />
            </FormField>
        </FormRow>

        <!-- Other Contact & Mobile Money (new member) / Mobile Money & Email (existing member) -->
        <FormRow v-if="!isExistingMember">
            <FormField label="Other Contact" :error="form.errors.other_contact">
                    <PhoneInput
                    v-model="form.other_contact"
                    v-model:country-code="form.other_contact_country"
                    placeholder="Other Contact"
                />
            </FormField>
            <FormField label="Mobile Money Number" :error="form.errors.mobile_money_number">
                    <PhoneInput
                    v-model="form.mobile_money_number"
                    v-model:country-code="form.mobile_money_country"
                    placeholder="Mobile Money Number"
                />
            </FormField>
        </FormRow>
        <FormRow v-else>
            <FormField label="Mobile Money Number" :error="form.errors.mobile_money_number">
                    <PhoneInput
                    v-model="form.mobile_money_number"
                    v-model:country-code="form.mobile_money_country"
                    placeholder="Mobile Money Number"
                />
            </FormField>
            <FormField label="Email" html-for="email" :error="form.errors.email">
                    <input id="email" v-model="form.email" type="email" :class="inputClass" placeholder="Enter Email" />
            </FormField>
        </FormRow>

        <!-- Email & NIN (new member) / NIN & Marital Status (existing member) -->
        <FormRow v-if="!isExistingMember">
            <FormField label="Email" html-for="email" :error="form.errors.email">
                    <input id="email" v-model="form.email" type="email" :class="inputClass" placeholder="Enter Email" />
            </FormField>
            <FormField label="NIN" html-for="id_number" :error="form.errors.id_number">
                    <input id="id_number" v-model="form.id_number" type="text" :class="inputClass" placeholder="Enter NIN" />
            </FormField>
        </FormRow>
        <FormRow v-else>
            <FormField label="NIN" html-for="id_number" :error="form.errors.id_number">
                    <input id="id_number" v-model="form.id_number" type="text" :class="inputClass" placeholder="Enter NIN" />
            </FormField>
            <SearchableSelect
                v-model="form.marital_status"
                :options="maritalStatusOptions"
                label="Marital Status *"
                placeholder="Select Marital Status"
                :error="form.errors.marital_status"
            />
        </FormRow>

        <!-- Marital Status & Nationality (new member) / Nationality & Address (existing member) -->
        <FormRow v-if="!isExistingMember">
            <SearchableSelect
                v-model="form.marital_status"
                :options="maritalStatusOptions"
                label="Marital Status *"
                placeholder="Select Marital Status"
                :error="form.errors.marital_status"
            />
            <SearchableSelect
                v-model="form.nationality"
                :options="nationalityOptions"
                label="Nationality *"
                placeholder="Select Nationality"
                :error="form.errors.nationality"
            />
        </FormRow>
        <FormRow v-else>
            <SearchableSelect
                v-model="form.nationality"
                :options="nationalityOptions"
                label="Nationality *"
                placeholder="Select Nationality"
                :error="form.errors.nationality"
            />
            <FormField label="Address" :required="true" html-for="address" :error="form.errors.address">
                    <input id="address" v-model="form.address" type="text" :class="inputClass" placeholder="Location" />
            </FormField>
        </FormRow>

        <!-- Address & Avatar Upload (new member) -->
        <template v-if="!isExistingMember">
            <FormRow>
                <FormField label="Address" :required="true" html-for="address" :error="form.errors.address">
                        <textarea
                        id="address"
                        v-model="form.address"
                        :class="inputClass + ' resize-y min-h-[80px]'"
                        placeholder="Location"
                        rows="3"
                    ></textarea>
                </FormField>

                <FormField label="Profile Picture (Optional)" html-for="avatar" :error="form.errors.avatar">
                    <div class="flex items-center gap-4 mt-2">
                        <div class="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                            <img v-if="avatarPreview || form.avatar_url" :src="avatarPreview || form.avatar_url" alt="Avatar" class="h-full w-full object-cover" />
                            <UserCircle2 v-else :size="32" class="text-neutral-400" />
                        </div>
                        <div class="flex-1">
                            <input
                                id="avatar"
                                type="file"
                                accept="image/*"
                                @change="handleAvatarChange"
                                class="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#10C469]/10 file:text-[#10C469] hover:file:bg-[#10C469]/20 transition-colors"
                            />
                            <p class="text-xs text-neutral-400 mt-1">Recommended: Square image, max 2MB.</p>
                        </div>
                    </div>
                </FormField>
            </FormRow>
        </template>

        <!-- Next of Kin -->
        <FormRow>
            <FormField label="Next of kin" html-for="next_of_kin" :error="form.errors.next_of_kin">
                    <input id="next_of_kin" v-model="form.next_of_kin" type="text" :class="inputClass" placeholder="Enter Next of kin" />
            </FormField>
            <FormField label="Next of kin contact" :error="form.errors.next_of_kin_contact">
                    <PhoneInput
                    v-model="form.next_of_kin_contact"
                    v-model:country-code="form.next_of_kin_contact_country"
                    placeholder="Enter Next of kin's contact"
                />
            </FormField>
        </FormRow>

        <!-- Saving Product & Opening Balance (existing member) / Initial Deposit & Date Joined (new member) -->
        <template v-if="isExistingMember">
            <FormRow>
                <SearchableSelect
                    v-model="form.savings_product_id"
                    :options="savingsProductOptions"
                    label="Saving Product *"
                    placeholder="Select Account"
                    :error="form.errors.savings_product_id"
                />
                <FormField label="Opening balance" :required="true" html-for="opening_balance" :error="form.errors.opening_balance">
                        <MoneyInput id="opening_balance" v-model="form.opening_balance" placeholder="Opening balance" />
                </FormField>
            </FormRow>
            <FormRow>
                <FormField label="Date Joined (Optional)" html-for="joined_at" :error="form.errors.joined_at">
                        <input id="joined_at" v-model="form.joined_at" type="date" :class="inputClass" />
                </FormField>
            </FormRow>
        </template>
        <template v-else>
            <FormRow>
                <FormField label="Initial deposit" :required="true" html-for="initial_deposit" :error="form.errors.initial_deposit">
                        <MoneyInput id="initial_deposit" v-model="form.initial_deposit" placeholder="Initial deposit" />
                </FormField>
                <FormField label="Date Joined (Optional)" html-for="joined_at" :error="form.errors.joined_at">
                        <input id="joined_at" v-model="form.joined_at" type="date" :class="inputClass" />
                </FormField>
            </FormRow>
        </template>

        <!-- Action Buttons (slot allows parent to customize) -->
        <div class="pt-4 flex items-center justify-between">
            <slot name="actions">
                <button
                    type="button"
                    @click="$emit('clear')"
                    class="rounded-lg border border-yellow-400 px-6 py-2 text-sm font-medium text-yellow-600 hover:bg-yellow-50 transition-colors"
                >
                    Clear
                </button>
                <button
                    type="submit"
                    :disabled="form.processing"
                    class="rounded-lg bg-[#052659] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#052659]/90 flex items-center gap-2"
                >
                    <span v-if="form.processing" class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
                    Submit
                </button>
            </slot>
        </div>
    </form>
</template>
