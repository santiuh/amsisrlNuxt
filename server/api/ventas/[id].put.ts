import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Solo admin puede editar todos los campos de una venta
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const { _extras, extras_ids, profiles, venta_extras, ...ventaData } = body

  // precio_concretado es gestionado exclusivamente server-side, ignorar valor del cliente
  delete ventaData.precio_concretado

  // Manejar transiciones de estado para precio_concretado y fecha_concretado
  if (ventaData.estado !== undefined) {
    const { data: current } = await client
      .from('ventas')
      .select('estado, precio, precio_concretado')
      .eq('id', id)
      .single()

    if (current) {
      // Snapshot de precio al entrar en en_proceso (una sola vez)
      if (ventaData.estado === 'en_proceso' && current.precio_concretado == null) {
        ventaData.precio_concretado = current.precio
      }

      // Registrar fecha_concretado al pasar a concretado
      if (ventaData.estado === 'concretado' && current.estado !== 'concretado') {
        ventaData.fecha_concretado = new Date().toISOString()
      } else if (ventaData.estado !== 'concretado' && current.estado === 'concretado') {
        ventaData.fecha_concretado = null
      }
    }
  }

  const { error } = await client
    .from('ventas')
    .update(ventaData)
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  // Reemplazar extras si se enviaron
  if (_extras !== undefined) {
    await client.from('venta_extras').delete().eq('venta_id', id)
    if (Array.isArray(_extras) && _extras.length > 0) {
      await client.from('venta_extras').insert(
        _extras.map((e: any) => ({
          venta_id: id,
          extra_id: e.id,
          precio_snapshot: e.precio,
        })),
      )
    }
  }

  return { success: true }
})
