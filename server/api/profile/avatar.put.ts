import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const body = await readBody(event)

  if (!body.config || typeof body.config !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Config de avatar inválida' })
  }

  const { skin, hairColor, eyeColor, clothesColor, hairStyle, sex } = body.config
  if (!skin || !hairColor || !eyeColor || !clothesColor || !hairStyle || !sex) {
    throw createError({ statusCode: 400, statusMessage: 'Config de avatar incompleta' })
  }

  const client = await serverSupabaseClient(event)
  const { error } = await client.rpc('update_own_avatar', { p_config: body.config })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Error al guardar el avatar' })
  }

  return { ok: true }
})
