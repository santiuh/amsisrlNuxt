-- Prospección / Mapa de clientes
-- Tablas: prospectos (casas/contactos trabajados puerta a puerta), prospecto_interacciones
-- (historial append-only de visitas/llamadas/mensajes) y geocode_cache (cache de geocodificación).
-- RPC prospectos_mapa(): capa limitada del mapa visible para TODOS los autenticados
-- (solo columnas seguras — nunca teléfono, nombre del cliente, notas ni dirección exacta).
--
-- Visibilidad de filas completas (RLS): vendedor → propias; líder → propias + su grupo;
-- oficinista/admin → todas. Escrituras vía server/api/prospectos/*.
--
-- Aplicado en Supabase project qdtfmciooezhopcmmrqh el 2026-07-12 vía MCP.

-- ============================================================
-- Tabla principal: prospectos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.prospectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contacto (nombre puede ser null: "casa visitada sin contacto todavía")
  nombre text,
  telefono text,
  canal text NOT NULL DEFAULT 'puerta_a_puerta'
    CHECK (canal IN ('puerta_a_puerta','telefono','whatsapp','instagram','facebook','referido','otro')),

  -- Estado del pipeline de prospección
  estado text NOT NULL DEFAULT 'por_visitar'
    CHECK (estado IN ('por_visitar','ausente','visitado','ofrecido','contratado','perdido','reconectar')),
  motivo_perdida text,

  -- Dirección (espeja los campos dir_* de ventas)
  dir_calle text,
  dir_entre_calles text,
  dir_localidad text,
  dir_aclaracion text,
  lat double precision,
  lng double precision, -- NULL/NULL = "sin ubicar" (pendiente de geocodificar o colocar a mano)

  -- Seguimiento (denormalizados: los mantiene server/api/prospectos/interacciones.post.ts)
  notas text,
  proxima_visita date,
  fecha_ultima_interaccion timestamptz,

  -- Propiedad y conversión
  vendedor_id uuid NOT NULL REFERENCES public.profiles(id),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  venta_id uuid UNIQUE REFERENCES public.ventas(id) ON DELETE SET NULL,
  origen text NOT NULL DEFAULT 'manual' CHECK (origen IN ('manual','importado','venta')),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT perdido_requiere_motivo CHECK (estado <> 'perdido' OR motivo_perdida IS NOT NULL),
  CONSTRAINT coords_completas CHECK ((lat IS NULL) = (lng IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_prospectos_vendedor ON public.prospectos (vendedor_id);
CREATE INDEX IF NOT EXISTS idx_prospectos_estado ON public.prospectos (estado);
CREATE INDEX IF NOT EXISTS idx_prospectos_localidad ON public.prospectos (dir_localidad);
CREATE INDEX IF NOT EXISTS idx_prospectos_proxima_visita
  ON public.prospectos (proxima_visita) WHERE proxima_visita IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospectos_sin_ubicar
  ON public.prospectos (vendedor_id) WHERE lat IS NULL;

-- ============================================================
-- Historial de interacciones (append-only, plantilla oficinista_activity)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.prospecto_interacciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospecto_id uuid NOT NULL REFERENCES public.prospectos(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('visita','llamada','whatsapp','red_social','otro')),
  resultado text CHECK (resultado IN ('ausente','interesado','no_interesado','contratado','reprogramar','otro')),
  estado_resultante text, -- snapshot del estado del prospecto tras esta interacción
  comentario text,
  proxima_visita date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pi_prospecto_created
  ON public.prospecto_interacciones (prospecto_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pi_autor_created
  ON public.prospecto_interacciones (autor_id, created_at DESC);

-- ============================================================
-- Cache de geocodificación (direcciones → coords; dato no sensible)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.geocode_cache (
  direccion text PRIMARY KEY, -- normalizada: lower/trim "calle, localidad, provincia, argentina"
  lat double precision,
  lng double precision,       -- NULL/NULL = "se intentó y no se encontró" (evita reintentos)
  provider text,              -- 'georef' | 'nominatim' | null
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospecto_interacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geocode_cache ENABLE ROW LEVEL SECURITY;

-- ---- prospectos: SELECT (políticas aditivas, patrón ventas/ciclo_pagos) ----

CREATE POLICY "prospectos_select_own"
  ON public.prospectos FOR SELECT TO authenticated
  USING (vendedor_id = auth.uid());

CREATE POLICY "prospectos_select_lider_grupo"
  ON public.prospectos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'lider'
    )
    AND vendedor_id IN (
      SELECT p.id FROM public.profiles p
      JOIN public.grupos g ON p.grupo_id = g.id
      WHERE g.lider_id = auth.uid()
    )
  );

CREATE POLICY "prospectos_select_staff"
  ON public.prospectos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol IN ('admin','oficinista')
    )
  );

-- ---- prospectos: INSERT ----

-- Vendedor/líder solo pueden crear prospectos propios
CREATE POLICY "prospectos_insert_propio"
  ON public.prospectos FOR INSERT TO authenticated
  WITH CHECK (
    vendedor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol IN ('vendedor','lider')
    )
  );

-- Staff puede asignar cualquier vendedor_id (import / desde-ventas)
CREATE POLICY "prospectos_insert_staff"
  ON public.prospectos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol IN ('admin','oficinista')
    )
  );

-- ---- prospectos: UPDATE (espeja SELECT; el WITH CHECK impide que un
--      vendedor/líder reasigne la fila a otro dueño fuera de su alcance) ----

CREATE POLICY "prospectos_update_own"
  ON public.prospectos FOR UPDATE TO authenticated
  USING (vendedor_id = auth.uid())
  WITH CHECK (vendedor_id = auth.uid());

CREATE POLICY "prospectos_update_lider_grupo"
  ON public.prospectos FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'lider'
    )
    AND vendedor_id IN (
      SELECT p.id FROM public.profiles p
      JOIN public.grupos g ON p.grupo_id = g.id
      WHERE g.lider_id = auth.uid()
    )
  )
  WITH CHECK (
    vendedor_id = auth.uid()
    OR vendedor_id IN (
      SELECT p.id FROM public.profiles p
      JOIN public.grupos g ON p.grupo_id = g.id
      WHERE g.lider_id = auth.uid()
    )
  );

CREATE POLICY "prospectos_update_staff"
  ON public.prospectos FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol IN ('admin','oficinista')
    )
  )
  WITH CHECK (true);

-- ---- prospectos: DELETE solo admin ----

CREATE POLICY "prospectos_delete_admin"
  ON public.prospectos FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- ---- prospecto_interacciones: heredan el acceso del prospecto ----
-- La subquery a prospectos corre bajo el RLS del usuario actual,
-- así que own/grupo/staff se hereda sin duplicar lógica.

CREATE POLICY "pi_select"
  ON public.prospecto_interacciones FOR SELECT TO authenticated
  USING (prospecto_id IN (SELECT id FROM public.prospectos));

CREATE POLICY "pi_insert"
  ON public.prospecto_interacciones FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid()
    AND prospecto_id IN (SELECT id FROM public.prospectos)
  );

-- Sin UPDATE / DELETE → append-only.

-- ---- geocode_cache: abierto a authenticated (direcciones→coords públicas) ----

CREATE POLICY "gc_select" ON public.geocode_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "gc_insert" ON public.geocode_cache FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "gc_update" ON public.geocode_cache FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- RPC prospectos_mapa(): capa limitada del mapa
-- ============================================================
-- ⚠️ SECURITY DEFINER: expone pines de TODOS los prospectos a cualquier usuario
-- autenticado. SOLO columnas seguras (posición, estado, fechas, vendedor, localidad).
-- NUNCA agregar acá teléfono, nombre del cliente, notas ni dirección exacta:
-- cualquier columna nueva debe revisarse contra la política de visibilidad.
-- El flag acceso_completo le indica al cliente si puede pedir la fila completa
-- vía SELECT normal (bajo RLS).

CREATE OR REPLACE FUNCTION public.prospectos_mapa()
RETURNS TABLE (
  id uuid,
  lat double precision,
  lng double precision,
  estado text,
  fecha_ultima_interaccion timestamptz,
  proxima_visita date,
  vendedor_id uuid,
  vendedor_nombre text,
  localidad text,
  acceso_completo boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.lat,
    p.lng,
    p.estado,
    p.fecha_ultima_interaccion,
    p.proxima_visita,
    p.vendedor_id,
    pr.nombre AS vendedor_nombre,
    p.dir_localidad AS localidad,
    (
      p.vendedor_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles me
        WHERE me.id = auth.uid() AND me.rol IN ('admin','oficinista')
      )
      OR p.vendedor_id IN (
        SELECT m.id FROM profiles m
        JOIN grupos g ON m.grupo_id = g.id
        WHERE g.lider_id = auth.uid()
      )
    ) AS acceso_completo
  FROM prospectos p
  LEFT JOIN profiles pr ON pr.id = p.vendedor_id
  WHERE p.lat IS NOT NULL
    AND p.lng IS NOT NULL
    AND auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.prospectos_mapa() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prospectos_mapa() FROM anon;
GRANT EXECUTE ON FUNCTION public.prospectos_mapa() TO authenticated;
