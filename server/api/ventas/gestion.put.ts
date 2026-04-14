import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Solo oficinistas pueden gestionar ventas
  const { user } = await requireRole(event, ['oficinista'])
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { venta_id, estado, fecha_coordinacion, comentarios_gestion, nro_cliente } = body

  if (!venta_id) {
    throw createError({ statusCode: 400, statusMessage: 'venta_id es requerido' })
  }

  // Leer estado actual para manejar transiciones + diff para activity log
  const { data: current } = await client
    .from('ventas')
    .select('estado, precio, precio_concretado, fecha_coordinacion, nro_cliente')
    .eq('id', venta_id)
    .single()

  const payload: Record<string, any> = {
    estado,
    fecha_coordinacion: fecha_coordinacion || null,
    comentarios_gestion,
    nro_cliente: nro_cliente || null,
  }

  // Snapshot de precio al entrar en en_proceso (una sola vez, nunca se sobreescribe)
  if (estado === 'en_proceso' && current && current.precio_concretado == null) {
    payload.precio_concretado = current.precio
  }

  // Registrar fecha_concretado al pasar a concretado
  if (estado === 'concretado' && current && current.estado !== 'concretado') {
    payload.fecha_concretado = new Date().toISOString()
  } else if (estado !== 'concretado' && current?.estado === 'concretado') {
    payload.fecha_concretado = null
  }

  const { error } = await client
    .from('ventas')
    .update(payload)
    .eq('id', venta_id)

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  // ─── Activity log (best-effort) ───────────────────────────────────────
  // Registra los cambios significativos que hizo la oficinista sobre la venta.
  // Si falla, lo logueamos en el server pero no rompemos la respuesta al cliente.
  if (current) {
    try {
      const rows: Array<Record<string, any>> = []
      const newFechaCoordIso = fecha_coordinacion ? new Date(fecha_coordinacion).toISOString() : null
      const oldFechaCoordIso = current.fecha_coordinacion ? new Date(current.fecha_coordinacion).toISOString() : null
      const newNroCliente = nro_cliente?.trim() || null
      const oldNroCliente = (current as any).nro_cliente || null

      // Cambio de estado
      if (estado && estado !== current.estado) {
        const row: Record<string, any> = {
          oficinista_id: user.id,
          venta_id,
          action_type: 'estado_change',
          from_estado: current.estado,
          to_estado: estado,
          metadata: {},
        }
        // Si además fija fecha_coordinacion (típicamente al pasar a coordinado), la consignamos acá
        if (estado === 'coordinado' && newFechaCoordIso) {
          row.fecha_coordinacion_set = newFechaCoordIso
        }
        rows.push(row)
      } else if (newFechaCoordIso !== oldFechaCoordIso) {
        // Estado no cambió pero fecha_coordinacion sí
        rows.push({
          oficinista_id: user.id,
          venta_id,
          action_type: 'coordinacion_set',
          fecha_coordinacion_set: newFechaCoordIso,
          metadata: {},
        })
      }

      // Nro cliente cambió (puede acumularse con cualquiera de las anteriores)
      if (newNroCliente !== oldNroCliente && newNroCliente) {
        rows.push({
          oficinista_id: user.id,
          venta_id,
          action_type: 'nro_cliente_set',
          metadata: { nro_cliente: newNroCliente },
        })
      }

      if (rows.length > 0) {
        const { error: logError } = await client.from('oficinista_activity').insert(rows)
        if (logError) {
          console.error('[oficinista_activity] log insert failed', logError)
        }
      }
    } catch (err) {
      console.error('[oficinista_activity] log insert threw', err)
    }
  }

  return { success: true }
})
