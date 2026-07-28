/**
 * Asistente IA del admin — cerebro server-side (sin dependencias de Nuxt).
 *
 * El asistente responde preguntas sobre los datos del CRM generando consultas
 * SELECT con Gemini (function calling) y ejecutándolas vía la RPC chatbot_sql
 * (solo lectura, solo admin — ver docs/migrations/2026-07-27-asistente-chatbot.sql).
 *
 * Acá vive lo testeable sin red ni DB:
 *  - normalizeChatMessages: valida/recorta el historial que manda el cliente.
 *  - buildAsistenteSystemPrompt: system prompt con el esquema y las reglas.
 *  - acotarResultado: recorta resultados grandes antes de devolvérselos al modelo.
 *  - runAsistente: loop modelo → consultar_sql → modelo (recibe runSql inyectado,
 *    así se prueba con un mock y el endpoint le pasa la RPC real).
 */

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

export interface AsistenteChatMessage {
  role: 'user' | 'assistant'
  text: string
}

/** Ejecuta un SELECT y devuelve { rows, row_limit } o { error } (nunca lanza). */
export type RunSql = (sql: string) => Promise<unknown>

export interface AsistenteResult {
  reply: string
  /** Cantidad de consultas SQL que hizo el modelo (telemetría liviana). */
  consultas: number
}

interface GeminiFunctionCall {
  name: string
  args?: Record<string, unknown>
}

interface GeminiPart {
  text?: string
  thought?: boolean
  functionCall?: GeminiFunctionCall
  functionResponse?: { name: string; response: unknown }
  thoughtSignature?: string
}

interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

// -----------------------------------------------------------------------------
// Validación del historial que manda el navegador
// -----------------------------------------------------------------------------

export const ASISTENTE_MAX_MESSAGES = 20
export const ASISTENTE_MAX_MESSAGE_CHARS = 2000

/**
 * Valida el historial crudo del body. Devuelve null si el formato no sirve
 * (el endpoint responde 400). Se queda con los últimos ASISTENTE_MAX_MESSAGES,
 * recorta cada texto y exige que la conversación empiece y termine con "user"
 * (Gemini lo requiere).
 */
export function normalizeChatMessages(raw: unknown): AsistenteChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const out: AsistenteChatMessage[] = []
  for (const item of raw.slice(-ASISTENTE_MAX_MESSAGES)) {
    if (!item || typeof item !== 'object') return null
    const role = (item as Record<string, unknown>).role
    const text = (item as Record<string, unknown>).text
    if (role !== 'user' && role !== 'assistant') return null
    if (typeof text !== 'string') return null
    const trimmed = text.trim().slice(0, ASISTENTE_MAX_MESSAGE_CHARS)
    if (!trimmed) continue
    out.push({ role, text: trimmed })
  }
  while (out.length > 0 && out[0]!.role === 'assistant') out.shift()
  if (out.length === 0) return null
  if (out[out.length - 1]!.role !== 'user') return null
  return out
}

// -----------------------------------------------------------------------------
// System prompt: esquema de la base + reglas del negocio
// -----------------------------------------------------------------------------

