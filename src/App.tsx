import { useState, useEffect, useMemo } from 'react'
import { MortgageInputs, buildAmortizationTable, calcSummary } from '@/lib/mortgage'
import { RateIndexInfo, fetchLiveRates, getFallbackRates } from '@/lib/fred'
import { LoanForm } from '@/components/LoanForm'
import { SummaryCards } from '@/components/SummaryCards'
import { AmortizationChart } from '@/components/AmortizationChart'
import { AmortizationTable } from '@/components/AmortizationTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Home } from 'lucide-react'

const DEFAULT_INPUTS: MortgageInputs = {
  loanType: 'fixed',
  loanAmount: 750000,
  termYears: 30,
  interestRate: 6.875,
  pointsPaid: 1,
  originationFee: 1500,
  armStructure: '5/1',
  rateIndex: 'SOFR',
  margin: 2.75,
  initialCapAdj: 2,
  periodicCap: 2,
  lifetimeCap: 5,
  adjustmentFrequencyMonths: 12,
  projectedIndexRate: 5.30,
}

// FRED API key — set in .env as VITE_FRED_API_KEY
const FRED_KEY = import.meta.env.VITE_FRED_API_KEY as string | undefined

export default function App() {
  const [inputs, setInputs] = useState<MortgageInputs>(DEFAULT_INPUTS)
  const [rateIndexes, setRateIndexes] = useState<RateIndexInfo[]>(getFallbackRates())
  const [ratesLoading, setRatesLoading] = useState(false)

  // Fetch live rates on mount if API key is provided
  useEffect(() => {
    if (!FRED_KEY) return
    setRatesLoading(true)
    fetchLiveRates(FRED_KEY)
      .then((rates) => {
        setRateIndexes(rates)
        // Seed the projected index rate with the current SOFR
        const sofr = rates.find(r => r.id === 'SOFR')
        if (sofr?.rate != null) {
          setInputs(prev => ({ ...prev, projectedIndexRate: sofr.rate! }))
        }
      })
      .finally(() => setRatesLoading(false))
  }, [])

  // Update projected index rate when user changes index selection
  useEffect(() => {
    const idx = rateIndexes.find(r => r.id === inputs.rateIndex)
    if (idx?.rate != null) {
      setInputs(prev => ({ ...prev, projectedIndexRate: idx.rate! }))
    }
  }, [inputs.rateIndex, rateIndexes])

  const rows = useMemo(() => buildAmortizationTable(inputs), [inputs])
  const summary = useMemo(() => calcSummary(inputs, rows), [inputs, rows])

  function handleChange(patch: Partial<MortgageInputs>) {
    setInputs(prev => ({ ...prev, ...patch }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground">
            <Home className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">Mortgage Calculator</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Fixed & Adjustable Rate · Live Index Rates · Amortization Schedule</p>
          </div>
          {!FRED_KEY && (
            <Badge variant="warning" className="ml-auto text-xs">
              Demo mode — add VITE_FRED_API_KEY for live rates
            </Badge>
          )}
        </div>
      </header>

      {/* Main layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">

        {/* Left: Input panel */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Loan Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <LoanForm
              inputs={inputs}
              onChange={handleChange}
              rateIndexes={rateIndexes}
              ratesLoading={ratesLoading}
            />
          </CardContent>
        </Card>

        {/* Right: Output panel */}
        <div className="space-y-5">
          {/* Summary KPI cards */}
          <SummaryCards summary={summary} inputs={inputs} />

          {/* Chart + Table tabs */}
          <Card>
            <CardContent className="pt-5">
              <Tabs defaultValue="chart">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold">Amortization Schedule</h2>
                  <TabsList>
                    <TabsTrigger value="chart">Chart</TabsTrigger>
                    <TabsTrigger value="table">Table</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="chart">
                  <AmortizationChart rows={rows} inputs={inputs} />
                  {inputs.loanType === 'arm' && (
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                      <span className="inline-block w-6 border-t-2 border-dashed border-amber-400" />
                      Yellow line marks start of ARM adjustments. Assumes index stays at your projected rate.
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="table">
                  <AmortizationTable rows={rows} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Loan details footer */}
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Loan Detail</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                {[
                  ['Loan Amount', `$${inputs.loanAmount.toLocaleString()}`],
                  ['Term', `${inputs.termYears} years`],
                  ['Type', inputs.loanType === 'fixed' ? 'Fixed Rate' : `${inputs.armStructure} ARM`],
                  ['Initial Rate', `${inputs.interestRate.toFixed(3)}%`],
                  ...(inputs.loanType === 'arm' ? [
                    ['Index', inputs.rateIndex],
                    ['Margin', `${inputs.margin.toFixed(3)}%`],
                    ['Caps', `${inputs.initialCapAdj}/${inputs.periodicCap}/${inputs.lifetimeCap}`],
                    ['Adj Freq', `${inputs.adjustmentFrequencyMonths} mo`],
                  ] : []),
                  ['Points', `${inputs.pointsPaid} pt${inputs.pointsPaid !== 1 ? 's' : ''}`],
                  ['Orig Fee', `$${inputs.originationFee.toLocaleString()}`],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium">{val}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
