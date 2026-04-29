import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('ventas_localidades_distinct')

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return (data ?? []).map((row: { localidad: string }) => row.localidad)
})