const ESQUEMA_DB = `
## Esquema de la base (PostgreSQL 17)

### profiles — usuarios del sistema
- id (uuid, PK), nombre (text), email (text), created_at
- rol: 'vendedor' | 'oficinista' | 'lider' | 'admin'. OJO: el rol es un permiso de la interfaz, NO limita quién vende: cualquier perfil (admins y líderes incluidos) puede tener ventas a su nombre, y hay admins con cientos de ventas.
- grupo_id (uuid → grupos.id): grupo al que pertenece un vendedor (los líderes tienen null: lideran vía grupos.lider_id)
- puede_vender_ultra / puede_vender_chipped / puede_vender_fibertec (bool): empresas extra habilitadas (Express la venden todos)

### ventas — el corazón del CRM
- id (uuid), vendedor_id (uuid → profiles.id: quien la vendió; puede ser un perfil de CUALQUIER rol), fecha_carga (timestamptz: cuándo se cargó), created_at
- cliente (text: nombre del cliente), dni_cuil, telefono, mail, nro_cliente (nº de cliente que asigna la empresa proveedora al concretarse)
- dir_calle, dir_entre_calles, dir_localidad, dir_aclaracion (dirección estructurada)
- empresa: 'express' | 'ultra' | 'chipped' | 'fibertec' (proveedora del servicio vendido)
- paquete_id (uuid → paquetes.id), paquete_nombre y paquete_precio_snapshot (copia al momento de la venta)
- bocas (int, default 1) y precio_boca_extra_snapshot; decos (int, default 1) y precio_deco_extra_snapshot
- precio (numeric: precio total calculado al cargar), precio_concretado (numeric: precio final real al concretarse — MUY seguido está null)
- IMPORTANTE para montos: usá SIEMPRE coalesce(precio_concretado, precio). Es la fórmula oficial del sistema para liquidar comisiones. Y ordená con NULLS LAST si ordenás por una columna que puede ser null.
- forma_pago: 'debito' | 'transferencia' | 'efectivo'
- estado: 'pendiente' | 'en_proceso' | 'rechazado' | 'coordinado' | 'concretado' | 'en_conflicto' | 'proxima_zona'
- fecha_coordinacion (timestamptz: instalación agendada), fecha_concretado (timestamptz: cuándo se concretó)
- whatsapp_enviado_en (timestamptz: cuándo se le mandó el WhatsApp de bienvenida al cliente)
- comentarios_venta (text: nota del vendedor)
- comentarios_gestion (jsonb: array de {fecha_hora, autor, tipo, texto} — expandir con jsonb_array_elements si hace falta leerlo)
- PROHIBIDO "SELECT *" en ventas (columnas restringidas: falla con permission denied). Nombrá siempre las columnas.

### grupos — equipos de venta
- id (uuid), lider_id (uuid → profiles.id), created_at
- Los miembros son los profiles con grupo_id = grupos.id

### paquetes / extras — catálogo por empresa
- id, nombre, precio, activo (bool), empresa, created_at

### venta_extras — extras vendidos en cada venta
- venta_id (→ ventas.id), extra_id (→ extras.id), precio_snapshot

### configuracion — parámetros por empresa (PK: clave + empresa)
- claves: 'comision_porcentaje_grupo', 'comision_porcentaje_lider', 'precio_boca_extra', 'precio_deco_extra'

### ciclos_comision — períodos de comisión (independientes por empresa)
- id, empresa, estado ('activo' | 'cerrado'), fecha_inicio (timestamptz), fecha_cierre_prevista (date), fecha_cierre_real (timestamptz), created_by
- Una venta pertenece al ciclo si: fecha_concretado >= fecha_inicio AND fecha_concretado < fecha_cierre_real (ciclo activo: hasta now())

### ciclo_pagos — liquidación por vendedor al cerrar un ciclo
- id, ciclo_id (→ ciclos_comision.id), vendedor_id (→ profiles.id), empresa
- rol_snapshot, grupo_id_snapshot (rol y grupo al momento del cierre)
- cantidad_ventas (concretadas en el ciclo), monto_total_ventas (suma de precio_concretado)
- porcentaje_aplicado, monto_comision, monto_liderazgo (extra que cobra el líder por su grupo), monto_total
- pagado (bool), fecha_pago, pagado_por (→ profiles.id)

### oficinista_activity — log de gestión de las oficinistas sobre ventas
- id, oficinista_id (→ profiles.id), venta_id (→ ventas.id), created_at
- action_type: 'estado_change' | 'coordinacion_set' | 'nro_cliente_set' | 'comentario' | 'whatsapp_toggle'
- from_estado, to_estado (para estado_change), fecha_coordinacion_set, metadata (jsonb)

### prospectos — prospección puerta a puerta (mapa de clientes)
- id, nombre, telefono, vendedor_id (dueño → profiles.id), created_by, created_at, updated_at
- canal: 'puerta_a_puerta' | 'telefono' | 'whatsapp' | 'instagram' | 'facebook' | 'referido' | 'otro'
- estado: 'por_visitar' | 'ausente' | 'visitado' | 'ofrecido' | 'contratado' | 'perdido' | 'reconectar'
- motivo_perdida, notas, proxima_visita (date), fecha_ultima_interaccion
- dir_calle, dir_entre_calles, dir_localidad, dir_aclaracion, lat, lng, ubicacion_aproximada (bool)
- venta_id (→ ventas.id): seteado si el prospecto se convirtió en venta
- origen: 'manual' | 'importado' | 'venta'

### prospecto_interacciones — historial de visitas/llamadas por prospecto
- id, prospecto_id (→ prospectos.id), autor_id, tipo ('visita'|'llamada'|'whatsapp'|'red_social'|'otro'), resultado ('ausente'|'interesado'|'no_interesado'|'contratado'|'reprogramar'|'otro'), estado_resultante, comentario, proxima_visita, created_at

### venta_lecturas — qué usuario vio qué venta y cuándo
- venta_id, user_id, ultima_lectura
`.trim()

