import { serverSupabaseClient } from '#supabase/server'

const CANALES = ['puerta_a_puerta', 'telefono', 'whatsapp', 'instagram', 'facebook', 'referido', 'otro']
const ESTADOS = ['por_visitar', 'ausente', 'visitado', 'ofrecido', 'contratado', 'perdido', 'reconectar']
const MAX_FILAS = 200

const soloDigitos = (t: unknown): string => String(t ?? '').replace(/\D+/g, '')

// Importación masiva de prospectos (lotes de hasta 200 filas desde el wizard CSV).
// Dedupe soft por teléfono normalizado: contra el propio archivo y contra los
// prospectos ya visibles para el usuario (bajo RLS).
export default defineEventHandler(async (event) => {
  const { profile } = await requireProfile(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const rows: any[] = Array.isArray(body.rows) ? body.rows : []
  if (rows.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No hay filas para importar' })
  }
  if (rows.length > MAX_FILAS) {
    throw createError({ statusCode: 400, statusMessage: `Máximo ${MAX_FILAS} filas por lote` })
  }

  const esStaff = ['admin', 'oficinista'].includes(profile.rol)
  const vendedorId = esStaff && body.vendedor_id ? body.vendedor_id : profile.id

  // Teléfonos ya existentes (visibles bajo RLS) para dedupe
  const { data: existentes } = await client
    .from('prospectos')
    .select('telefono')
    .not('telefono', 'is', null)
  const telefonosExistentes = new Set(
    (existentes ?? []).map(r => soloDigitos(r.telefono)).filter(t => t.length >= 6),
  )

  const telefonosDelLote = new Set<string>()
  const aInsertar: Record<string, any>[] = []
  const duplicados: Array<{ fila: number; motivo: string }> = []
  const errores: Array<{ fila: number; mensaje: string }> = []

  rows.forEach((row, i) => {
    const fila = (typeof row._fila === 'number' ? row._fila : i + 1)
    const nombre = String(row.nombre ?? '').trim() || null
    const telefono = String(row.telefono ?? '').trim() || null
    const dirCalle = String(row.dir_calle ?? '').trim() || null
    const dirLocalidad = String(row.dir_localidad ?? '').trim() || null

    if (!nombre && !telefono && !dirCalle) {
      errores.push({ fila, mensaje: 'Fila sin nombre, teléfono ni dirección' })
      return
    }

    const telNorm = soloDigitos(telefono)
    if (telNorm.length >= 6) {
      if (telefonosDelLote.has(telNorm)) {
        duplicados.push({ fila, motivo: 'Teléfono repetido en el archivo' })
        return
      }
      if (telefonosExistentes.has(telNorm)) {
        duplicados.push({ fila, motivo: 'Ya existe un prospecto con ese teléfono' })
        return
      }
      telefonosDelLote.add(telNorm)
    }

    const canal = CANALES.includes(row.canal) ? row.canal : 'otro'
    const estado = ESTADOS.includes(row.estado) ? row.estado : 'por_visitar'

    let lat = row.lat != null && row.lat !== '' ? Number(row.lat) : null
    let lng = row.lng != null && row.lng !== '' ? Number(row.lng) : null
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
      lat = null
      lng = null
    }

    aInsertar.push({
      nombre,
      telefono,
      canal,
      estado,
      motivo_perdida: estado === 'perdido' ? (String(row.motivo_perdida ?? '').trim() || 'Importado sin detalle') : null,
      dir_calle: dirCalle,
      dir_entre_calles: String(row.dir_entre_calles ?? '').trim() || null,
      dir_localidad: dirLocalidad,
      dir_aclaracion: String(row.dir_aclaracion ?? '').trim() || null,
      lat,
      lng,
      notas: String(row.notas ?? '').trim() || null,
      vendedor_id: vendedorId,
      created_by: profile.id,
      origen: 'importado',
    })
  })

  let insertados = 0
  let idsInsertados: string[] = []
  if (aInsertar.length > 0) {
    const { data, error } = await client
      .from('prospectos')
      .insert(aInsertar)
      .select('id')

    if (error) {
      throw createError({ statusCode: 400, statusMessage: 'Error al insertar: ' + error.message })
    }
    insertados = data?.length ?? 0
    idsInsertados = (data ?? []).map(r => r.id)
  }

  return { success: true, insertados, duplicados, errores, ids: idsInsertados }
})
