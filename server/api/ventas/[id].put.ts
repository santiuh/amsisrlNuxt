import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Solo admin puede editar todos los campos de una venta
  const { user } = await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const { _extras, extras_ids, profiles, venta_extras, ...ventaData } = body

  // precio_concretado es gestionado exclusivamente server-side, ignorar valor del cliente
  delete ventaData.precio_concretado

  // Leer estado actual siempre (para transiciones y para el activity log)
  const { data: current } = await client
    .from('ventas')
    .select('estado, precio, precio_concretado, fecha_coordinacion, nro_cliente')
    .eq('id', id)
    .single()

  if (ventaData.estado !== undefined && current) {
    // Snapshot de precio al entrar en en_proceso (una sola vez)
    if (ventaData.estado === 'en_proceso' && current.precio_concretado == null) {
      ventaData.precio_concretado = current.precio
    }

    // Registrar fecha_concretado al pasar a concretado
    if (ventaData.estado === 'concretado' && current.estado !== 'concretado') {
      ventaData.fecha_concretado = new Date().toISOString()
    } else if (ventaData.estado !== 'concretado' && current.estado === 'concretado') {
      ventaData.fecha_concretado = null
    }
  }

  const { error } = await client
    .from('ventas')
    .update(ventaData)
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  // ─── Activity log (best-effort) ───────────────────────────────────────
  // Mismo patrón que gestion.put.ts: compara current vs body y escribe 1 row por cambio.
  if (current && id) {
    try {
      const rows: Array<Record<string, any>> = []
      const newFechaCoordIso =
        ventaData.fecha_coordinacion ? new Date(ventaData.fecha_coordinacion).toISOString() : null
      const oldFechaCoordIso =
        current.fecha_coordinacion ? new Date(current.fecha_coordinacion).toISOString() : null
      const newNroCliente =
        typeof ventaData.nro_cliente === 'string' ? (ventaData.nro_cliente.trim() || null) : null
      const oldNroCliente = (current as any).nro_cliente || null

      if (ventaData.estado !== undefined && ventaData.estado !== current.estado) {
        const row: Record<string, any> = {
          oficinista_id: user.id,
          venta_id: id,
          action_type: 'estado_change',
          from_estado: current.estado,
          to_estado: ventaData.estado,
          metadata: {},
        }
        if (ventaData.estado === 'coordinado' && newFechaCoordIso) {
          row.fecha_coordinacion_set = newFechaCoordIso
        }
        rows.push(row)
      } else if (
        ventaData.fecha_coordinacion !== undefined
        && newFechaCoordIso !== oldFechaCoordIso
      ) {
        rows.push({
          oficinista_id: user.id,
          venta_id: id,
          action_type: 'coordinacion_set',
          fecha_coordinacion_set: newFechaCoordIso,
          metadata: {},
        })
      }

      if (
        ventaData.nro_cliente !== undefined
        && newNroCliente !== oldNroCliente
        && newNroCliente
      ) {
        rows.push({
          oficinista_id: user.id,
          venta_id: id,
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

  // Reemplazar extras si se enviaron
  if (_extras !== undefined) {
    await client.from('venta_extras').delete().eq('venta_id', id)
    if (Array.isArray(_extras) && _extras.length > 0) {
      await client.from('venta_extras').insert(
        _extras.map((e: any) => ({
          venta_id: id,
          extra_id: e.id,
          precio_snapshot: e.precio,
        })),
      )
    }
  }

  return { success: true }
})
