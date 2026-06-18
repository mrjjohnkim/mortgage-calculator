import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { yearlyRollup, AmortizationRow, MortgageInputs } from '@/lib/mortgage'
import { formatCurrency } from '@/lib/utils'

interface Props {
  rows: AmortizationRow[]
  inputs: MortgageInputs
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-xs">
      <p className="font-semibold mb-1">Year {label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{formatCurrency(p.value)}</span>
        </div>
      ))}
      {payload[0] && (
        <p className="mt-1 text-muted-foreground">Balance: {formatCurrency(payload[0].payload.balance)}</p>
      )}
    </div>
  )
}

export function AmortizationChart({ rows, inputs }: Props) {
  const yearly = yearlyRollup(rows)
  const armFixedYears = inputs.loanType === 'arm' ? parseInt(inputs.armStructure.split('/')[0]) : null

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={yearly} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `Yr ${v}`}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => <span className="text-foreground">{value}</span>}
          />
          {armFixedYears && (
            <ReferenceLine
              x={armFixedYears}
              stroke="#f59e0b"
              strokeDasharray="4 2"
              label={{ value: 'ARM adjusts', position: 'top', fontSize: 10, fill: '#f59e0b' }}
            />
          )}
          <Bar dataKey="principal" name="Principal" stackId="a" fill="hsl(222.2 47.4% 11.2%)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="interest" name="Interest" stackId="a" fill="hsl(215.4 16.3% 65%)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
