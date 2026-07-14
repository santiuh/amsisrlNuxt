import { serverSupabaseClient } from '#supabase/server'

// Vincula un prospecto con una venta creada desde él:
// setea venta_id, pasa el estado a 'contratado' y deja una interacción automática.
export default defineEventHandler(async (event) => {
  const { profile } = await requireProfile(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { prospecto_id: prospectoId, venta_id: ventaId } = body
  if (!prospectoId || !ventaId) {
    throw createError({ statusCode: 400, statusMessage: 'Faltan prospecto_id o venta_id' })
  }

  // Ambas filas deben ser accesibles bajo el RLS del usuario
  const { data: prospecto } = await client
    .from('prospectos')
    .select('id, estado')
    .eq('id', prospectoId)
    .maybeSingle()
  if (!prospecto) {
    throw createError({ statusCode: 404, statusMessage: 'Prospecto no encontrado' })
  }

  const { data: venta } = await client
    .from('ventas')
    .select('id')
    .eq('id', ventaId)
    .maybeSingle()
  if (!venta) {
    throw createError({ statusCode: 404, statusMessage: 'Venta no encontrada' })
  }

  const ahora = new Date().toISOString()
  const { error } = await client
    .from('prospectos')
    .update({
      venta_id: ventaId,
      estado: 'contratado',
      fecha_ultima_interaccion: ahora,
      updated_at: ahora,
    })
    .eq('id', prospectoId)

  if (error) {
    // ej. UNIQUE de venta_id: la venta ya está vinculada a otro prospecto
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  // Interacción automática (best-effort)
  const { error: logError } = await client.from('prospecto_interacciones').insert({
    prospecto_id: prospectoId,
    autor_id: profile.id,
    tipo: 'otro',
    resultado: 'contratado',
    estado_resultante: 'contratado',
    comentario: 'Venta creada desde el prospecto',
  })
  if (logError) {
    console.error('[prospecto_interacciones] log insert failed', logError)
  }

  return { success: true }
})
