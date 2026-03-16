<template>
    <div class="grid gap-5 lg:grid-cols-2">
        <div
            v-for="(card, index) in settingsCards"
            :key="index"
            class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
            <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">
                {{ card.title }}
            </h3>

            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                {{ card.description }}
            </p>
            <!-- Primary link -->
            <RouterLink
                v-if="card.type === 'link'"
                :to="card.route" 
                v-bind="card.route"
                class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline"
            >
                {{ card.action }}
            </RouterLink>
            <!-- Secondary actions -->
            <template v-if="card?.outClicks">
                <span
                    v-for="(value, key) in card.outClicks" :key="key" >
                    <RouterLink
                        v-if="value.type === 'link'"
                        :to="value.route"
                        v-bind="value"
                        class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline"
                    >
                        {{ value.label }}
                    </RouterLink>

                    <button
                        v-else-if="value.type === 'button'"
                        @click="value.action"
                        class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline"
                    >
                        {{ value.label }}
                    </button>
                </span>
            </template>

            <!-- Dynamic slot -->
            <slot
                :name="slotName(card.title)"
                :card="card"
            />
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    settingsCards: {
        type: Array,
        required: true
    }
})

const slotName = (title) => {
    return title
        .toLowerCase()
        .replace(/\s*\/\s*/g, '-')   // remove /
        .replace(/\s+/g, '-')       // replace spaces
}
</script>