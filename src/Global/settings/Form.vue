<template>
<span v-if='fields?.length>0'>

  <div class="mb-4 "   v-for="field in fields">
    <label :for="field.name" class="block font-medium">{{ field.label }}</label>

    <!-- Switch -->
    <div
      v-if="field.settings_action.attr === 'switch'"
      class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700"
    >
      <div>
        <p class="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
          {{ formatName(field.name) }}
        </p>
        <p class="text-[11px] text-neutral-400 mt-0.5">
          {{ field.description }}
        </p>
      </div>
      <button
        @click="toggleSwitch"
        :class="[
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-300',
          modelValue ? 'bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'
        ]"
      >
        <span
          :class="[
            'inline-flex h-4 w-4 rounded-full bg-white shadow transition-transform duration-300',
            modelValue ? 'translate-x-4' : 'translate-x-0.5'
          ]"
        />
      </button>
    </div>

    <!-- Text / Number Input -->
    <div
      v-else-if="['text','number'].includes(field.settings_action?.attr)"
      class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700"
    >
      <div>
        <p class="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
          {{ formatName(field.name) }}
        </p>
        <p class="text-[11px] text-neutral-400 mt-0.5">
          {{ field.description }}
        </p>
      </div>
      <input
        :type="field.settings_action.attr"
        v-model="field.value"
        :class="inputClass"
        class="p-2 rounded border"
      />
    </div>
  </div>
</span>
</template>
<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from "vue";

const props = defineProps({
  fields: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: [Boolean, String, Number],
    default: null,
  },
  inputClass: {
    type: String,
    default: "border border-gray-300 rounded p-2",
  },
});

const emit = defineEmits(["update:modelValue"]);

const internalValue = ref(props.modelValue);

// Update parent when internal value changes
watch(internalValue, (val) => {
  emit("update:modelValue", val);
});

// For switch toggle
function toggleSwitch() {
  internalValue.value = !internalValue.value;
}

// Format field name to replace dashes
function formatName(name: string) {
  return name.replace(/-/g, " ");
}
</script>