<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core"
import { useForwardPropsEmits } from "reka-ui"
import { OTPInput } from "vue-input-otp"
import { cn } from "@/lib/utils"

interface Props {
  class?: string
  maxlength?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxlength: 6
})

const emits = defineEmits([
  "change",
  "complete",
  "update:modelValue"
])

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <OTPInput
    v-slot="slotProps"
    v-bind="forwarded"
    :maxlength="props.maxlength"
    :container-class="cn('flex items-center gap-2 has-disabled:opacity-50', props.class)"
    data-slot="input-otp"
    class="disabled:cursor-not-allowed"
  >
    <slot v-bind="slotProps" />
  </OTPInput>
</template>