import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { precio_boca_extra, precio_deco_extra, empresa } = body

  if (precio_boca_extra < 0 || precio_deco_extra < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Los precios no pueden ser negativos' })
  }

  if (!empresa || !['express', 'ultra'].includes(empresa)) {
    throw createError({ statusCode: 400, statusMessage: 'Empresa inválida' })
  }

  const ahora = new Date().toISOString()
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    client.from('configuracion').update({ valor: precio_boca_extra, updated_at: ahora }).eq('clave', 'precio_boca_extra').eq('empresa', empresa),
    client.from('configuracion').update({ valor: precio_deco_extra, updated_at: ahora }).eq('clave', 'precio_deco_extra').eq('empresa', empresa),
  ])

  if (e1 || e2) {
    throw createError({ statusCode: 500, statusMessage: (e1 || e2)!.message })
  }

  return { success: true }
})
