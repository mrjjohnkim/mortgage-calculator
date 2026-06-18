import { MortgageSummary, MortgageInputs } from '@/lib/mortgage'
import { formatCurrency, formatCurrencyFull, formatPercent } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, DollarSign, Calendar, Percent } from 'lucide-react'

interface Props {
  summary: MortgageSummary
  inputs: MortgageInputs
}

export function SummaryCards({ summary, inputs }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly Payment</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(summary.monthlyPayment)}</p>
              <p className="text-xs text-muted-foreground mt-1">principal + interest</p>
            </div>
            <DollarSign className="h-4 w-4 text-muted-foreground mt-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Interest</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(summary.totalInterest)}</p>
              <p className="text-xs text-muted-foreground mt-1">over {inputs.termYears} years</p>
            </div>
            <Percent className="h-4 w-4 text-muted-foreground mt-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Cost</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(summary.totalCost)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                incl. {formatCurrency(summary.pointsCost)} in points
              </p>
            </div>
            <TrendingDown className="h-4 w-4 text-muted-foreground mt-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Points Break-Even</p>
              {summary.breakEvenMonths != null && inputs.pointsPaid > 0 ? (
                <>
                  <p className="mt-1 text-2xl font-bold">{summary.breakEvenMonths} mo</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(summary.breakEvenMonths / 12).toFixed(1)} years
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-2xl font-bold">—</p>
                  <p className="text-xs text-muted-foreground mt-1">no points paid</p>
                </>
              )}
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
