import { serverSupabaseClient } from '#supabase/server'

// Campos que el admin puede editar en una venta existente. Los campos de precio
// (precio, paquete_*, bocas, decos, *_snapshot) y los inmutables (vendedor_id,
// fecha_carga, empresa) quedan congelados al momento de crear la venta.
// precio_concretado y fecha_concretado se gestionan exclusivamente server-side.
const ALLOWED_EDIT_FIELDS = [
  'cliente', 'dni_cuil', 'telefono', 'mail',
  'dir_calle', 'dir_entre_calles', 'dir_localidad', 'dir_aclaracion',
  'forma_pago', 'cbu', 'nro_tarjeta', 'vencimiento_tarjeta',
  'comentarios_venta', 'comentarios_gestion',
  'estado', 'fecha_coordinacion', 'nro_cliente',
] as const

export default defineEventHandler(async (event) => {
  // Solo admin puede editar todos los campos de una venta
  const { user } = await requireAdmin(event)
  const client = await serverSupabaseClient(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const ventaData: Record<string, any> = {}
  for (const key of ALLOWED_EDIT_FIELDS) {
    if (key in body) ventaData[key] = body[key]
  }

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

  return { success: true }
})
