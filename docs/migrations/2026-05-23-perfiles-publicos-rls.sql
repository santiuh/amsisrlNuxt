-- 2026-05-23-perfiles-publicos-rls.sql
-- Permite que oficinistas y líderes consulten ciclo_pagos y grupos de otros vendedores,
-- necesario para mostrar la sección de perfil de vendedores (/perfil/[id]).
--
-- Estado previo:
--   - profiles: select abierto a cualquier authenticated.
--   - ventas:   ya permitía select a oficinista/admin y a líder por grupo.
--   - ciclo_pagos: solo el propio vendedor y admin podían leer.
--   - grupos: solo admin y el propio líder sobre su grupo.

-- ciclo_pagos: oficinista puede leer todos los pagos
CREATE POLICY "oficinista_select_pagos"
  ON public.ciclo_pagos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'oficinista'
    )
  );

-- ciclo_pagos: lider puede leer pagos de vendedores de su grupo
CREATE POLICY "lider_select_grupo_pagos"
  ON public.ciclo_pagos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'lider'
    )
    AND vendedor_id IN (
      SELECT p.id
      FROM public.profiles p
      JOIN public.grupos g ON p.grupo_id = g.id
      WHERE g.lider_id = auth.uid()
    )
  );

-- grupos: oficinista puede leer todos los grupos (para cálculo de comisiones)
CREATE POLICY "oficinista_select_grupos"
  ON public.grupos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'oficinista'
    )
  );
