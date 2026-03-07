import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { venta_id } = body

  if (!venta_id) {
    throw createError({ statusCode: 400, statusMessage: 'venta_id es requerido' })
  }

  const { error } = await client.rpc('marcar_venta_leida', {
    p_venta_id: venta_id,
  })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
