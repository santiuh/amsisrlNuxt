import { serverSupabaseClient } from '#supabase/server'
import type { RunSql } from '~~/server/utils/asistente'

/**
 * POST /api/asistente/chat — Asistente IA del admin.
 *
 * Body: { messages: [{ role: 'user'|'assistant', text }] }
 * Respuesta: { ok: true, reply, consultas }
 *
 * Solo admins (requireAdmin). El modelo (Gemini) genera consultas SELECT que
 * se ejecutan vía la RPC chatbot_sql con el JWT del propio admin: la función
 * vuelve a validar el rol y corre con un usuario de base de solo lectura que
 * no puede ver CBU ni tarjetas (docs/migrations/2026-07-27-asistente-chatbot.sql).
 *
 * Rate limit en memoria: 15 mensajes/min por usuario (cada mensaje puede
 * disparar varias consultas SQL + llamadas al modelo).
 */

const RATE_LIMIT_POR_MINUTO = 15
const ventanas = new Map<string, { count: number; resetAt: number }>()

function permitirMensaje(userId: string): boolean {
  const ahora = Date.now()
  const ventana = ventanas.get(userId)
  if (!ventana || ventana.resetAt <= ahora) {
    ventanas.set(userId, { count: 1, resetAt: ahora + 60_000 })
    return true
  }
  ventana.count++
  return ventana.count <= RATE_LIMIT_POR_MINUTO
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  // Mismo saneo que Solcito en soldemayosoft: un BOM o espacio invisible en la
  // env var rompe el header HTTP hacia Gemini.
  const apiKey = (config.geminiApiKey || '').replace(/^\uFEFF/, '').trim()
  if (!apiKey) {
    throw createError({ statusCode: 503, statusMessage: 'Asistente no configurado (falta GEMINI_API_KEY)' })
  }

  const { profile } = await requireAdmin(event)

  if (!permitirMensaje(profile.id)) {
    throw createError({ statusCode: 429, statusMessage: 'Demasiados mensajes, esperá un minuto' })
  }

  const body = await readBody<{ messages?: unknown }>(event).catch(() => null)
  const messages = normalizeChatMessages(body?.messages)
  if (!messages) {
    throw createError({ statusCode: 400, statusMessage: 'Mensajes inválidos' })
  }

  // El client usa el JWT del admin: chatbot_sql valida el rol de nuevo en la
  // base. Los errores SQL vuelven como { error } para que el modelo corrija.
  const client = await serverSupabaseClient(event)
  const runSql: RunSql = async (sql) => {
    const { data, error } = await client.rpc('chatbot_sql', { p_sql: sql })
    if (error) return { error: error.message }
    return data
  }

  const system = buildAsistenteSystemPrompt({
    nombre: profile.nombre?.trim().split(/\s+/)[0] ?? null,
  })

  try {
    const out = await runAsistente({
      apiKey,
      model: config.geminiModel,
      system,
      messages,
      runSql,
    })
    return { ok: true as const, reply: out.reply, consultas: out.consultas }
  } catch (err) {
    console.error('[asistente] fallo llamando a Gemini:', err)
    // Rate limit de Gemini con los reintentos agotados: mensaje más accionable
    if ((err as { geminiStatus?: number } | null)?.geminiStatus === 429) {
      throw createError({ statusCode: 503, statusMessage: 'El asistente está saturado en este momento' })
    }
    throw createError({ statusCode: 502, statusMessage: 'El asistente no está disponible en este momento' })
  }
})
