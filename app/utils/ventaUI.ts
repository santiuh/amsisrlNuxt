export const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  en_conflicto: 'En Conflicto',
  rechazado: 'Rechazado',
  coordinado: 'Coordinado',
  concretado: 'Concretado',
  proxima_zona: 'Próxima Zona',
}

export const ESTADO_PILL: Record<string, string> = {
  pendiente: 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/40',
  en_proceso: 'bg-amber-50 text-amber-700 ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  en_conflicto: 'bg-orange-50 text-orange-700 ring-orange-200/60 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20',
  rechazado: 'bg-rose-50 text-rose-700 ring-rose-200/60 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
  coordinado: 'bg-cyan-50 text-cyan-700 ring-cyan-200/60 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/20',
  concretado: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  proxima_zona: 'bg-violet-50 text-violet-700 ring-violet-200/60 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20',
}

export const EMPRESA_PILL_CLASS: Record<string, string> = {
  express: 'bg-blue-50 text-blue-700 ring-blue-200/60 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20',
  ultra: 'bg-violet-50 text-violet-700 ring-violet-200/60 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20',
  chipped: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
}

export const estadoLabel = (e: string) => ESTADO_LABELS[e] ?? e
export const estadoPillClass = (e: string) => ESTADO_PILL[e] ?? ESTADO_PILL.pendiente
export const empresaPillClass = (e: string) => EMPRESA_PILL_CLASS[e] ?? EMPRESA_PILL_CLASS.express

export function tieneComentarioNuevo(
  venta: { id: string; comentarios_gestion?: unknown },
  lecturas?: Record<string, string>,
): boolean {
  if (!lecturas) return false
  const log = venta.comentarios_gestion
  if (!Array.isArray(log) || log.length === 0) return false
  const comentarios = log.filter((e: any) => e.tipo === 'comentario')
  if (comentarios.length === 0) return false
  const ultimoComentario = comentarios[0]?.fecha_hora
  if (!ultimoComentario) return false
  const ultimaLectura = lecturas[venta.id]
  if (!ultimaLectura) return true
  return new Date(ultimoComentario) > new Date(ultimaLectura)
}
