import { MortgageInputs, ArmStructure, RateIndex } from '@/lib/mortgage'
import { RateIndexInfo } from '@/lib/fred'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Info, Wifi, WifiOff } from 'lucide-react'

interface Props {
  inputs: MortgageInputs
  onChange: (patch: Partial<MortgageInputs>) => void
  rateIndexes: RateIndexInfo[]
  ratesLoading: boolean
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs font-semibold">{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">— {hint}</span>}
      </div>
      {children}
    </div>
  )
}

const TERM_OPTIONS = [10, 15, 20, 25, 30]
const ARM_STRUCTURES: ArmStructure[] = ['3/1', '5/1', '7/1', '10/1']
const ADJ_FREQ_OPTIONS = [{ label: 'Every 6 months', value: 6 }, { label: 'Every 12 months', value: 12 }]
const CAP_OPTIONS = [1, 2, 3, 5, 6]

export function LoanForm({ inputs, onChange, rateIndexes, ratesLoading }: Props) {
  const selectedIndex = rateIndexes.find(r => r.id === inputs.rateIndex)

  return (
    <div className="space-y-5">
      <Tabs value={inputs.loanType} onValueChange={(v) => onChange({ loanType: v as 'fixed' | 'arm' })}>
        <TabsList className="w-full">
          <TabsTrigger value="fixed" className="flex-1">Fixed Rate</TabsTrigger>
          <TabsTrigger value="arm" className="flex-1">Adjustable Rate (ARM)</TabsTrigger>
        </TabsList>

        {/* ── Shared fields ── */}
        <div className="mt-5 space-y-4">
          <FieldRow label="Loan Amount">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                min={50000}
                max={10000000}
                step={5000}
                value={inputs.loanAmount}
                onChange={(e) => onChange({ loanAmount: Number(e.target.value) })}
              />
            </div>
            <Slider
              min={100000}
              max={2000000}
              step={10000}
              value={[inputs.loanAmount]}
              onValueChange={([v]) => onChange({ loanAmount: v })}
              className="mt-2"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>$100k</span><span>$2M</span>
            </div>
          </FieldRow>

          <FieldRow label="Loan Term">
            <Select value={String(inputs.termYears)} onValueChange={(v) => onChange({ termYears: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TERM_OPTIONS.map(y => (
                  <SelectItem key={y} value={String(y)}>{y} years</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow label="Interest Rate" hint={inputs.loanType === 'arm' ? 'initial fixed-period rate' : ''}>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0.5}
                max={20}
                step={0.125}
                value={inputs.interestRate}
                onChange={(e) => onChange({ interestRate: Number(e.target.value) })}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <Slider
              min={2}
              max={12}
              step={0.125}
              value={[inputs.interestRate]}
              onValueChange={([v]) => onChange({ interestRate: v })}
              className="mt-2"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>2%</span><span>12%</span>
            </div>
          </FieldRow>

          <FieldRow label="Points Paid" hint="1 pt = 1% of loan, lowers your rate ~0.25% per point">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={5}
                step={0.25}
                value={inputs.pointsPaid}
                onChange={(e) => onChange({ pointsPaid: Number(e.target.value) })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                pts = ${((inputs.pointsPaid / 100) * inputs.loanAmount).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </FieldRow>

          <FieldRow label="Origination Fee">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                min={0}
                max={20000}
                step={100}
                value={inputs.originationFee}
                onChange={(e) => onChange({ originationFee: Number(e.target.value) })}
              />
            </div>
          </FieldRow>
        </div>

        {/* ── ARM-specific ── */}
        <TabsContent value="arm" className="space-y-4 mt-4">
          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ARM Settings</p>

          <FieldRow label="ARM Structure" hint="fixed period / adjustment interval (years)">
            <Select value={inputs.armStructure} onValueChange={(v) => onChange({ armStructure: v as ArmStructure })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ARM_STRUCTURES.map(s => (
                  <SelectItem key={s} value={s}>{s} ARM — fixed for {s.split('/')[0]} yrs</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow label="Rate Index">
            <Select value={inputs.rateIndex} onValueChange={(v) => onChange({ rateIndex: v as RateIndex })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {rateIndexes.map(idx => (
                  <SelectItem key={idx.id} value={idx.id}>
                    {idx.label} — {idx.rate != null ? `${idx.rate.toFixed(2)}%` : '…'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedIndex && (
              <div className="mt-2 rounded-md bg-muted p-2.5 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{selectedIndex.fullName}</span>
                  {ratesLoading
                    ? <Badge variant="secondary" className="text-[10px]"><WifiOff className="h-2.5 w-2.5 mr-1" />Loading…</Badge>
                    : <Badge variant="success" className="text-[10px]"><Wifi className="h-2.5 w-2.5 mr-1" />Live</Badge>
                  }
                </div>
                <p className="text-muted-foreground leading-relaxed">{selectedIndex.description}</p>
                {selectedIndex.asOf && selectedIndex.asOf !== 'cached' && (
                  <p className="text-muted-foreground">As of {selectedIndex.asOf}</p>
                )}
              </div>
            )}
          </FieldRow>

          <FieldRow label="Margin" hint="spread added to index to set your rate">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0.5}
                max={6}
                step={0.125}
                value={inputs.margin}
                onChange={(e) => onChange({ margin: Number(e.target.value) })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                % → fully-indexed: {selectedIndex?.rate != null ? (selectedIndex.rate + inputs.margin).toFixed(3) : '?'}%
              </span>
            </div>
          </FieldRow>

          <FieldRow label="Future Index Assumption" hint="what rate you expect the index to be at after fixed period">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={15}
                step={0.25}
                value={inputs.projectedIndexRate}
                onChange={(e) => onChange({ projectedIndexRate: Number(e.target.value) })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                % → projected ARM rate: {(inputs.projectedIndexRate + inputs.margin).toFixed(3)}%
              </span>
            </div>
          </FieldRow>

          <FieldRow label="Adjustment Caps" hint="initial / periodic / lifetime">
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'initialCapAdj', label: 'Initial' },
                { key: 'periodicCap', label: 'Periodic' },
                { key: 'lifetimeCap', label: 'Lifetime' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                  <Select
                    value={String(inputs[key as keyof MortgageInputs])}
                    onValueChange={(v) => onChange({ [key]: Number(v) } as Partial<MortgageInputs>)}
                  >
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CAP_OPTIONS.map(c => (
                        <SelectItem key={c} value={String(c)}>{c}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Common: 2/2/5 (first adj / per adj / over lifetime)
            </p>
          </FieldRow>

          <FieldRow label="Adjustment Frequency">
            <Select
              value={String(inputs.adjustmentFrequencyMonths)}
              onValueChange={(v) => onChange({ adjustmentFrequencyMonths: Number(v) })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ADJ_FREQ_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        </TabsContent>
      </Tabs>
    </div>
  )
}
