import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { ciclo_id, nueva_fecha } = body

  if (!ciclo_id || !nueva_fecha) {
    throw createError({ statusCode: 400, statusMessage: 'ciclo_id y nueva_fecha son requeridos' })
  }

  const { error } = await client.rpc('admin_actualizar_fecha_cierre', {
    p_ciclo_id: ciclo_id,
    p_nueva_fecha: nueva_fecha,
  })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
