import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { email, password, nombre, rol } = body

  if (!email || !password || !nombre || !rol) {
    throw createError({ statusCode: 400, statusMessage: 'Completá todos los campos' })
  }
  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'La contraseña debe tener al menos 6 caracteres' })
  }

  const { error } = await client.rpc('admin_create_user', {
    p_email: email,
    p_password: password,
    p_nombre: nombre,
    p_rol: rol,
  })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
