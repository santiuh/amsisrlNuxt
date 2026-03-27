import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const id = getRouterParam(event, 'id')

  const { error } = await client.from('ventas').delete().eq('id', id)

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
