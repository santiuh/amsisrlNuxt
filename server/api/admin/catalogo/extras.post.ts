import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { nombre, precio, empresa } = body

  if (!nombre || precio == null || precio < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nombre y precio válido requeridos' })
  }

  if (!empresa || !['express', 'ultra'].includes(empresa)) {
    throw createError({ statusCode: 400, statusMessage: 'Empresa inválida' })
  }

  const { error } = await client.from('extras').insert({ nombre, precio, empresa })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