export interface AsistentePromptInput {
  /** Nombre de pila del admin (para el trato). */
  nombre?: string | null
  /** Fecha de hoy en Argentina, formato YYYY-MM-DD. */
  hoy?: string
}

/** Arma el system prompt completo del asistente. */
export function buildAsistenteSystemPrompt(input: AsistentePromptInput = {}): string {
  const hoy = input.hoy ?? new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  return [
    'Sos el Asistente IA del CRM de AMSI SRL, una empresa argentina que vende servicios (TV/internet) de las proveedoras Express, Ultra, Chipped y Fibertec a través de vendedores puerta a puerta.',
    `Hablás SOLO con administradores del sistema${input.nombre ? ` (ahora: ${input.nombre})` : ''}. Tu trabajo es responder preguntas sobre los datos del negocio consultando la base con la herramienta consultar_sql.`,
    '',
    `Fecha de hoy en Argentina: ${hoy}.`,
    '',
    '## Cómo trabajar',
    '- SIEMPRE consultá la base antes de afirmar un dato. NUNCA inventes números, nombres ni fechas: todo sale de consultar_sql. Si algo no está en los datos, decilo.',
    '- Nunca anuncies que vas a consultar ni pidas permiso ("¿querés que proceda?"): ejecutá consultar_sql de una y respondé directamente con los datos.',
    '- Para buscar las ventas o comisiones de una persona: encontrá su perfil por nombre (ilike con %) y filtrá ventas.vendedor_id por ese id. NUNCA filtres ni descartes por rol: los admins y los líderes también venden.',
    '- Hacé todas las consultas que necesites (una por vez) antes de responder. Preferí agregaciones en SQL (count, sum, group by) a traer filas crudas.',
    '- Cada consulta devuelve máximo 200 filas. Si un listado puede superar eso, agregá LIMIT u ORDER BY con criterio, o avisá que mostrás un recorte.',
    '- Si una consulta devuelve {"error": ...}, leé el mensaje, corregí el SQL y reintentá.',
    '- Los timestamptz están en UTC. Para "hoy", "este mes" o agrupar por día usá la zona argentina, p. ej.: (fecha_carga AT TIME ZONE \'America/Argentina/Buenos_Aires\')::date',
    '- Comparaciones de texto: usá ilike con % para buscar nombres/localidades (los datos tienen mayúsculas y tildes inconsistentes).',
    '',
    ESQUEMA_DB,
    '',
    '## Conceptos del negocio',
    '- Flujo de una venta: pendiente → en_proceso (la oficina la está gestionando) → coordinado (instalación agendada, ver fecha_coordinacion) → concretado (instalada y activa; se cargan fecha_concretado, precio_concretado y nro_cliente). También: rechazado, en_conflicto (el vendedor disputa un rechazo) y proxima_zona (sin cobertura por ahora, queda en espera).',
    '- "Ventas de un mes" en general se mide por fecha_carga, salvo que pidan concretadas (fecha_concretado). Aclarás qué criterio usaste.',
    '- Comisiones: se liquidan por ciclos (ciclos_comision), no por mes calendario, y por empresa. Al cerrar un ciclo se generan los ciclo_pagos por vendedor y se auto-crea el ciclo siguiente. Para el ciclo activo todavía no hay ciclo_pagos: se calcula desde ventas concretadas dentro del ciclo (fecha_concretado >= fecha_inicio del ciclo activo).',
    "- Fórmula de liquidación (la que usa el sistema al cerrar): monto por vendedor = sum(coalesce(precio_concretado, precio)) de sus ventas concretadas del ciclo y la empresa. Porcentaje aplicado: oficinistas, admins y vendedores SIN grupo cobran 100%; vendedores con grupo y líderes cobran configuracion.comision_porcentaje_grupo. El líder cobra además monto_liderazgo = comision_porcentaje_lider % sobre las ventas concretadas de los vendedores de su grupo. En ciclo_pagos los admins solo tienen fila si vendieron algo en el ciclo.",
    '- Prospectos: pipeline de puerta a puerta. Si prospectos.venta_id no es null, ese prospecto terminó en venta.',
    '',
    '## Formato de respuesta',
    '- Español rioplatense, directo y profesional. Andá al grano: primero el dato, después el detalle.',
    '- Usá Markdown simple: **negrita** para cifras clave, tablas para listados, listas con guiones. Nada de HTML.',
    '- Montos en pesos argentinos: $ 1.234.567 (separador de miles con punto, sin decimales salvo que importen).',
    '- Fechas en formato DD/MM/AAAA.',
    '- Si la pregunta es ambigua, asumí lo más razonable, respondé y aclará el supuesto en una línea. Solo repreguntá si es imposible avanzar.',
    '- Si te piden el SQL que usaste, mostralo sin problema.',
    '',
    '## Límites',
    '- Solo temas del CRM y sus datos. Si te preguntan otra cosa, respondé en una oración que solo manejás los datos del sistema.',
    '- No tenés acceso a datos de pago (CBU/tarjetas) — si te los piden, explicá que el asistente no puede leerlos y se ven solo en el detalle de la venta.',
    '- Solo podés LEER: si te piden cambiar/cargar/borrar algo, aclará que eso se hace desde las pantallas del sistema.',
  ].join('\n')
}

