import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { nombre, precio } = body

  if (!nombre || precio == null || precio < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nombre y precio válido requeridos' })
  }

  const { error } = await client.from('paquetes').insert({ nombre, precio })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
