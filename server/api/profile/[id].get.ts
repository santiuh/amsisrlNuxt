import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const { profile: viewer } = await requireProfile(event)
  const targetId = getRouterParam(event, 'id')

  if (!targetId) {
    throw createError({ statusCode: 400, statusMessage: 'Falta id de perfil' })
  }

  // Propio perfil: siempre permitido
  const isSelf = targetId === viewer.id

  // Vendedor solo puede ver el suyo
  if (!isSelf && viewer.rol === 'vendedor') {
    throw createError({ statusCode: 403, statusMessage: 'Solo podés ver tu propio perfil' })
  }

  const client = await serverSupabaseClient(event)

  const { data: target, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', targetId)
    .single()

  if (error || !target) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil no encontrado' })
  }

  // Líder solo puede ver perfiles de vendedores de su mismo grupo
  if (!isSelf && viewer.rol === 'lider') {
    if (!viewer.grupo_id || target.grupo_id !== viewer.grupo_id) {
      throw createError({ statusCode: 403, statusMessage: 'Solo podés ver perfiles de tu grupo' })
    }
  }

  // admin y oficinista: pueden ver cualquier perfil — sin chequeo extra

  return target
})
