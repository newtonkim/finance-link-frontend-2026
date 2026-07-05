<template>
<div class="flex flex-col   font-sans">
  <div class="w-full max-w-md text-center">

    <slot name='header'></slot>
    <div class="mt-12 flex flex-col items-center">
      <label for="logo-upload" class="relative group cursor-pointer">
        <div class="w-70 h-70 rounded-full border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-transparent transition-colors group-hover:bg-gray-50">
        <img  v-if="preview"  :src="preview"  class="w-full h-full object-cover rounded-full"/>
            <div v-if="preview" class="absolute inset-0 hidden items-center justify-center rounded-full bg-black/45 text-sm font-bold text-white group-hover:flex">
              Change Logo
            </div>
            <div v-else class='flex flex-col items-center'>
       <Upload class="h-10 w-10 text-slate-400"/>
          <div class="text-lg font-bold text-slate-600">Upload Logo</div>
          <div class="text-xs text-slate-600 mt-1">(500×500px recommended)</div>
            </div>
        </div>
         <input  id="logo-upload"  type="file"  class="hidden"  accept="image/*" @change="handleFileUpload"/>
      </label> 
    </div>

  </div>
</div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { pomPinia } from 'septor-store';
import { formawtacher } from '../Forminputs/formWatcher';
import { Upload } from 'lucide-vue-next';
const Store = pomPinia() as any;
const formStore = formawtacher() as any;
const preview = ref<string | null>(null);
const file = ref<File | null>(null);

const emits = defineEmits(['update:form', 'results']);

const props = defineProps({
  name: String,
  form: {
    type: Array as any,
    default: () => []
  },
  useFormValues: {
    type: Boolean,
    default: true
  },
  // Existing image URL to preview when editing.
  existing: {
    type: String,
    default: ''
  }
});

onMounted(() => {
  if (props.existing) preview.value = props.existing;
});

watch(() => props.existing, (value) => {
  if (!file.value) preview.value = value || null;
});

// handle file selection
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const selectedFile = target.files?.[0];
  if (!selectedFile) return;

  file.value = selectedFile;

  const reader = new FileReader();
  reader.onload = (e) => {
    preview.value = e.target?.result as string;
  };
  reader.readAsDataURL(selectedFile);
  target.value = '';
};

// emit updated form safely
function updateForm(newFile: File | null) {
  const updatedForm = [...props.form]; // clone

  const index = updatedForm.findIndex(
    (field: any) => field.name === props.name
  );

  if (index !== -1) {
    updatedForm[index].value = newFile;
  } else {
    updatedForm.push({
      name: props.name,
      label: props.name,
      value: newFile,
      hidden: true
    });
  }
  const theFileCheched= updatedForm.find((field: any) => field.name === props.name);
  emits('update:form', updatedForm);
  emits('results', theFileCheched);
  if(props.useFormValues) {
    const current = Array.isArray(formStore.currentFormValues) ? formStore.currentFormValues : [];
    formStore.currentFormValues = Object.values([...current, theFileCheched].reduce((acc: any, item: any) => {
      acc[item.name] = item;
      return acc;
    }, {}));
    const storeCurrent = Array.isArray(Store.currentFormValues) ? Store.currentFormValues : [];
    Store.currentFormValues = Object.values([...storeCurrent, theFileCheched].reduce((acc: any, item: any) => {
      acc[item.name] = item;
      return acc;
    }, {}));
  }

}

// watch file change
watch(file, (newFile) => {
  updateForm(newFile);
});
</script>
