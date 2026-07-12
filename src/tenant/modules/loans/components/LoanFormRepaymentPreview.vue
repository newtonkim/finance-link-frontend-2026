<script setup lang="ts">
import { Calculator, Printer, FileDown } from 'lucide-vue-next'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const props = defineProps<{
    schedulePreview: {
        installment_amount: number
        total_interest: number
        total_repayment: number
        schedule_preview: { period: number; principal: number; interest: number; installment: number; balance: number }[]
    } | null
    previewLoading: boolean
}>()

const { formatAmount } = useLoanApplicationHelpers()

function printSchedule() {
    if (!props.schedulePreview) return
    const rows = props.schedulePreview.schedule_preview
        .map(
            (r) =>
                `<tr>
                    <td>${r.period}</td>
                    <td>${formatAmount(r.principal)}</td>
                    <td>${formatAmount(r.interest)}</td>
                    <td><strong>${formatAmount(r.installment)}</strong></td>
                    <td>${formatAmount(r.balance)}</td>
                </tr>`,
        )
        .join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Repayment Schedule Preview</title>
<style>
  body { font-family: "Inter Variable", Inter, Arial, sans-serif; font-size: 12px; color: #111; margin: 24px; }
  h2 { font-size: 16px; margin-bottom: 4px; }
  .summary { display: flex; gap: 32px; margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 6px; }
  .summary div { text-align: center; }
  .summary .label { font-size: 11px; color: #666; }
  .summary .value { font-size: 14px; font-weight: bold; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #f0f0f0; }
  th { padding: 6px 10px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #555; border-bottom: 2px solid #ddd; }
  th:first-child { text-align: left; }
  td { padding: 5px 10px; text-align: right; border-bottom: 1px solid #eee; }
  td:first-child { text-align: left; color: #666; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<h2>Repayment Schedule Preview</h2>
<div class="summary">
  <div><div class="label">Installment</div><div class="value">${formatAmount(props.schedulePreview.installment_amount)}</div></div>
  <div><div class="label">Total Interest</div><div class="value">${formatAmount(props.schedulePreview.total_interest)}</div></div>
  <div><div class="label">Total Repayment</div><div class="value">${formatAmount(props.schedulePreview.total_repayment)}</div></div>
</div>
<table>
  <thead><tr><th>#</th><th>Principal</th><th>Interest</th><th>Installment</th><th>Balance</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</body>
</html>`

    const win = window.open('', '_blank', 'width=800,height=600')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
}

function exportPdf() {
    if (!props.schedulePreview) return
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Repayment Schedule Preview', 14, 18)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text(`Installment: ${formatAmount(props.schedulePreview.installment_amount)}`, 14, 26)
    doc.text(`Total Interest: ${formatAmount(props.schedulePreview.total_interest)}`, 80, 26)
    doc.text(`Total Repayment: ${formatAmount(props.schedulePreview.total_repayment)}`, 146, 26)
    doc.setTextColor(0)

    autoTable(doc, {
        startY: 32,
        head: [['#', 'Principal', 'Interest', 'Installment', 'Balance']],
        body: props.schedulePreview.schedule_preview.map((r) => [
            r.period,
            formatAmount(r.principal),
            formatAmount(r.interest),
            formatAmount(r.installment),
            formatAmount(r.balance),
        ]),
        headStyles: { fillColor: [30, 100, 60], textColor: 255, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
            0: { halign: 'left', cellWidth: 12 },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right', fontStyle: 'bold' },
            4: { halign: 'right' },
        },
        alternateRowStyles: { fillColor: [245, 248, 246] },
    })

    doc.save('repayment-schedule.pdf')
}
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="mb-4 flex items-center gap-2">
            <Calculator class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Repayment Preview</h3>
            <div v-if="schedulePreview && !previewLoading" class="ml-auto flex items-center gap-1.5">
                <button
                    type="button"
                    title="Print schedule"
                    class="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    @click="printSchedule"
                >
                    <Printer class="h-3.5 w-3.5" />
                    Print
                </button>
                <button
                    type="button"
                    title="Export as PDF"
                    class="flex items-center gap-1.5 rounded-lg bg-nfuko-primary px-2.5 py-1.5 text-xs font-medium text-white hover:bg-nfuko-primary/90 transition-colors"
                    @click="exportPdf"
                >
                    <FileDown class="h-3.5 w-3.5" />
                    PDF
                </button>
            </div>
        </div>
        <div v-if="previewLoading" class="space-y-2">
            <div v-for="n in 4" :key="n" class="h-4 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        </div>
        <div v-else-if="schedulePreview">
            <div class="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                <div class="text-center">
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">Installment</p>
                    <p class="mt-0.5 text-sm font-bold text-neutral-900 dark:text-white">{{ formatAmount(schedulePreview.installment_amount) }}</p>
                </div>
                <div class="text-center">
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">Total Interest</p>
                    <p class="mt-0.5 text-sm font-bold text-neutral-900 dark:text-white">{{ formatAmount(schedulePreview.total_interest) }}</p>
                </div>
                <div class="text-center">
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">Total Repay</p>
                    <p class="mt-0.5 text-sm font-bold text-nfuko-primary dark:text-bg-nfuko-yellow">{{ formatAmount(schedulePreview.total_repayment) }}</p>
                </div>
            </div>
            <div v-if="schedulePreview.schedule_preview.length" class="max-h-64 overflow-y-auto">
                <table class="w-full text-xs">
                    <thead class="sticky top-0 bg-white dark:bg-neutral-900">
                        <tr class="border-b border-neutral-100 text-left font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
                            <th class="py-1.5 pr-3">#</th>
                            <th class="py-1.5 pr-3 text-right">Principal</th>
                            <th class="py-1.5 pr-3 text-right">Interest</th>
                            <th class="py-1.5 pr-3 text-right">Installment</th>
                            <th class="py-1.5 text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
                        <tr v-for="row in schedulePreview.schedule_preview" :key="row.period">
                            <td class="py-1.5 pr-3 text-neutral-500">{{ row.period }}</td>
                            <td class="py-1.5 pr-3 text-right text-neutral-700 dark:text-neutral-300">{{ formatAmount(row.principal) }}</td>
                            <td class="py-1.5 pr-3 text-right text-neutral-700 dark:text-neutral-300">{{ formatAmount(row.interest) }}</td>
                            <td class="py-1.5 pr-3 text-right font-medium text-neutral-900 dark:text-white">{{ formatAmount(row.installment) }}</td>
                            <td class="py-1.5 text-right text-neutral-500">{{ formatAmount(row.balance) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-8 text-center">
            <Calculator class="mb-2 h-6 w-6 text-neutral-300 dark:text-neutral-600" />
            <p class="text-xs text-neutral-400 dark:text-neutral-500">Enter an amount and term to see the repayment preview.</p>
        </div>
    </div>
</template>
