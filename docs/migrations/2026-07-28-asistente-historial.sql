-- =============================================================================
-- Historial auditable del Asistente IA
-- =============================================================================
-- El asistente (/admin/asistente) no dejaba registro: las conversaciones vivían
-- solo en el sessionStorage del navegador de cada admin. Esta tabla guarda cada
-- intercambio (pregunta del admin + respuesta del bot + las SQL que ejecutó)
-- para que el dueño pueda auditar el uso ("controlar que no haya mal uso").
--
-- Decisiones (Santiago, 2026-07-28):
--   * El chat NO cambia: registro write-only desde el endpoint; el modelo sigue
--     recibiendo el mismo historial de siempre (mismos tokens).
--   * El historial lo ve SOLO la cuenta auditora (Sol de Mayo Soft). Los demás
--     admins insertan sus filas al chatear pero no pueden leer ninguna.
--   * Se guarda el TEXTO de cada SQL, no sus resultados. chatbot_sql ya impide
--     referenciar ventas.cbu / nro_tarjeta / vencimiento_tarjeta, así que el
--     SQL almacenado no puede exponer datos de pago.
--
-- Aplicado en Supabase project qdtfmciooezhopcmmrqh el 2026-07-28 vía MCP.

CREATE TABLE IF NOT EXISTS public.asistente_mensajes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  texto text NOT NULL,
  error boolean NOT NULL DEFAULT false,
  consultas int,      -- solo assistant: nº de consultas SQL ejecutadas
  sqls jsonb,         -- solo assistant: array con el texto de cada SQL ejecutada
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_am_user_created ON public.asistente_mensajes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_am_created ON public.asistente_mensajes (created_at DESC);

ALTER TABLE public.asistente_mensajes ENABLE ROW LEVEL SECURITY;

-- SELECT: SOLO la cuenta auditora (Sol de Mayo Soft). Si algún día cambia la
-- cuenta, actualizar este uuid y AUDITOR_PROFILE_ID en app/utils/auditoria.ts.
CREATE POLICY "auditor_select" ON public.asistente_mensajes
  FOR SELECT TO authenticated
  USING (auth.uid() = 'bb381144-a60b-404d-9401-15ef65a3cda3'::uuid);

-- INSERT: cada admin registra sus propias filas (lo hace el endpoint del chat
-- con el JWT del propio admin).
CREATE POLICY "admin_insert_self" ON public.asistente_mensajes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Sin UPDATE / DELETE → append-only (auditoría inmutable desde la app).
