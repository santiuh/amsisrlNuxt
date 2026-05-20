export type EmpresaValue = 'express' | 'ultra' | 'chipped'

const LABELS: Record<string, string> = {
  express: 'Express',
  ultra: 'Ultra',
  chipped: 'Chipped',
}

const COLORS: Record<string, string> = {
  express: 'blue',
  ultra: 'violet',
  chipped: 'emerald',
}

export const empresaLabel = (value: string | null | undefined): string =>
  LABELS[value ?? ''] ?? 'Express'

export const empresaColor = (value: string | null | undefined): string =>
  COLORS[value ?? ''] ?? 'blue'
