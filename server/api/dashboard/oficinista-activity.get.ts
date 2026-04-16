import { serverSupabaseClient } from '#supabase/server'

/**
 * Endpoint admin-only para el panel "Actividad del Personal" del dashboard.
 * Devuelve:
 *  - events: filas de oficinista_activity en el rango
 *  - oficinistas: perfiles con rol in ('oficinista','admin') — el personal que opera ventas
 *    (para mostrar incluso a quien tenga 0 actividad en el rango)
 *  - ventasAbiertas: ventas actualmente en en_proceso/coordinado (para calcular carga actual)
 *  - ventasContext: info mínima de cada venta referenciada en los events (para mostrar cliente/localidad en el feed)
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = await serverSupabaseClient(event)

  const query = getQuery(event)
  const from = typeof query.from === 'string' ? query.from : null
  const to = typeof query.to === 'string' ? query.to : null
  const oficinistaId = typeof query.oficinista_id === 'string' && query.oficinista_id
    ? query.oficinista_id
    : null

  if (!from || !to) {
    throw createError({ statusCode: 400, statusMessage: 'from y to son requeridos (ISO)' })
  }

  let eventsQuery = client
    .from('oficinista_activity')
    .select('id, oficinista_id, venta_id, action_type, from_estado, to_estado, fecha_coordinacion_set, metadata, created_at')
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: false })
    .limit(5000)

  if (oficinistaId) {
    eventsQuery = eventsQuery.eq('oficinista_id', oficinistaId)
  }

  const [eventsRes, oficinistasRes, ventasRes] = await Promise.all([
    eventsQuery,
    client.from('profiles').select('id, nombre, rol, avatar_config').in('rol', ['oficinista', 'admin']),
    client.from('ventas').select('id, estado').in('estado', ['en_proceso', 'coordinado']),
  ])

  if (eventsRes.error) {
    throw createError({ statusCode: 500, statusMessage: eventsRes.error.message })
  }
  if (oficinistasRes.error) {
    throw createError({ statusCode: 500, statusMessage: oficinistasRes.error.message })
  }
  if (ventasRes.error) {
    throw createError({ statusCode: 500, statusMessage: ventasRes.error.message })
  }

  // Obtener contexto de ventas referenciadas en los events
  const distinctVentaIds = [...new Set(
    (eventsRes.data ?? []).map(e => e.venta_id).filter(Boolean) as string[],
  )]

  let ventasContext: Record<string, { cliente: string; dir_localidad: string | null; paquete_nombre: string; estado: string; empresa: string }> = {}
  if (distinctVentaIds.length > 0) {
    const { data: ventasCtx } = await client
      .from('ventas')
      .select('id, cliente, dir_localidad, paquete_nombre, estado, empresa')
      .in('id', distinctVentaIds)
    if (ventasCtx) {
      for (const v of ventasCtx) {
        ventasContext[v.id] = {
          cliente: v.cliente,
          dir_localidad: v.dir_localidad,
          paquete_nombre: v.paquete_nombre,
          estado: v.estado,
          empresa: v.empresa,
        }
      }
    }
  }

  return {
    events: eventsRes.data ?? [],
    oficinistas: oficinistasRes.data ?? [],
    ventasAbiertas: ventasRes.data ?? [],
    ventasContext,
  }
})
