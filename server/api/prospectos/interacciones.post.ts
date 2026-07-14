import { serverSupabaseClient } from '#supabase/server'

const ESTADOS = ['por_visitar', 'ausente', 'visitado', 'ofrecido', 'contratado', 'perdido', 'reconectar']
const TIPOS = ['visita', 'llamada', 'whatsapp', 'red_social', 'otro']
const RESULTADOS = ['ausente', 'interesado', 'no_interesado', 'contratado', 'reprogramar', 'otro']

// Registra una interacción (append-only) y actualiza los campos denormalizados
// del prospecto: fecha_ultima_interaccion, proxima_visita y (opcional) estado.
export default defineEventHandler(async (event) => {
  const { profile } = await requireProfile(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const prospectoId = body.prospecto_id
  if (!prospectoId) {
    throw createError({ statusCode: 400, statusMessage: 'Falta prospecto_id' })
  }
  if (!TIPOS.includes(body.tipo)) {
    throw createError({ statusCode: 400, statusMessage: 'Tipo de interacción inválido' })
  }
  if (body.resultado != null && !RESULTADOS.includes(body.resultado)) {
    throw createError({ statusCode: 400, statusMessage: 'Resultado inválido' })
  }
  if (body.nuevo_estado != null && !ESTADOS.includes(body.nuevo_estado)) {
    throw createError({ statusCode: 400, statusMessage: 'Estado inválido' })
  }

  // Leer el prospecto bajo RLS: si no es accesible → 404
  const { data: prospecto } = await client
    .from('prospectos')
    .select('id, estado, motivo_perdida')
    .eq('id', prospectoId)
    .maybeSingle()

  if (!prospecto) {
    throw createError({ statusCode: 404, statusMessage: 'Prospecto no encontrado' })
  }

  const nuevoEstado = body.nuevo_estado ?? null
  const motivoFinal = body.motivo_perdida ?? prospecto.motivo_perdida
  if (nuevoEstado === 'perdido' && !motivoFinal) {
    throw createError({ statusCode: 400, statusMessage: 'Indicá el motivo de pérdida' })
  }

  const { data: interaccion, error } = await client
    .from('prospecto_interacciones')
    .insert({
      prospecto_id: prospectoId,
      autor_id: profile.id,
      tipo: body.tipo,
      resultado: body.resultado ?? null,
      estado_resultante: nuevoEstado ?? prospecto.estado,
      comentario: body.comentario?.trim() || null,
      proxima_visita: body.proxima_visita || null,
    })
    .select('id')
    .single()

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  // Actualizar denormalizados del prospecto
  const update: Record<string, any> = {
    fecha_ultima_interaccion: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if ('proxima_visita' in body) update.proxima_visita = body.proxima_visita || null
  if (nuevoEstado) {
    update.estado = nuevoEstado
    if (nuevoEstado === 'perdido') update.motivo_perdida = motivoFinal
  }

  const { error: updateError } = await client
    .from('prospectos')
    .update(update)
    .eq('id', prospectoId)

  if (updateError) {
    // La interacción ya quedó registrada; avisar sin romper
    return { success: true, id: interaccion.id, warning: 'Interacción guardada pero error al actualizar el prospecto: ' + updateError.message }
  }

  return { success: true, id: interaccion.id }
})
