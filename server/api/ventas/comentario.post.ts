import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Vendedores y líderes pueden agregar comentarios en ventas en conflicto
  await requireRole(event, ['vendedor', 'lider'])
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { venta_id, texto } = body

  if (!venta_id || !texto?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'venta_id y texto son requeridos' })
  }

  const { error } = await client.rpc('vendedor_add_gestion_comment', {
    p_venta_id: venta_id,
    p_texto: texto.trim(),
  })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
