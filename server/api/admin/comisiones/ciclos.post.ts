import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { fecha_cierre_prevista } = body

  if (!fecha_cierre_prevista) {
    throw createError({ statusCode: 400, statusMessage: 'Seleccioná una fecha de cierre' })
  }

  const { error } = await client.rpc('admin_crear_ciclo', {
    p_fecha_cierre_prevista: fecha_cierre_prevista,
  })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
