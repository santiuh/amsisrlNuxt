import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { ciclo_id } = body

  if (!ciclo_id) {
    throw createError({ statusCode: 400, statusMessage: 'ciclo_id es requerido' })
  }

  const { error } = await client.rpc('admin_cerrar_ciclo', {
    p_ciclo_id: ciclo_id,
  })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
