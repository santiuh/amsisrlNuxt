import { serverSupabaseClient } from '#supabase/server'

// Toggle del flag whatsapp_enviado_en sobre una venta.
// Permitido a oficinistas y admins, solo si la venta está en `en_proceso`
// o `en_conflicto`. Idempotente: marcar dos veces seguidas no acumula.
// Registra el cambio en `comentarios_gestion` (visible en HistorialGestion)
// y, si el actor es oficinista, también en `oficinista_activity` (para métricas).
export default defineEventHandler(async (event) => {
  const { user, profile } = await requireRole(event, ['oficinista', 'admin'])
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { venta_id, enviado } = body as { venta_id?: string; enviado?: boolean }

  if (!venta_id || typeof enviado !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'venta_id y enviado (boolean) son requeridos' })
  }

  const { data: current, error: readError } = await client
    .from('ventas')
    .select('estado, comentarios_gestion, whatsapp_enviado_en')
    .eq('id', venta_id)
    .single()

  if (readError || !current) {
    throw createError({ statusCode: 404, statusMessage: 'Venta no encontrada' })
  }

  if (!['en_proceso', 'en_conflicto'].includes(current.estado)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Solo se puede marcar WhatsApp en ventas en estado EN PROCESO o EN CONFLICTO',
    })
  }

  const yaEnviado = !!current.whatsapp_enviado_en
  // Idempotencia: si el estado deseado coincide con el actual, no escribimos.
  if (enviado === yaEnviado) {
    return { success: true, whatsapp_enviado_en: current.whatsapp_enviado_en }
  }

  const ahora = new Date().toISOString()
  const newValue = enviado ? ahora : null

  const logActual: any[] = Array.isArray(current.comentarios_gestion)
    ? current.comentarios_gestion
    : []
  const nuevaEntrada = {
    fecha_hora: ahora,
    autor: profile.nombre ?? 'Sistema',
    tipo: 'whatsapp',
    texto: enviado ? 'WhatsApp marcado como enviado' : 'WhatsApp desmarcado',
  }

  const { error: updateError } = await client
    .from('ventas')
    .update({
      whatsapp_enviado_en: newValue,
      comentarios_gestion: [nuevaEntrada, ...logActual],
    })
    .eq('id', venta_id)

  if (updateError) {
    throw createError({ statusCode: 400, statusMessage: updateError.message })
  }

  // ─── Activity log (best-effort, solo oficinistas por RLS) ────────────
  if (profile.rol === 'oficinista') {
    try {
      const { error: logError } = await client.from('oficinista_activity').insert({
        oficinista_id: user.id,
        venta_id,
        action_type: 'whatsapp_toggle',
        metadata: { enviado },
      })
      if (logError) {
        console.error('[oficinista_activity] whatsapp_toggle insert failed', logError)
      }
    } catch (err) {
      console.error('[oficinista_activity] whatsapp_toggle insert threw', err)
    }
  }

  return { success: true, whatsapp_enviado_en: newValue }
})
