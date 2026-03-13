<template>
  <div class="p-8 space-y-6">
    <div>
      <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
        Review
      </h2>
      <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
        Verify all details before creating the tenant.
      </p>
    </div>

    <div class="space-y-5">
      
      <!-- SACCO Info -->
      <div
        class="p-5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-100 dark:border-white/10 space-y-3"
      >
        <h3
          class="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider"
        >
          SACCO Information
        </h3>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-neutral-500 dark:text-neutral-400">Name</span>
            <p class="font-semibold text-neutral-900 dark:text-white">
              {{ form.saccoName || "—" }}
            </p>
          </div>

          <div>
            <span class="text-neutral-500 dark:text-neutral-400">Subdomain</span>
            <p class="font-semibold text-neutral-900 dark:text-white">
              {{ form.subdomain || "—" }}.mfukopro.com
            </p>
          </div>
        </div>
      </div>

      <!-- Admin Info -->
      <div
        class="p-5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-100 dark:border-white/10 space-y-3"
      >
        <h3
          class="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider"
        >
          Admin Account
        </h3>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-neutral-500 dark:text-neutral-400">Name</span>
            <p class="font-semibold text-neutral-900 dark:text-white">
              {{ form.adminName || "—" }}
            </p>
          </div>

          <div>
            <span class="text-neutral-500 dark:text-neutral-400">Email</span>
            <p class="font-semibold text-neutral-900 dark:text-white">
              {{ form.adminEmail || "—" }}
            </p>
          </div>

          <div>
            <span class="text-neutral-500 dark:text-neutral-400">Phone</span>
            <p class="font-semibold text-neutral-900 dark:text-white">
              {{ form.adminPhone || "—" }}
            </p>
          </div>
        </div>
      </div>

      <!-- Licensing -->
      <div
        class="p-5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-100 dark:border-white/10 space-y-3"
      >
        <h3
          class="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider"
        >
          Licensing
        </h3>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-neutral-500 dark:text-neutral-400">Plan</span>
            <p class="font-semibold text-neutral-900 dark:text-white capitalize">
              {{ form.plan || "—" }}
            </p>
          </div>

          <div>
            <span class="text-neutral-500 dark:text-neutral-400">Duration</span>
            <p class="font-semibold text-neutral-900 dark:text-white">
              {{ form.licenseMonths || "—" }}
            </p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  form: {
    type: Array,
    default: () => []
  }
});
 
const fieldMap = {
  name: "saccoName",
  subdomain: "subdomain",
  admin_name: "adminName",
  admin_email: "adminEmail",
  admin_phone: "adminPhone",
  plan: "plan",
  license_months: "licenseMonths"
};
const form = ref({
  saccoName: "",
  subdomain: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
  plan: "",
  licenseMonths: ""
});
 
watch(
  () => props.form,(fields) => {
    if (!fields) return;
    fields.forEach((field) => {
      const key = fieldMap[field.name];
      if (key) {
        form.value[key] = field.value;
      }
    });
  },
  { immediate: true }
);
</script>