// -----------------------------------------------------------------------------
// Recorte de resultados grandes (para no reventar el contexto del modelo)
// -----------------------------------------------------------------------------

export const ASISTENTE_MAX_RESULT_CHARS = 14_000

/**
 * Acota el resultado de una consulta antes de devolvérselo al modelo: si el
 * JSON de las filas supera el límite, va recortando filas a la mitad y lo
 * anota para que el modelo sepa que debe agregar o pedir menos columnas.
 */
export function acotarResultado(result: unknown): Record<string, unknown> {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    return { error: 'La base devolvió una respuesta inválida' }
  }
  const r = result as Record<string, unknown>
  if (!Array.isArray(r.rows)) return r

  let rows = r.rows as unknown[]
  let omitidas = 0
  let json = JSON.stringify(rows)
  while (json.length > ASISTENTE_MAX_RESULT_CHARS && rows.length > 1) {
    const nuevo = Math.max(1, Math.floor(rows.length / 2))
    omitidas += rows.length - nuevo
    rows = rows.slice(0, nuevo)
    json = JSON.stringify(rows)
  }
  if (json.length > ASISTENTE_MAX_RESULT_CHARS) {
    return {
      error:
        'El resultado es demasiado grande para procesarlo. Repetí la consulta con menos columnas o con agregaciones (count/sum/group by).',
    }
  }
  if (omitidas > 0) {
    return {
      ...r,
      rows,
      filas_omitidas_por_tamano: omitidas,
      nota: 'Resultado recortado por tamaño: usá agregaciones o menos columnas para el total real.',
    }
  }
  return r
}

// -----------------------------------------------------------------------------
// Loop de function calling contra Gemini
// -----------------------------------------------------------------------------

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const GEMINI_TIMEOUT_MS = 30_000
/** Rondas máximas de modelo→SQL→modelo por mensaje. */
export const ASISTENTE_MAX_RONDAS = 6
/** Tope duro de consultas SQL por mensaje (las rondas pueden traer varias). */
export const ASISTENTE_MAX_CONSULTAS = 10
const MAX_REPLY_CHARS = 8_000

const TOOL_CONSULTAR_SQL = {
  functionDeclarations: [
    {
      name: 'consultar_sql',
      description:
        'Ejecuta una consulta de SOLO LECTURA sobre la base PostgreSQL del CRM y devuelve las filas como JSON (máximo 200). Ante un error devuelve {"error": "..."} para que corrijas la consulta.',
      parameters: {
        type: 'OBJECT',
        properties: {
          sql: {
            type: 'STRING',
            description:
              'Una única sentencia SELECT (o WITH ... SELECT) de PostgreSQL. Sin punto y coma, sin otras sentencias.',
          },
        },
        required: ['sql'],
      },
    },
  ],
}

interface GeminiCallResult {
  parts: GeminiPart[]
  finishReason: string
}

