import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const { pagado } = body

  if (typeof pagado !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'El campo pagado es requerido (boolean)' })
  }

  const { error } = await client.rpc('admin_marcar_pago', {
    p_pago_id: id,
    p_pagado: pagado,
  })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
