-- Oficinista Activity Log (append-only event table)
-- Registra cada acción relevante que hace una oficinista sobre una venta:
-- cambios de estado, coordinación de turnos, seteo de nro_cliente, y comentarios.
-- Poblado desde server/api/ventas/gestion.put.ts y server/api/ventas/comentario.post.ts.
--
-- Aplicado en Supabase project qdtfmciooezhopcmmrqh el 2026-04-14 vía MCP.
-- Las métricas del dashboard "Actividad de Oficinistas" arrancan desde ese día (sin backfill).

CREATE TABLE IF NOT EXISTS public.oficinista_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oficinista_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  venta_id uuid REFERENCES public.ventas(id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (action_type IN ('estado_change','coordinacion_set','nro_cliente_set','comentario')),
  from_estado text,
  to_estado text,
  fecha_coordinacion_set timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oa_oficinista_created
  ON public.oficinista_activity (oficinista_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_oa_created
  ON public.oficinista_activity (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_oa_venta
  ON public.oficinista_activity (venta_id);

ALTER TABLE public.oficinista_activity ENABLE ROW LEVEL SECURITY;

-- Admin: lectura total
CREATE POLICY "admin_select_all"
  ON public.oficinista_activity
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Oficinista: lectura de sus propias filas (permisivo para futuro)
CREATE POLICY "oficinista_select_own"
  ON public.oficinista_activity
  FOR SELECT
  TO authenticated
  USING (oficinista_id = auth.uid());

-- Oficinista: insertar sobre sí misma
CREATE POLICY "oficinista_insert_self"
  ON public.oficinista_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (
    oficinista_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'oficinista'
    )
  );

-- Sin UPDATE / DELETE → append-only.
