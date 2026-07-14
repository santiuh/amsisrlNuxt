// Constantes de UI para prospección (labels, colores de pin, pills).
// Los valores deben coincidir con los CHECK de docs/migrations/2026-07-12-prospectos-mapa.sql.

export const PROSPECTO_ESTADOS = [
  'por_visitar', 'ausente', 'visitado', 'ofrecido', 'contratado', 'perdido', 'reconectar',
] as const

export type ProspectoEstado = (typeof PROSPECTO_ESTADOS)[number]

export const PROSPECTO_ESTADO_LABELS: Record<string, string> = {
  por_visitar: 'Por Visitar',
  ausente: 'Ausente',
  visitado: 'Visitado',
  ofrecido: 'Ofrecido',
  contratado: 'Contratado',
  perdido: 'Perdido',
  reconectar: 'Reconectar',
}

// Color de relleno del pin en el mapa (hex, se usa en L.divIcon)
export const PROSPECTO_ESTADO_PIN_COLOR: Record<string, string> = {
  por_visitar: '#64748b', // slate
  ausente: '#f59e0b',     // amber
  visitado: '#0ea5e9',    // sky
  ofrecido: '#8b5cf6',    // violet
  contratado: '#10b981',  // emerald
  perdido: '#f43f5e',     // rose
  reconectar: '#f97316',  // orange
}

export const PROSPECTO_ESTADO_PILL: Record<string, string> = {
  por_visitar: 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/40',
  ausente: 'bg-amber-50 text-amber-700 ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  visitado: 'bg-sky-50 text-sky-700 ring-sky-200/60 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20',
  ofrecido: 'bg-violet-50 text-violet-700 ring-violet-200/60 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20',
  contratado: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  perdido: 'bg-rose-50 text-rose-700 ring-rose-200/60 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
  reconectar: 'bg-orange-50 text-orange-700 ring-orange-200/60 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20',
}

export const PROSPECTO_CANALES = [
  'puerta_a_puerta', 'telefono', 'whatsapp', 'instagram', 'facebook', 'referido', 'otro',
] as const

export const CANAL_LABELS: Record<string, string> = {
  puerta_a_puerta: 'Puerta a Puerta',
  telefono: 'Teléfono',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  referido: 'Referido',
  otro: 'Otro',
}

export const CANAL_ICONS: Record<string, string> = {
  puerta_a_puerta: 'i-heroicons-home-modern',
  telefono: 'i-heroicons-phone',
  whatsapp: 'i-heroicons-chat-bubble-left-ellipsis',
  instagram: 'i-heroicons-camera',
  facebook: 'i-heroicons-user-group',
  referido: 'i-heroicons-hand-thumb-up',
  otro: 'i-heroicons-question-mark-circle',
}

export const INTERACCION_TIPOS = ['visita', 'llamada', 'whatsapp', 'red_social', 'otro'] as const

export const INTERACCION_TIPO_LABELS: Record<string, string> = {
  visita: 'Visita',
  llamada: 'Llamada',
  whatsapp: 'WhatsApp',
  red_social: 'Red Social',
  otro: 'Otro',
}

export const INTERACCION_RESULTADOS = [
  'ausente', 'interesado', 'no_interesado', 'contratado', 'reprogramar', 'otro',
] as const

export const INTERACCION_RESULTADO_LABELS: Record<string, string> = {
  ausente: 'No estaba / Ausente',
  interesado: 'Interesado',
  no_interesado: 'No le interesa',
  contratado: 'Contrató',
  reprogramar: 'Reprogramar',
  otro: 'Otro',
}

// Motivos de pérdida predefinidos (el campo en DB es texto libre; la UI ofrece
// estos + "Otro" con detalle)
export const MOTIVOS_PERDIDA = [
  'Precio',
  'Ya tiene otro proveedor',
  'Zona sin cobertura',
  'No le interesa',
  'Mala experiencia previa',
  'Otro',
] as const

export const prospectoEstadoLabel = (e: string) => PROSPECTO_ESTADO_LABELS[e] ?? e
export const prospectoEstadoPill = (e: string) => PROSPECTO_ESTADO_PILL[e] ?? PROSPECTO_ESTADO_PILL.por_visitar
export const prospectoPinColor = (e: string) => PROSPECTO_ESTADO_PIN_COLOR[e] ?? PROSPECTO_ESTADO_PIN_COLOR.por_visitar
export const canalLabel = (c: string) => CANAL_LABELS[c] ?? c
export const interaccionTipoLabel = (t: string) => INTERACCION_TIPO_LABELS[t] ?? t
export const interaccionResultadoLabel = (r: string) => INTERACCION_RESULTADO_LABELS[r] ?? r

// Normaliza un teléfono a solo dígitos (para dedupe en import y búsqueda)
export const normalizarTelefono = (t: string | null | undefined): string =>
  (t ?? '').replace(/\D+/g, '')

export interface ProspectoPin {
  id: string
  lat: number
  lng: number
  estado: string
  fecha_ultima_interaccion: string | null
  proxima_visita: string | null
  vendedor_id: string
  vendedor_nombre: string | null
  localidad: string | null
  ubicacion_aproximada?: boolean
  acceso_completo: boolean
}

// Fila completa de la tabla prospectos (visible solo bajo RLS: propia/grupo/staff)
export interface ProspectoRow {
  id: string
  nombre: string | null
  telefono: string | null
  canal: string
  estado: string
  motivo_perdida: string | null
  dir_calle: string | null
  dir_entre_calles: string | null
  dir_localidad: string | null
  dir_aclaracion: string | null
  lat: number | null
  lng: number | null
  notas: string | null
  proxima_visita: string | null
  fecha_ultima_interaccion: string | null
  vendedor_id: string
  created_by: string | null
  venta_id: string | null
  origen: string
  ubicacion_aproximada?: boolean
  created_at: string
  updated_at: string
}

export const direccionCompleta = (p: Pick<ProspectoRow, 'dir_calle' | 'dir_entre_calles' | 'dir_localidad'>): string =>
  [p.dir_calle, p.dir_entre_calles ? `e/ ${p.dir_entre_calles}` : null, p.dir_localidad]
    .filter(Boolean)
    .join(', ')
