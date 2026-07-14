import { serverSupabaseClient } from '#supabase/server'

const ESTADOS = ['por_visitar', 'ausente', 'visitado', 'ofrecido', 'contratado', 'perdido', 'reconectar']
const CANALES = ['puerta_a_puerta', 'telefono', 'whatsapp', 'instagram', 'facebook', 'referido', 'otro']

// Campos editables por cualquier rol con acceso a la fila (el RLS decide el alcance).
// vendedor_id (reasignar dueño) solo staff; venta_id se maneja en link-venta.post.ts.
const ALLOWED_EDIT_FIELDS = [
  'nombre', 'telefono', 'canal',
  'estado', 'motivo_perdida',
  'dir_calle', 'dir_entre_calles', 'dir_localidad', 'dir_aclaracion',
  'lat', 'lng',
  'notas', 'proxima_visita',
] as const

export default defineEventHandler(async (event) => {
  const { profile } = await requireProfile(event)
  const client = await serverSupabaseClient(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  // Leer la fila bajo RLS: si no es accesible para este usuario → 404
  const { data: current } = await client
    .from('prospectos')
    .select('id, estado, motivo_perdida, lat, lng')
    .eq('id', id)
    .maybeSingle()

  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'Prospecto no encontrado' })
  }

  const data: Record<string, any> = {}
  for (const key of ALLOWED_EDIT_FIELDS) {
    if (key in body) data[key] = body[key]
  }

  if (data.estado !== undefined && !ESTADOS.includes(data.estado)) {
    throw createError({ statusCode: 400, statusMessage: 'Estado inválido' })
  }
  if (data.canal !== undefined && !CANALES.includes(data.canal)) {
    throw createError({ statusCode: 400, statusMessage: 'Canal inválido' })
  }

  const estadoFinal = data.estado ?? current.estado
  const motivoFinal = 'motivo_perdida' in data ? data.motivo_perdida : current.motivo_perdida
  if (estadoFinal === 'perdido' && !motivoFinal) {
    throw createError({ statusCode: 400, statusMessage: 'Indicá el motivo de pérdida' })
  }

  // Coordenadas: ambas o ninguna (mismo invariante que el CHECK de la tabla)
  const latFinal = 'lat' in data ? data.lat : current.lat
  const lngFinal = 'lng' in data ? data.lng : current.lng
  if ((latFinal == null) !== (lngFinal == null)) {
    throw createError({ statusCode: 400, statusMessage: 'Coordenadas incompletas' })
  }

  // Reasignar dueño: solo staff
  if (body.vendedor_id && ['admin', 'oficinista'].includes(profile.rol)) {
    data.vendedor_id = body.vendedor_id
  }

  // Al setear coordenadas a mano, deja de ser aproximada (pasa a exacta)
  if ('lat' in data && data.lat != null) {
    data.ubicacion_aproximada = false
  }

  if (Object.keys(data).length === 0) {
    return { success: true }
  }

  data.updated_at = new Date().toISOString()

  const { error } = await client
    .from('prospectos')
    .update(data)
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
