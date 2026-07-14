import { serverSupabaseClient } from '#supabase/server'

const ESTADOS = ['por_visitar', 'ausente', 'visitado', 'ofrecido', 'contratado', 'perdido', 'reconectar']
const CANALES = ['puerta_a_puerta', 'telefono', 'whatsapp', 'instagram', 'facebook', 'referido', 'otro']

export default defineEventHandler(async (event) => {
  const { profile } = await requireProfile(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  // Staff puede asignar dueño; vendedor/líder siempre crea prospectos propios
  const esStaff = ['admin', 'oficinista'].includes(profile.rol)
  const vendedorId = esStaff && body.vendedor_id ? body.vendedor_id : profile.id

  const estado = body.estado ?? 'por_visitar'
  if (!ESTADOS.includes(estado)) {
    throw createError({ statusCode: 400, statusMessage: 'Estado inválido' })
  }
  const canal = body.canal ?? 'puerta_a_puerta'
  if (!CANALES.includes(canal)) {
    throw createError({ statusCode: 400, statusMessage: 'Canal inválido' })
  }
  if (estado === 'perdido' && !body.motivo_perdida) {
    throw createError({ statusCode: 400, statusMessage: 'Indicá el motivo de pérdida' })
  }

  const lat = body.lat ?? null
  const lng = body.lng ?? null
  if ((lat == null) !== (lng == null)) {
    throw createError({ statusCode: 400, statusMessage: 'Coordenadas incompletas' })
  }

  const { data, error } = await client
    .from('prospectos')
    .insert({
      nombre: body.nombre?.trim() || null,
      telefono: body.telefono?.trim() || null,
      canal,
      estado,
      motivo_perdida: body.motivo_perdida ?? null,
      dir_calle: body.dir_calle?.trim() || null,
      dir_entre_calles: body.dir_entre_calles?.trim() || null,
      dir_localidad: body.dir_localidad?.trim() || null,
      dir_aclaracion: body.dir_aclaracion?.trim() || null,
      lat,
      lng,
      notas: body.notas?.trim() || null,
      proxima_visita: body.proxima_visita || null,
      vendedor_id: vendedorId,
      created_by: profile.id,
      origen: 'manual',
    })
    .select('id')
    .single()

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true, id: data.id }
})
