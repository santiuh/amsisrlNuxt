import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Solo oficinistas pueden gestionar ventas
  await requireRole(event, ['oficinista'])
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { venta_id, estado, fecha_coordinacion, comentarios_gestion, nro_cliente } = body

  if (!venta_id) {
    throw createError({ statusCode: 400, statusMessage: 'venta_id es requerido' })
  }

  const payload: Record<string, any> = {
    estado,
    fecha_coordinacion: fecha_coordinacion || null,
    comentarios_gestion,
    nro_cliente: nro_cliente || null,
  }

  const { error } = await client
    .from('ventas')
    .update(payload)
    .eq('id', venta_id)

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
