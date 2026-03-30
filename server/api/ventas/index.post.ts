import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const { profile } = await requireProfile(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { _extras, extras_ids, ...ventaData } = body

  // Validar permiso Ultra
  if (ventaData.empresa === 'ultra' && !profile.puede_vender_ultra) {
    throw createError({ statusCode: 403, statusMessage: 'No tenés permiso para vender Ultra' })
  }

  const { data: ventaCreada, error } = await client
    .from('ventas')
    .insert({ ...ventaData, vendedor_id: profile.id })
    .select('id')
    .single()

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  // Insertar extras seleccionados con snapshot de precio
  if (_extras && Array.isArray(_extras) && _extras.length > 0) {
    const ventaExtrasRows = _extras.map((e: any) => ({
      venta_id: ventaCreada.id,
      extra_id: e.id,
      precio_snapshot: e.precio,
    }))
    const { error: errorExtras } = await client.from('venta_extras').insert(ventaExtrasRows)
    if (errorExtras) {
      // Venta ya fue creada, retornar con warning
      return { success: true, warning: 'Venta guardada pero error en extras: ' + errorExtras.message }
    }
  }

  return { success: true, id: ventaCreada.id }
})
