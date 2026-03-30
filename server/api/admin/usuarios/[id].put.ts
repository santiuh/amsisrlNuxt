import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const { nombre, rol, puede_vender_ultra } = body

  if (!nombre?.trim() || !rol) {
    throw createError({ statusCode: 400, statusMessage: 'Nombre y rol son requeridos' })
  }

  const { error } = await client.rpc('admin_update_profile', {
    p_user_id: id,
    p_nombre: nombre.trim(),
    p_rol: rol,
    p_puede_vender_ultra: puede_vender_ultra ?? false,
  })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
