/**
 * Parsea cualquier formato de fecha que puede venir de Supabase:
 * - '2026-02-26T14:30:00+00:00' (timestamptz con zona)
 * - '2026-02-26T14:30:00' (sin zona → se trata como hora local)
 * - '2026-02-26 14:30:00' (formato postgres sin T)
 * - number (unix ms)
 * - Date
 */
export const parseBackendDate = (value: unknown): Date | null => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value !== 'string') return null

  const raw = value.trim()
  if (!raw) return null

  // Sin zona horaria → construir como hora local para evitar desfase de -3hs
  const localMatch = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  )
  if (localMatch) {
    const [, y, m, day, hh = '00', mm = '00', ss = '00'] = localMatch
    const d = new Date(Number(y), Number(m) - 1, Number(day), Number(hh), Number(mm), Number(ss))
    return Number.isNaN(d.getTime()) ? null : d
  }

  // Con zona horaria → dejar que el motor lo convierta a local
  const normalized = raw
    .replace(' ', 'T')
    .replace(/([+-]\d{2})(\d{2})$/, '$1:$2')

  const d = new Date(normalized)
  return Number.isNaN(d.getTime()) ? null : d
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Formato DD/MM/AAAA */
export const formatFecha = (value: unknown): string => {
  const d = parseBackendDate(value)
  if (!d) return '—'
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

/** Formato DD/MM/AAAA HH:MM */
export const formatFechaHora = (value: unknown): string => {
  const d = parseBackendDate(value)
  if (!d) return '—'
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Convierte fecha de backend al formato que espera un input type="datetime-local" */
export const toDatetimeLocalValue = (value: unknown): string => {
  const d = parseBackendDate(value)
  if (!d) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
