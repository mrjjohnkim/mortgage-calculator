import { useState } from 'react'
import { AmortizationRow } from '@/lib/mortgage'
import { formatCurrencyFull, formatPercent } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'

const PAGE_SIZE = 24

interface Props {
  rows: AmortizationRow[]
}

function downloadCsv(rows: AmortizationRow[]) {
  const header = 'Month,Year,Payment,Principal,Interest,Balance,Rate (%),ARM Adjustment\n'
  const lines = rows.map(r =>
    [r.month, r.year, r.payment.toFixed(2), r.principal.toFixed(2),
     r.interest.toFixed(2), r.balance.toFixed(2), r.rate.toFixed(3),
     r.isArmAdjustment ? 'Yes' : ''].join(',')
  )
  const blob = new Blob([header + lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'amortization-schedule.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function AmortizationTable({ rows }: Props) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {rows.length} payments · Page {page + 1} of {totalPages}
        </p>
        <Button variant="outline" size="sm" onClick={() => downloadCsv(rows)}>
          <Download className="h-3.5 w-3.5 mr-1" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs">Mo</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">Payment</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">Principal</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">Interest</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">Balance</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">Rate</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={row.month}
                className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${
                  row.isArmAdjustment ? 'bg-amber-50' : ''
                }`}
              >
                <td className="px-3 py-2 text-muted-foreground">
                  <span className="font-medium text-foreground">{row.month}</span>
                  {row.isArmAdjustment && (
                    <Badge variant="warning" className="ml-2 text-[10px] px-1 py-0">ADJ</Badge>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrencyFull(row.payment)}</td>
                <td className="px-3 py-2 text-right text-green-700">{formatCurrencyFull(row.principal)}</td>
                <td className="px-3 py-2 text-right text-slate-500">{formatCurrencyFull(row.interest)}</td>
                <td className="px-3 py-2 text-right">{formatCurrencyFull(row.balance)}</td>
                <td className="px-3 py-2 text-right text-xs text-muted-foreground">{formatPercent(row.rate, 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-2 mt-3">
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const pageNum = totalPages <= 7 ? i : Math.max(0, Math.min(totalPages - 7, page - 3)) + i
          return (
            <Button
              key={pageNum}
              variant={pageNum === page ? 'default' : 'outline'}
              size="sm"
              className="w-8 h-8 p-0 text-xs"
              onClick={() => setPage(pageNum)}
            >
              {pageNum + 1}
            </Button>
          )
        })}
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
