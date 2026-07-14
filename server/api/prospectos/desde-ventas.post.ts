import { serverSupabaseClient } from '#supabase/server'

// Genera prospectos a partir de ventas existentes — TODAS, no solo concretadas:
// una venta rechazada es un intento perdido que conviene ver en el mapa para
// reintentar. Mapeo de estados venta → prospecto:
//   concretado            → contratado
//   rechazado             → perdido (motivo "Venta rechazada")
//   proxima_zona          → reconectar
//   resto (en curso)      → ofrecido
// origen='venta', sin coordenadas (quedan "sin ubicar").
// Idempotente: el upsert con ignoreDuplicates salta las ventas ya vinculadas
// (UNIQUE venta_id). Las lecturas se paginan porque PostgREST corta en 1000 filas.

const ESTADO_VENTA_A_PROSPECTO: Record<string, string> = {
  concretado: 'contratado',
  rechazado: 'perdido',
  proxima_zona: 'reconectar',
}

const PAGE = 1000
const LOTE_INSERT = 500

export default defineEventHandler(async (event) => {
  const { profile } = await requireRole(event, ['admin', 'oficinista'])
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const ventaIds: string[] | null = Array.isArray(body.venta_ids) && body.venta_ids.length > 0
    ? body.venta_ids
    : null
  // todas=true importa todas las ventas; se mantiene todas_concretadas por compatibilidad
  const todas = body.todas === true
  const todasConcretadas = body.todas_concretadas === true

  if (!ventaIds && !todas && !todasConcretadas) {
    throw createError({ statusCode: 400, statusMessage: 'Indicá venta_ids, todas o todas_concretadas' })
  }

  // Leer ventas paginado (PostgREST limita a 1000 filas por request)
  const ventas: any[] = []
  for (let from = 0; ; from += PAGE) {
    let q = client
      .from('ventas')
      .select('id, cliente, telefono, estado, dir_calle, dir_entre_calles, dir_localidad, dir_aclaracion, vendedor_id')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (ventaIds) {
      q = q.in('id', ventaIds)
    } else if (todasConcretadas && !todas) {
      q = q.eq('estado', 'concretado')
    }
    const { data, error } = await q
    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message })
    }
    ventas.push(...(data ?? []))
    if (!data || data.length < PAGE) break
  }

  if (ventas.length === 0) {
    return { success: true, creados: 0, omitidos: 0 }
  }

  const rows = ventas.map(v => ({
    nombre: v.cliente ?? null,
    telefono: v.telefono ?? null,
    canal: 'puerta_a_puerta',
    estado: ESTADO_VENTA_A_PROSPECTO[v.estado] ?? 'ofrecido',
    motivo_perdida: v.estado === 'rechazado' ? 'Venta rechazada' : null,
    dir_calle: v.dir_calle ?? null,
    dir_entre_calles: v.dir_entre_calles ?? null,
    dir_localidad: v.dir_localidad ?? null,
    dir_aclaracion: v.dir_aclaracion ?? null,
    vendedor_id: v.vendedor_id,
    created_by: profile.id,
    venta_id: v.id,
    origen: 'venta',
  }))

  // Insertar en lotes; ON CONFLICT (venta_id) DO NOTHING → idempotente
  let creados = 0
  const porEstado: Record<string, number> = {}
  for (let i = 0; i < rows.length; i += LOTE_INSERT) {
    const lote = rows.slice(i, i + LOTE_INSERT)
    const { data: insertados, error: insertError } = await client
      .from('prospectos')
      .upsert(lote, { onConflict: 'venta_id', ignoreDuplicates: true })
      .select('id, estado')
    if (insertError) {
      throw createError({ statusCode: 400, statusMessage: 'Error al crear prospectos: ' + insertError.message })
    }
    creados += insertados?.length ?? 0
    for (const r of insertados ?? []) {
      porEstado[r.estado] = (porEstado[r.estado] ?? 0) + 1
    }
  }

  return {
    success: true,
    creados,
    omitidos: ventas.length - creados,
    por_estado: porEstado,
  }
})
