import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Todos los roles pueden agregar observaciones en cualquier momento
  const { user, profile } = await requireRole(event, ['vendedor', 'lider', 'oficinista', 'admin'])
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { venta_id, texto } = body

  if (!venta_id || !texto?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'venta_id y texto son requeridos' })
  }

  const { error } = await client.rpc('vendedor_add_gestion_comment', {
    p_venta_id: venta_id,
    p_texto: texto.trim(),
  })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  // ─── Activity log (best-effort, oficinistas y admins) ─────────────────
  if (profile.rol === 'oficinista' || profile.rol === 'admin') {
    try {
      const { error: logError } = await client.from('oficinista_activity').insert({
        oficinista_id: user.id,
        venta_id,
        action_type: 'comentario',
        metadata: { comentario_preview: texto.trim().slice(0, 80) },
      })
      if (logError) {
        console.error('[oficinista_activity] log insert failed', logError)
      }
    } catch (err) {
      console.error('[oficinista_activity] log insert threw', err)
    }
  }

  return { success: true }
})