async function llamarGemini(opts: {
  apiKey: string
  model: string
  system: string
  contents: GeminiContent[]
  conHerramientas: boolean
  timeoutMs?: number
}): Promise<GeminiCallResult> {
  const generationConfig: Record<string, unknown> = {
    // Datos, no creatividad: temperatura baja para SQL y cifras estables.
    temperature: 0.2,
    maxOutputTokens: 8192,
  }
  // Los gemini-2.5 razonan por defecto y el razonamiento consume maxOutputTokens:
  // sin tope, una pregunta compleja gasta todo el presupuesto en "thoughts" y la
  // respuesta llega vacía (MAX_TOKENS sin texto).
  if (opts.model.includes('2.5')) {
    generationConfig.thinkingConfig = { thinkingBudget: 1024 }
  }
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: opts.contents,
    generationConfig,
  }
  if (opts.conHerramientas) body.tools = [TOOL_CONSULTAR_SQL]

  // Un reintento ante rate limit, caída transitoria o corte de red/timeout.
  const MAX_INTENTOS = 2
  for (let intento = 1; ; intento++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? GEMINI_TIMEOUT_MS)
    try {
      let res: Response
      try {
        res = await fetch(`${GEMINI_BASE}/${opts.model}:generateContent`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-goog-api-key': opts.apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify(body),
        })
      } catch (err) {
        // Corte de red o timeout (AbortError): mismo trato que un 5xx transitorio.
        if (intento < MAX_INTENTOS) {
          await new Promise((r) => setTimeout(r, 1500))
          continue
        }
        throw err
      }

      if ((res.status === 429 || res.status >= 500) && intento < MAX_INTENTOS) {
        await new Promise((r) => setTimeout(r, 1500))
        continue
      }
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        const error = new Error(`Gemini respondió ${res.status}: ${detail.slice(0, 300)}`) as Error & { geminiStatus?: number }
        error.geminiStatus = res.status
        throw error
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: GeminiPart[] }; finishReason?: string }>
      }
      const candidato = data.candidates?.[0]
      return {
        parts: candidato?.content?.parts ?? [],
        finishReason: candidato?.finishReason ?? 'desconocido',
      }
    } finally {
      clearTimeout(timer)
    }
  }
}

function extraerTexto(parts: GeminiPart[]): string {
  return parts
    .filter((p) => typeof p.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('')
    .trim()
}

/**
 * Corre el loop completo: el modelo pide consultas con consultar_sql, se
 * ejecutan vía runSql (la RPC chatbot_sql en producción) y el resultado se le
 * devuelve hasta que produce la respuesta final en texto.
 */
export async function runAsistente(opts: {
  apiKey: string
  model: string
  system: string
  messages: AsistenteChatMessage[]
  runSql: RunSql
  maxRondas?: number
}): Promise<AsistenteResult> {
  const contents: GeminiContent[] = opts.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }))
  const maxRondas = opts.maxRondas ?? ASISTENTE_MAX_RONDAS
  let consultas = 0

  for (let ronda = 0; ronda < maxRondas; ronda++) {
    const out = await llamarGemini({
      apiKey: opts.apiKey,
      model: opts.model,
      system: opts.system,
      contents,
      conHerramientas: true,
    })

    const llamadas = out.parts.filter((p) => p.functionCall)
    if (llamadas.length === 0) {
      const texto = extraerTexto(out.parts)
      if (!texto) throw new Error(`Gemini no devolvió texto (${out.finishReason})`)
      return { reply: texto.slice(0, MAX_REPLY_CHARS), consultas }
    }

    // Turno del modelo tal cual vino (conserva thoughtSignature si lo hay) y
    // un turno "user" con la respuesta de cada función.
    contents.push({ role: 'model', parts: out.parts })
    const respuestas: GeminiPart[] = []
    for (const parte of llamadas) {
      const llamada = parte.functionCall!
      let respuesta: Record<string, unknown>
      const sql = typeof llamada.args?.sql === 'string' ? llamada.args.sql : null
      if (llamada.name !== 'consultar_sql' || !sql) {
        respuesta = { error: 'Llamada inválida: usá consultar_sql con el parámetro sql' }
      } else if (consultas >= ASISTENTE_MAX_CONSULTAS) {
        respuesta = {
          error: 'Límite de consultas alcanzado para este mensaje. Respondé con lo que ya tenés.',
        }
      } else {
        consultas++
        respuesta = acotarResultado(await opts.runSql(sql))
      }
      respuestas.push({ functionResponse: { name: llamada.name, response: respuesta } })
    }
    contents.push({ role: 'user', parts: respuestas })
  }

  // Se agotaron las rondas: una última llamada sin herramientas para forzar
  // una respuesta con lo que haya.
  contents.push({
    role: 'user',
    parts: [
      {
        text: 'No podés hacer más consultas por este mensaje. Respondé ahora con la información que ya obtuviste (y aclaralo si quedó incompleta).',
      },
    ],
  })
  const final = await llamarGemini({
    apiKey: opts.apiKey,
    model: opts.model,
    system: opts.system,
    contents,
    conHerramientas: false,
  })
  const texto = extraerTexto(final.parts)
  if (!texto) throw new Error(`Gemini no devolvió texto final (${final.finishReason})`)
  return { reply: texto.slice(0, MAX_REPLY_CHARS), consultas }
}
