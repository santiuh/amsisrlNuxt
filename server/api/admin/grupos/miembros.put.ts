import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { grupo_id, vendedor_ids } = body

  if (!grupo_id || !Array.isArray(vendedor_ids)) {
    throw createError({ statusCode: 400, statusMessage: 'grupo_id y vendedor_ids son requeridos' })
  }

  const { error } = await client.rpc('admin_set_grupo_members', {
    p_grupo_id: grupo_id,
    p_vendedor_ids: vendedor_ids,
  })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
