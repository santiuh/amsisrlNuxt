import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { lider_id } = body

  if (!lider_id) {
    throw createError({ statusCode: 400, statusMessage: 'Se requiere el ID del líder' })
  }

  const { error } = await client.rpc('admin_create_grupo', { p_lider_id: lider_id })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
