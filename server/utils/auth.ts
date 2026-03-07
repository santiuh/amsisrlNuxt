import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import type { H3Event } from 'h3'

/**
 * Verifica que el request tiene un usuario autenticado.
 * Lanza 401 si no hay sesión válida.
 */
export async function requireAuth(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }
  return user
}

/**
 * Verifica autenticación y obtiene el perfil del usuario.
 * Lanza 401 si no hay sesión, 403 si no hay perfil.
 */
export async function requireProfile(event: H3Event) {
  const user = await requireAuth(event)
  const client = await serverSupabaseClient(event)

  const { data: profile, error } = await client
    .from('profiles')
    .select('id, nombre, email, rol, grupo_id, must_change_password')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    throw createError({ statusCode: 403, statusMessage: 'Perfil no encontrado' })
  }

  return { user, profile }
}

/**
 * Verifica que el usuario tiene rol admin.
 * Lanza 403 si no es admin.
 */
export async function requireAdmin(event: H3Event) {
  const { user, profile } = await requireProfile(event)
  if (profile.rol !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acceso denegado: se requiere rol admin' })
  }
  return { user, profile }
}

/**
 * Verifica que el usuario tiene uno de los roles especificados.
 */
export async function requireRole(event: H3Event, roles: string[]) {
  const { user, profile } = await requireProfile(event)
  if (!roles.includes(profile.rol)) {
    throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })
  }
  return { user, profile }
}
