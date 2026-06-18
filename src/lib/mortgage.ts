export type LoanType = 'fixed' | 'arm'

export type ArmStructure = '3/1' | '5/1' | '7/1' | '10/1'

export type RateIndex = 'SOFR' | 'PRIME' | 'CMT1' | 'COFI'

export interface MortgageInputs {
  loanType: LoanType
  loanAmount: number
  termYears: number
  interestRate: number        // annual % for fixed; initial rate for ARM
  pointsPaid: number          // e.g. 1.0 = 1 point = 1% of loan
  originationFee: number      // flat dollar fee
  // ARM-only
  armStructure: ArmStructure
  rateIndex: RateIndex
  margin: number              // margin over index
  initialCapAdj: number       // first adjustment cap (e.g. 2)
  periodicCap: number         // per-adjustment cap (e.g. 2)
  lifetimeCap: number         // lifetime cap over initial rate (e.g. 5)
  adjustmentFrequencyMonths: number  // 6 or 12
  projectedIndexRate: number  // user's assumption for future index after fixed period
}

export interface AmortizationRow {
  month: number
  year: number
  payment: number
  principal: number
  interest: number
  balance: number
  rate: number        // annual rate in effect this month
  isArmAdjustment: boolean
}

export interface MortgageSummary {
  monthlyPayment: number        // first payment (initial period)
  totalPayments: number
  totalInterest: number
  totalCost: number             // principal + interest + points cost
  pointsCost: number
  effectiveRate: number         // APR approximation
  breakEvenMonths: number | null // break-even for points vs no points
}

function monthlyRate(annualPct: number): number {
  return annualPct / 100 / 12
}

function calcPayment(principal: number, annualPct: number, remainingMonths: number): number {
  const r = monthlyRate(annualPct)
  if (r === 0) return principal / remainingMonths
  return (principal * r * Math.pow(1 + r, remainingMonths)) / (Math.pow(1 + r, remainingMonths) - 1)
}

export function buildAmortizationTable(inputs: MortgageInputs): AmortizationRow[] {
  const totalMonths = inputs.termYears * 12
  const rows: AmortizationRow[] = []

  const fixedPeriodMonths = inputs.loanType === 'fixed'
    ? totalMonths
    : parseInt(inputs.armStructure.split('/')[0]) * 12

  let balance = inputs.loanAmount
  let currentRate = inputs.interestRate
  let payment = calcPayment(balance, currentRate, totalMonths)

  const initialRate = inputs.interestRate

  for (let m = 1; m <= totalMonths; m++) {
    const isArmAdjustment = inputs.loanType === 'arm' && m > fixedPeriodMonths &&
      (m - fixedPeriodMonths) % inputs.adjustmentFrequencyMonths === 1 &&
      m !== fixedPeriodMonths + 1

    // First ARM adjustment (month after fixed period ends)
    const isFirstArmAdj = inputs.loanType === 'arm' && m === fixedPeriodMonths + 1

    if (isFirstArmAdj || isArmAdjustment) {
      const uncappedRate = inputs.projectedIndexRate + inputs.margin
      let newRate: number

      if (isFirstArmAdj) {
        const maxIncrease = inputs.initialCapAdj
        const maxDecrease = inputs.initialCapAdj
        newRate = Math.min(currentRate + maxIncrease, Math.max(currentRate - maxDecrease, uncappedRate))
      } else {
        newRate = Math.min(currentRate + inputs.periodicCap, Math.max(currentRate - inputs.periodicCap, uncappedRate))
      }

      // Apply lifetime cap
      newRate = Math.min(newRate, initialRate + inputs.lifetimeCap)
      newRate = Math.max(newRate, initialRate - inputs.lifetimeCap) // floor

      currentRate = newRate
      payment = calcPayment(balance, currentRate, totalMonths - m + 1)
    }

    // Recalculate payment at start of fixed period too (first month)
    if (m === 1) {
      payment = calcPayment(balance, currentRate, totalMonths)
    }

    const interestCharge = balance * monthlyRate(currentRate)
    const principalCharge = Math.min(payment - interestCharge, balance)
    balance = Math.max(balance - principalCharge, 0)

    rows.push({
      month: m,
      year: Math.ceil(m / 12),
      payment: payment,
      principal: principalCharge,
      interest: interestCharge,
      balance,
      rate: currentRate,
      isArmAdjustment: isFirstArmAdj || isArmAdjustment,
    })

    if (balance <= 0.01) break
  }

  return rows
}

export function calcSummary(inputs: MortgageInputs, rows: AmortizationRow[]): MortgageSummary {
  const totalPayments = rows.reduce((s, r) => s + r.payment, 0)
  const totalInterest = rows.reduce((s, r) => s + r.interest, 0)
  const pointsCost = (inputs.pointsPaid / 100) * inputs.loanAmount
  const totalCost = totalPayments + pointsCost + inputs.originationFee

  const effectiveRate = inputs.interestRate
  const totalMonths = inputs.termYears * 12

  // Break-even on points: monthly savings vs no-points rate
  // A point typically buys ~0.25% rate reduction
  const rateReductionPerPoint = 0.25
  const rateWithoutPoints = inputs.interestRate + inputs.pointsPaid * rateReductionPerPoint
  const paymentWithoutPoints = calcPayment(inputs.loanAmount, rateWithoutPoints, totalMonths)
  const monthlySavings = paymentWithoutPoints - rows[0]?.payment
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(pointsCost / monthlySavings) : null

  return {
    monthlyPayment: rows[0]?.payment ?? 0,
    totalPayments,
    totalInterest,
    totalCost,
    pointsCost,
    effectiveRate,
    breakEvenMonths,
  }
}

export function yearlyRollup(rows: AmortizationRow[]): Array<{
  year: number
  principal: number
  interest: number
  balance: number
}> {
  const years: Record<number, { principal: number; interest: number; balance: number }> = {}
  for (const row of rows) {
    if (!years[row.year]) years[row.year] = { principal: 0, interest: 0, balance: 0 }
    years[row.year].principal += row.principal
    years[row.year].interest += row.interest
    years[row.year].balance = row.balance
  }
  return Object.entries(years).map(([y, v]) => ({ year: Number(y), ...v }))
}
