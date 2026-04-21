import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Ref, ComputedRef } from 'vue'
import type { LoanDetail, RescheduleHistoryEntry } from '@/tenant/apis/loans/loansApi'

export function useLoanPdfExport(
  loan: Ref<LoanDetail | null>,
  latestReschedule: ComputedRef<RescheduleHistoryEntry | null>,
  oldStatusLabel: ComputedRef<string | null>,
  principalDisplay: ComputedRef<string>,
  netDisbursedDisplay: ComputedRef<string>,
  outstandingDisplay: ComputedRef<string>,
) {
  function fmtDate(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function fmt(v: number | string | null | undefined): string {
    if (v == null || v === '') return '—'
    const n = typeof v === 'string' ? parseFloat(v.replace(/[^0-9.-]/g, '')) : v
    if (!Number.isFinite(n)) return '—'
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function buildGeneralInfoRows(): Array<[string, string]> {
    if (!loan.value) return []
    const l = loan.value
    const cap = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const rows: Array<[string, string]> = []

    rows.push(['— Current Loan Details —', ''])
    rows.push(['Loan Number', l.loan_no])
    rows.push(['Status', l.status === 'active' ? 'Disbursed' : cap(l.status)])
    rows.push(['Loan Product', l.loan_product?.name ?? '—'])
    rows.push([
      l.is_rescheduled ? 'Current Principal' : 'Total Principal',
      l.is_rescheduled && latestReschedule.value
        ? fmt(latestReschedule.value.new_principal)
        : principalDisplay.value,
    ])
    rows.push(['Net Disbursed', netDisbursedDisplay.value])
    rows.push(['Outstanding Balance', outstandingDisplay.value])
    rows.push([
      l.is_rescheduled ? 'Current Interest Rate' : 'Interest Rate',
      l.is_rescheduled && latestReschedule.value
        ? `${latestReschedule.value.new_rate}%`
        : `${l.interest_rate}%`,
    ])
    if (l.loan_product?.interest_method) {
      rows.push(['Interest Method', cap(l.loan_product.interest_method)])
    }
    rows.push([
      l.is_rescheduled ? 'Current Term' : 'Term',
      `${l.is_rescheduled && latestReschedule.value ? latestReschedule.value.new_duration : l.term_months} months`,
    ])
    rows.push([
      'Grace Period',
      (l.loan_product?.grace_period ?? 0) > 0
        ? `${l.loan_product?.grace_period} days`
        : 'None',
    ])
    if (l.approved_at) rows.push(['Approval Date', fmtDate(l.approved_at)])
    rows.push(['Date Disbursed', l.disbursed_at ? fmtDate(l.disbursed_at) : '—'])
    if (l.is_rescheduled && latestReschedule.value) {
      rows.push([
        'Rescheduled On',
        latestReschedule.value.reschedule_date
          ? fmtDate(latestReschedule.value.reschedule_date)
          : '—',
      ])
      rows.push([
        'Reschedule Type',
        latestReschedule.value.reschedule_type
          ? cap(latestReschedule.value.reschedule_type)
          : '—',
      ])
    }
    rows.push(['Disbursement Method', l.disbursement_method ? cap(l.disbursement_method) : '—'])
    if (l.disbursement_reference) rows.push(['Reference', l.disbursement_reference])

    rows.push(['— People Information —', ''])
    if (l.member) rows.push(['Member Name', l.member.name])
    if (l.member?.member_number) rows.push(['Member No.', l.member.member_number])
    if (l.disbursed_by_staff) rows.push(['Disbursing Officer', l.disbursed_by_staff.name])
    if (l.loan_officer) rows.push(['Loan Officer', l.loan_officer.name])

    if (l.is_rescheduled) {
      rows.push(['— Original Loan Details (Before Rescheduling) —', ''])
      rows.push(['Loan Number', l.loan_no])
      rows.push(['Initial Status', oldStatusLabel.value ?? '—'])
      rows.push(['Original Principal', principalDisplay.value])
      rows.push(['Original Term', `${l.original_term_months || l.term_months} months`])
      rows.push(['Original Rate', `${l.original_interest_rate || l.interest_rate}%`])
      if (l.loan_product?.interest_method) {
        rows.push(['Interest Method', cap(l.loan_product.interest_method)])
      }
      rows.push([
        'Grace Period',
        (l.loan_product?.grace_period ?? 0) > 0
          ? `${l.loan_product?.grace_period} days`
          : 'None',
      ])
      rows.push(['Net Cash Disbursed', netDisbursedDisplay.value])
      if (l.approved_at) rows.push(['Approved Date', fmtDate(l.approved_at)])
      rows.push(['Disbursed Date', l.disbursed_at ? fmtDate(l.disbursed_at) : '—'])
    }

    return rows
  }

  function printGeneralInfo() {
    if (!loan.value) return
    const rows = buildGeneralInfoRows()
      .map(([label, value]) =>
        label.startsWith('—')
          ? `<tr class="section-header"><td colspan="2">${label.replace(/^— | —$/g, '')}</td></tr>`
          : `<tr><td>${label}</td><td>${value}</td></tr>`,
      )
      .join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Loan General Information – ${loan.value.loan_no}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 24px; }
  h2 { font-size: 16px; margin-bottom: 2px; }
  .sub { font-size: 11px; color: #666; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; max-width: 600px; }
  tr { border-bottom: 1px solid #eee; }
  td { padding: 6px 10px; }
  td:first-child { color: #555; font-size: 11px; width: 45%; }
  td:last-child { font-weight: 600; }
  tr.section-header td { background: #f0f0f0; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #444; padding: 8px 10px; border-bottom: 2px solid #ddd; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<h2>Loan General Information</h2>
<div class="sub">${loan.value.loan_no} · ${loan.value.member?.name ?? ''}</div>
<table><tbody>${rows}</tbody></table>
</body>
</html>`

    const win = window.open('', '_blank', 'width=700,height=600')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  function exportGeneralInfoPdf() {
    if (!loan.value) return
    const l = loan.value
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Loan General Information', 14, 18)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text(`${l.loan_no}  ·  ${l.member?.name ?? ''}`, 14, 25)
    doc.setTextColor(0)

    const rows = buildGeneralInfoRows()
    const body: Array<any[]> = []
    const sectionIndexes: number[] = []

    rows.forEach(([label, value]) => {
      if (label.startsWith('—')) {
        sectionIndexes.push(body.length)
        body.push([label.replace(/^— | —$/g, ''), ''])
      } else {
        body.push([label, value])
      }
    })

    autoTable(doc, {
      startY: 30,
      head: [['Field', 'Value']],
      body,
      headStyles: { fillColor: [30, 100, 60], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 65, textColor: [80, 80, 80] },
        1: { fontStyle: 'bold' },
      },
      didParseCell(data) {
        if (data.section === 'body' && sectionIndexes.includes(data.row.index)) {
          data.cell.styles.fillColor = [240, 240, 240]
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.textColor = [60, 60, 60]
          data.cell.styles.fontSize = 7.5
        }
      },
      alternateRowStyles: { fillColor: [248, 250, 248] },
    })

    doc.save(`loan-info-${l.loan_no}.pdf`)
  }

  return {
    buildGeneralInfoRows,
    printGeneralInfo,
    exportGeneralInfoPdf,
  }
}
