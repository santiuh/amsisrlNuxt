import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { pct_grupo, pct_lider, empresa } = body

  if (pct_grupo == null || pct_lider == null) {
    throw createError({ statusCode: 400, statusMessage: 'Porcentajes requeridos' })
  }

  if (!empresa || !['express', 'ultra'].includes(empresa)) {
    throw createError({ statusCode: 400, statusMessage: 'Empresa inválida' })
  }

  const ahora = new Date().toISOString()
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    client.from('configuracion').update({ valor: String(pct_grupo), updated_at: ahora }).eq('clave', 'comision_porcentaje_grupo').eq('empresa', empresa),
    client.from('configuracion').update({ valor: String(pct_lider), updated_at: ahora }).eq('clave', 'comision_porcentaje_lider').eq('empresa', empresa),
  ])

  if (e1 || e2) {
    throw createError({ statusCode: 500, statusMessage: (e1 || e2)!.message })
  }

  return { success: true }
})
