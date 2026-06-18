// FRED (Federal Reserve Economic Data) API client
// Free API key from https://fred.stlouisfed.org/docs/api/api_key.html
// Key is optional for some series but recommended for production use.

export interface RateIndexInfo {
  id: string
  label: string
  fullName: string
  seriesId: string        // FRED series ID
  description: string
  rate: number | null     // fetched live; null while loading
  asOf: string | null
}

export const RATE_INDEXES: RateIndexInfo[] = [
  {
    id: 'SOFR',
    label: 'SOFR',
    fullName: 'Secured Overnight Financing Rate',
    seriesId: 'SOFR',
    description: 'The primary benchmark for new ARMs since LIBOR retirement (2023). Published daily by the NY Fed.',
    rate: null,
    asOf: null,
  },
  {
    id: 'PRIME',
    label: 'Prime Rate',
    fullName: 'WSJ Bank Prime Loan Rate',
    seriesId: 'DPRIME',
    description: 'Used for HELOCs and some older ARM programs. Moves with Fed Funds Rate.',
    rate: null,
    asOf: null,
  },
  {
    id: 'CMT1',
    label: '1-Yr CMT',
    fullName: '1-Year Constant Maturity Treasury',
    seriesId: 'DGS1',
    description: 'Treasury-indexed ARMs common before 2023. Closely tracks Fed policy.',
    rate: null,
    asOf: null,
  },
  {
    id: 'FEDFUNDS',
    label: 'Fed Funds',
    fullName: 'Effective Federal Funds Rate',
    seriesId: 'DFF',
    description: 'The overnight rate banks charge each other. Strongly influences all ARM indexes and the prime rate.',
    rate: null,
    asOf: null,
  },
]

const FALLBACK_RATES: Record<string, number> = {
  SOFR: 5.30,
  PRIME: 8.50,
  CMT1: 4.75,
  FEDFUNDS: 5.33,
}

async function fetchSeriesLatest(seriesId: string, apiKey: string): Promise<{ rate: number; date: string } | null> {
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=5`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json() as { observations: Array<{ date: string; value: string }> }
    const obs = data.observations?.find(o => o.value !== '.')
    if (!obs) return null
    return { rate: parseFloat(obs.value), date: obs.date }
  } catch {
    return null
  }
}

export async function fetchLiveRates(apiKey: string): Promise<RateIndexInfo[]> {
  const results = await Promise.allSettled(
    RATE_INDEXES.map(async (idx) => {
      const result = await fetchSeriesLatest(idx.seriesId, apiKey)
      return {
        ...idx,
        rate: result?.rate ?? FALLBACK_RATES[idx.id] ?? null,
        asOf: result?.date ?? 'cached',
      }
    })
  )

  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { ...RATE_INDEXES[i], rate: FALLBACK_RATES[RATE_INDEXES[i].id] ?? null, asOf: 'cached' }
  )
}

export function getFallbackRates(): RateIndexInfo[] {
  return RATE_INDEXES.map(idx => ({
    ...idx,
    rate: FALLBACK_RATES[idx.id] ?? null,
    asOf: 'cached',
  }))
}
