import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { password } = body

  if (!password || password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'La contraseña debe tener al menos 6 caracteres' })
  }

  const { error } = await client.rpc('user_change_password', {
    p_new_password: password,
  })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
