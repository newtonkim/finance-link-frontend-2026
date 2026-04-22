<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { Form, Card, ACTION_CONFIG, Table } from "@/Global";
const emits = defineEmits(["update:form"]);
const permissionSelected = ref([]);
const loading = ref(false);
const props = defineProps({
  data: {
    type: Object,
    default: {},
    required: false,
  },
});
const form = ref([
  {
    label: "Name",
    name: "name",
    type: "text",
    required: true,
    placeholder: "Enter Name",
  },
  {
    label: "default permissions",
    name: "permission",
    type: "select",
    url: "/settings/roles/permissions-drop-down",
    required: true,
    placeholder: "Enter Description",
  },
  {
    label: "description",
    name: "dec",
    type: "text",
    required: true,
    placeholder: "Enter Description",
  },
]);

watch(
  () => form.value,
  (value) => {
    if (value) {
      const permission = value.find((f: any) => f.name === "permission");
      if ((permission as any)?.value) {
        permissionSelected.value = [
          ...new Set([
            (permission as any).selected,
            ...permissionSelected.value.filter((p: any) => p.id !== (permission as any).selected.id),
          ]),
        ] as any;
      }
      emits("update:form", { ...value, selectedpermission: permissionSelected.value });
    }
  },
  { deep: true }
);

function removePermission(permission: any) {
  permissionSelected.value = permissionSelected.value.filter(
    (p: any) => p.id !== permission.id
  );
}
const columns = [
  { key: "name", label: "Name" },
  { key: "actions", label: "Actions", show: ["close"] },
];

const actions: any = {
  close: (item: any) => removePermission(item),
};
function handleAction(item: any, action: string) {
  actions?.[action]?.(item);
}

async function prepareData() {
  loading.value = true;
  if (props.data?.id) {
    const colection = form.value;
    for (let i = 0; i < colection.length; i++) {
      const element = colection[i] as any;
      if (element.name !== "permission") (form.value[i] as any).value = props.data[element.name];
      else if (element.name === "permission")
        permissionSelected.value = props.data["permissions"];
    }
    form.value = [
      ...form.value,
      {
        name: "id",
        type: "text",
        required: true,
        value: props.data?.id ?? 0,
        hidden: true,
      } as any,
    ];
  }

  setTimeout(() => {
    loading.value = false;
  }, 500);
}

onMounted(() => {
  prepareData();
});
</script>
<template>
  <div class="">
    <Card
      class="border-neutral-100 h-[79vh] dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-2xl overflow-hidden"
    >
      <Form
        :action="data.action"
        v-if="!loading"
        v-model:form="form"
        parentStyle="grid grid-cols-2 sm:grid-cols-1 gap-4 md:gap-6 px-4 py-0"
      />
      <div class="h-[40vh] overflow-auto">
        <Table
          :action_config="ACTION_CONFIG"
          :handleAction="handleAction"
          :dataFilter="permissionSelected"
          :data="permissionSelected"
          :columns="columns"
        >
        </Table>
      </div>
    </Card>
  </div>
</template>
