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

  // Leer estado actual para manejar transiciones
  const { data: current } = await client
    .from('ventas')
    .select('estado, precio, precio_concretado')
    .eq('id', venta_id)
    .single()

  const payload: Record<string, any> = {
    estado,
    fecha_coordinacion: fecha_coordinacion || null,
    comentarios_gestion,
    nro_cliente: nro_cliente || null,
  }

  // Snapshot de precio al entrar en en_proceso (una sola vez, nunca se sobreescribe)
  if (estado === 'en_proceso' && current && current.precio_concretado == null) {
    payload.precio_concretado = current.precio
  }

  // Registrar fecha_concretado al pasar a concretado
  if (estado === 'concretado' && current && current.estado !== 'concretado') {
    payload.fecha_concretado = new Date().toISOString()
  } else if (estado !== 'concretado' && current?.estado === 'concretado') {
    payload.fecha_concretado = null
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
