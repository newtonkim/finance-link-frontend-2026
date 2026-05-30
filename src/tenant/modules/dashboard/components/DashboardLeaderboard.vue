<script setup lang="ts">
import { formatMoneyValue } from '@/Global'
import { useCurrencyStore } from '@/stores/currency'

interface LeaderMember {
  id: number
  name: string
  member_number: string
  total_balance?: number
  deposit_count?: number
  total_deposited?: number
  total_borrowed?: number
  loan_count?: number
}

const props = defineProps<{
  title: string
  byValue: LeaderMember[]
  byFrequency: LeaderMember[]
  valueKey: keyof LeaderMember
  freqKey: keyof LeaderMember
  valueLabel: string
  freqLabel: string
  emptyText: string
  barColor?: string
}>()

const currencyStore = useCurrencyStore()

function formatMoney(value: number | string | null | undefined) {
  return `${currencyStore.currencyCode} ${formatMoneyValue(value ?? 0)}`
}

function computeOverall(
  byValue: LeaderMember[],
  byFreq: LeaderMember[],
  valueKey: keyof LeaderMember,
  freqKey: keyof LeaderMember,
) {
  const allIds = [...new Set([...byValue.map((m) => m.id), ...byFreq.map((m) => m.id)])]
  const maxValue = Math.max(...byValue.map((m) => Number(m[valueKey]) || 0)) || 1
  const maxFreq = Math.max(...byFreq.map((m) => Number(m[freqKey]) || 0)) || 1

  return allIds
    .map((id) => {
      const vEntry = byValue.find((m) => m.id === id)
      const fEntry = byFreq.find((m) => m.id === id)
      const member = vEntry ?? fEntry!
      const vScore = vEntry ? (Number(vEntry[valueKey]) / maxValue) * 100 : 0
      const fScore = fEntry ? (Number(fEntry[freqKey]) / maxFreq) * 100 : 0
      return {
        id,
        name: member.name,
        member_number: member.member_number,
        score: Math.round((vScore + fScore) / 2),
        valueLabel: vEntry ? formatMoneyValue(vEntry[valueKey] ?? 0) : '—',
        freqLabel: fEntry ? String(fEntry[freqKey]) : '—',
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

import { ref, computed } from 'vue'

type Tab = 'value' | 'frequency'
const activeTab = ref<Tab>('value')

const overallBest = computed(() =>
  computeOverall(props.byValue, props.byFrequency, props.valueKey, props.freqKey),
)
const topMember = computed(() => overallBest.value[0] ?? null)

const maxValue = computed(() => Number(props.byValue[0]?.[props.valueKey] ?? 1) || 1)

const color = computed(() => props.barColor || '#39B588')
</script>

<template>
  <div
    class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900"
  >
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-base font-semibold text-neutral-900 dark:text-white">{{ title }}</h3>
      <div
        class="flex rounded-lg border border-neutral-200 bg-neutral-50 p-[3px] dark:border-neutral-700 dark:bg-neutral-800"
      >
        <button
          v-for="tab in [
            { key: 'value' as const, label: 'By Value' },
            { key: 'frequency' as const, label: 'By Frequency' },
          ]"
          :key="tab.key"
          class="rounded-md px-2.5 py-1 text-[11px] font-medium transition-all"
          :class="
            activeTab === tab.key
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
              : 'text-neutral-400 hover:text-neutral-600'
          "
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <template v-if="activeTab === 'value'">
      <div v-if="!byValue.length" class="py-8 text-center text-xs text-neutral-400">
        {{ emptyText }}
      </div>
      <div v-else class="space-y-3">
        <div v-for="(member, idx) in byValue" :key="member.id" class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                :style="{
                  backgroundColor: idx === 0 ? '#0050D8' : idx === 1 ? '#739387' : '#A8C2B8',
                }"
              >
                {{ idx + 1 }}
              </span>
              <div>
                <p class="text-[13px] font-semibold text-neutral-900 dark:text-white leading-tight">
                  {{ member.name }}
                </p>
                <p class="text-[11px] text-neutral-400">
                  {{ member.member_number
                  }}<template v-if="member.loan_count !== undefined">
                    · {{ member.loan_count }} loan{{ member.loan_count === 1 ? '' : 's' }}</template
                  >
                </p>
              </div>
            </div>
            <span class="text-[13px] font-bold text-neutral-900 dark:text-white">
              {{ formatMoney(member[valueKey]) }}
            </span>
          </div>
          <div class="h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{
                backgroundColor: color,
                width: (Number(member[valueKey]) / maxValue) * 100 + '%',
              }"
            />
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div v-if="!byFrequency.length" class="py-8 text-center text-xs text-neutral-400">
        {{ emptyText }}
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="(member, idx) in byFrequency"
          :key="member.id"
          class="flex items-center gap-2.5"
        >
          <span
            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            :style="{ backgroundColor: idx === 0 ? '#0050D8' : idx === 1 ? '#739387' : '#A8C2B8' }"
          >
            {{ idx + 1 }}
          </span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <p class="truncate text-[13px] font-semibold text-neutral-900 dark:text-white">
                {{ member.name }}
              </p>
              <span
                class="ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                style="background-color: #0050D8"
              >
                {{ member[freqKey] }}x
              </span>
            </div>
            <p class="text-[11px] text-neutral-400">
              {{ formatMoney(member[valueKey]) }} {{ valueLabel }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <div
      v-if="topMember"
      class="mt-5 rounded-xl p-3"
      style="background-color: rgba(10, 35, 24, 0.05)"
    >
      <p class="mb-2 text-[10px] font-bold uppercase tracking-wider" style="color: #0050D8">
        Overall Best
      </p>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
            style="background-color: #0050D8"
            >1</span
          >
          <div>
            <p class="text-[13px] font-bold text-neutral-900 dark:text-white">
              {{ topMember.name }}
            </p>
            <p class="text-[11px] text-neutral-400">{{ topMember.member_number }}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-[11px] text-neutral-400">
            {{ valueLabel }} · {{ currencyStore.currencyCode }} {{ topMember.valueLabel }}
          </p>
          <p class="text-[11px] text-neutral-400">{{ freqLabel }} · {{ topMember.freqLabel }}x</p>
        </div>
      </div>
      <div class="mt-2.5 flex items-center gap-2">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          <div class="h-full rounded-full" :style="{ backgroundColor: color, width: '100%' }" />
        </div>
        <span class="text-[11px] font-bold" style="color: #0050D8">{{ topMember.score }}%</span>
      </div>
    </div>
  </div>
</template>
