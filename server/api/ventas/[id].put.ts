import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Solo admin puede editar todos los campos de una venta
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const { _extras, extras_ids, profiles, venta_extras, ...ventaData } = body

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
