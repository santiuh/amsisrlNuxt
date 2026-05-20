-- Permitir a líderes de grupo crear ventas
-- Fecha: 2026-05-20
--
-- La policy ventas_insert solo permitía a vendedor/oficinista/admin.
-- Andrea Cicconi (lider) no podía cargar ventas porque Supabase rechazaba
-- el INSERT por RLS, aunque el endpoint server-side ya la dejaba pasar.
-- Se agrega 'lider' al listado de roles autorizados.

DROP POLICY IF EXISTS ventas_insert ON public.ventas;

CREATE POLICY ventas_insert ON public.ventas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol = ANY (ARRAY['vendedor', 'lider', 'oficinista', 'admin'])
    )
  );
