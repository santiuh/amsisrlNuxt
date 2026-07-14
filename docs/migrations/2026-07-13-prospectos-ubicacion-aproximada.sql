-- Ubicación aproximada de prospectos
-- Las direcciones cuya calle no existe en los mapas (georef/OSM) — típico de
-- pueblos chicos (Barrancas, Baigorria) — no se pueden geocodificar. En vez de
-- dejarlas "sin ubicar", se colocan en el CENTRO de su localidad con un jitter,
-- marcadas como aproximadas (pin punteado en el mapa), y el vendedor ajusta la
-- posición exacta al pasar. Se colocan vía server/api/prospectos/ubicar-aproximado.
--
-- Aplicado en Supabase project qdtfmciooezhopcmmrqh el 2026-07-13 vía MCP.

ALTER TABLE public.prospectos
  ADD COLUMN IF NOT EXISTS ubicacion_aproximada boolean NOT NULL DEFAULT false;

-- Recrear la RPC de la capa del mapa exponiendo el flag ubicacion_aproximada.
-- ⚠️ Sigue siendo SECURITY DEFINER con SOLO columnas seguras (ver migración
-- 2026-07-12-prospectos-mapa.sql): no agregar acá teléfono/nombre/notas/dir exacta.
DROP FUNCTION IF EXISTS public.prospectos_mapa();

CREATE FUNCTION public.prospectos_mapa()
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
  ubicacion_aproximada boolean,
  acceso_completo boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.lat, p.lng, p.estado, p.fecha_ultima_interaccion, p.proxima_visita,
    p.vendedor_id, pr.nombre AS vendedor_nombre, p.dir_localidad AS localidad,
    p.ubicacion_aproximada,
    (
      p.vendedor_id = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles me WHERE me.id = auth.uid() AND me.rol IN ('admin','oficinista'))
      OR p.vendedor_id IN (SELECT m.id FROM profiles m JOIN grupos g ON m.grupo_id = g.id WHERE g.lider_id = auth.uid())
    ) AS acceso_completo
  FROM prospectos p
  LEFT JOIN profiles pr ON pr.id = p.vendedor_id
  WHERE p.lat IS NOT NULL AND p.lng IS NOT NULL AND auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.prospectos_mapa() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prospectos_mapa() FROM anon;
GRANT EXECUTE ON FUNCTION public.prospectos_mapa() TO authenticated;
