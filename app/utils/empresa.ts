export type EmpresaValue = 'express' | 'ultra' | 'chipped' | 'fibertec'

const LABELS: Record<string, string> = {
  express: 'Express',
  ultra: 'Ultra',
  chipped: 'Chipped',
  fibertec: 'Fibertec',
}

const COLORS: Record<string, string> = {
  express: 'blue',
  ultra: 'green',
  chipped: 'red',
  fibertec: 'sky',
}

export const empresaLabel = (value: string | null | undefined): string =>
  LABELS[value ?? ''] ?? 'Express'

export const empresaColor = (value: string | null | undefined): string =>
  COLORS[value ?? ''] ?? 'blue'
