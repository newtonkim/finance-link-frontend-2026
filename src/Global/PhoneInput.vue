<script setup lang="ts">
import { Check, ChevronDown, Search, X } from 'lucide-vue-next';
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Country {
    code: string;
    name: string;
    dial: string;
    flag: string;
}

const props = defineProps<{
    modelValue: string;
    countryCode?: string;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    inputClass?: string;
    containerClass?: string;
    countryButtonClass?: string;
}>();

const emit = defineEmits(['update:modelValue', 'update:countryCode']);

const isOpen = ref(false);
const searchQuery = ref('');
const containerRef = ref<HTMLElement | null>(null);

// East African & common countries for SACCO tenants
const countries: Country[] = [
    { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
    { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
    { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
    { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
    { code: 'BI', name: 'Burundi', dial: '+257', flag: '🇧🇮' },
    { code: 'SS', name: 'South Sudan', dial: '+211', flag: '🇸🇸' },
    { code: 'CD', name: 'DR Congo', dial: '+243', flag: '🇨🇩' },
    { code: 'ET', name: 'Ethiopia', dial: '+251', flag: '🇪🇹' },
    { code: 'SO', name: 'Somalia', dial: '+252', flag: '🇸🇴' },
    { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
    { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
    { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
    { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
    { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
    { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
    { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
    { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪' },
];
const DEFAULT_COUNTRY: Country = { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' };

//const selectedCountry = ref(DEFAULT_COUNTRY);
 const selectedCountry = computed(() => {
    return countries.find(c => c.code === (props.countryCode || 'UG')) || countries[0] || DEFAULT_COUNTRY;
 });

const filteredCountries = computed(() => {
    if (!searchQuery.value) return countries;
    const q = searchQuery.value.toLowerCase();
    return countries.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
});

const selectCountry = (country: Country) => {
    emit('update:countryCode', country.code);
    isOpen.value = false;
    searchQuery.value = '';
   // selectedCountry.value = country;
};

const toggleDropdown = () => {
    if (props.disabled) return;
    isOpen.value = !isOpen.value;
    if (isOpen.value) searchQuery.value = '';
};

const closeDropdown = (e: MouseEvent) => {
    if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
        isOpen.value = false;
    }
};

const displayValue = computed(() => {
    let digits = props.modelValue || '';
    digits = digits.replace(/\D/g, ''); // Ensure only digits

    // Format based on country (East African countries use 9 digits)
    if (['UG', 'KE', 'TZ', 'RW', 'BI', 'SS'].includes(selectedCountry.value.code)) {
        if (digits.length > 6) {
            return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        } else if (digits.length > 3) {
            return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        }
    } else {
        // generic format
        if (digits.length > 6) {
            return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 15)}`;
        } else if (digits.length > 3) {
            return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        }
    }
    return digits.trim();
});

const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const rawValue = target.value;

    // Keep only numbers
    let digits = rawValue.replace(/\D/g, '');

    // East African formatting: strip leading 0, max 9 digits
    if (['UG', 'KE', 'TZ', 'RW', 'BI', 'SS'].includes(selectedCountry.value.code)) {
        if (digits.startsWith('0')) {
            digits = digits.substring(1);
        }
        digits = digits.substring(0, 9);
    } else {
        // Max 15 digits for international
        if (digits.startsWith('0')) {
            digits = digits.substring(1);
        }
        digits = digits.substring(0, 15);
    }
 //console.log(selectedCountry.value.dial)
   // emit('update:modelValue', selectedCountry.value.dial + digits);

    // Force the native input to update its value instantly so the user literally cannot type past the limit
    let formatted = digits;
    if (['UG', 'KE', 'TZ', 'RW', 'BI', 'SS'].includes(selectedCountry.value.code)) {
        if (digits.length > 6) {
            formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        } else if (digits.length > 3) {
            formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;
        }
    } else {
        if (digits.length > 6) {
            formatted = `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 15)}`;
        } else if (digits.length > 3) {
            formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;
        }
    }

    // Explicitly update the DOM element's value to chop off trailing inputs immediately
    target.value = formatted;
  const CCode=selectedCountry.value.dial
  
      emit('update:modelValue', CCode + digits);
     // emit('update:modelValue',  digits);
};

const maxLength = computed(() => {
    // Uganda 9 digits: format is '777 123 456' which is 11 chars
    if (['UG', 'KE', 'TZ', 'RW', 'BI', 'SS'].includes(selectedCountry.value.code)) {
        return 11;
    }
    // Generic format: '123 4567 89012345' which is 17 chars config
    return 17;
});

onMounted(() => window.addEventListener('click', closeDropdown));
onUnmounted(() => window.removeEventListener('click', closeDropdown));
</script>

<template>
    <div ref="containerRef" :class="['flex gap-2 relative', containerClass]">
        <!-- Country Code Selector -->
        <div clas s="relative w-full">
            <button type="button" @click.stop="toggleDropdown" :class="[
                'flex h-full min-h-[40px] items-center gap-1 rounded-xl border border-neutral-200 whitespace-nowrap  px-4 py-2 text-sm font-semibold text-neutral-800 transition-all hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700',
                countryButtonClass,
            ]" :disabled="disabled">
                <span class="flex items-center gap-2">
                    <span class="text-xl leading-none">{{ selectedCountry.flag }}</span>
                    <span class="font-semibold">{{ selectedCountry.dial }}</span>
                </span>
                <ChevronDown class="h-4 w-4 text-neutral-400 transition-transform" :class="{ 'rotate-180': isOpen }" />
            </button>

            <Transition enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-in" leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0">
                <div v-if="isOpen"
                    class="absolute left-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
                    <div class="p-2 border-b border-neutral-100 dark:border-neutral-800">
                        <div class="relative flex items-center">
                            <Search class="absolute left-3 h-4 w-4 text-neutral-400" />
                            <input v-model="searchQuery" type="text" placeholder="Search country..."
                                class="w-full rounded-lg bg-neutral-50 dark:bg-neutral-950 px-9 py-2 text-sm outline-none focus:ring-0 placeholder:text-neutral-400"
                                @click.stop />
                            <button v-if="searchQuery" @click.stop="searchQuery = ''"
                                class="absolute right-3 p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors">
                                <X class="h-3 w-3 text-neutral-400" />
                            </button>
                        </div>
                    </div>
                    
                    <ul class="max-h-48 overflow-auto py-1 scrollbar-hide">
                        <li v-for="country in filteredCountries" :key="country.code"
                            @click.stop="selectCountry(country)"
                            class="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                            :class="country.code === selectedCountry.code ? 'bg-neutral-50 dark:bg-neutral-800 font-semibold' : 'text-neutral-600 dark:text-neutral-400'">
                            <span class="text-base">{{ country.flag }}</span>
                            <span class="flex-1 truncate">{{ country.name }}</span>
                            <span class="text-xs text-neutral-400">{{ country.dial }}</span>
                            <Check v-if="country.code === selectedCountry.code"
                                class="h-4 w-4  text-nfuko-primary dark:text-[#8ba8a2]" />
                        </li>
                        <li v-if="filteredCountries.length === 0"
                            class="px-4 py-6 text-center text-sm text-neutral-400">
                            No countries found
                        </li>
                    </ul>
                </div>
            </Transition>
        </div>

        <!-- Phone Number Input -->
        <input :value="displayValue" @change="handleInput" :maxlength="maxLength" type="text"
            :placeholder="placeholder || 'Phone number'" :disabled="disabled" :class="[
                'flex-1 rounded-xl w-1/3 border py-2 px-4 text-sm outline-none transition-all placeholder:text-neutral-400 disabled:opacity-50 dark:text-white dark:placeholder:text-neutral-500',
                error
                    ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-red-700 dark:bg-red-950/30'
                    : 'border-neutral-200 bg-white focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:bg-neutral-700',
                inputClass
            ]" />
    </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
