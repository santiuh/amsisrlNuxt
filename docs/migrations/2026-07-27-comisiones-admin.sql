-- =============================================================================
-- Comisiones para admins que venden + backfill de ciclos cerrados
-- =============================================================================
-- Problema: cualquier perfil puede cargar ventas (server/api/ventas/index.post.ts
-- las estampa con su vendedor_id), pero admin_cerrar_ciclo solo liquidaba
-- vendedores/oficinistas/líderes. Adrián (admin) acumuló 230 concretadas en 17
-- ciclos cerrados (6 Chipped + 11 Ultra, $4.010.000) sin fila de liquidación.
--
-- Regla nueva (decisión del dueño, 2026-07-27):
--   * Un admin que vende cobra el 100% (igual que oficinistas y vendedores sin grupo).
--   * Los admins SOLO generan fila en ciclo_pagos si vendieron algo en el ciclo
--     (evita filas en cero para las cuentas admin en cada cierre).
--   * Backfill de ciclos ya cerrados con pagado=false: esos pagos se hicieron por
--     fuera del sistema y se marcan a mano desde /admin/comisiones. NO se inventa
--     fecha_pago.
--
-- Idempotente: CREATE OR REPLACE pisa la función y el INSERT del backfill tiene
-- guarda NOT EXISTS + ON CONFLICT (ciclo_id, vendedor_id) DO NOTHING.

CREATE OR REPLACE FUNCTION public.admin_cerrar_ciclo(p_ciclo_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_caller_rol TEXT;
  v_ciclo RECORD;
  v_empresa TEXT;
  v_pct_grupo NUMERIC;
  v_pct_lider NUMERIC;
  v_fecha_inicio TIMESTAMPTZ;
  v_ahora TIMESTAMPTZ;
  v_vendedor RECORD;
  v_cant INT;
  v_monto NUMERIC;
  v_pct_aplicado NUMERIC;
BEGIN
  SELECT rol INTO v_caller_rol FROM profiles WHERE id = auth.uid();
  IF v_caller_rol != 'admin' THEN
    RAISE EXCEPTION 'Solo un admin puede cerrar ciclos';
  END IF;

  SELECT * INTO v_ciclo FROM ciclos_comision WHERE id = p_ciclo_id AND estado = 'activo';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ciclo no encontrado o ya está cerrado';
  END IF;

  v_empresa      := v_ciclo.empresa;
  v_fecha_inicio := v_ciclo.fecha_inicio;
  v_ahora        := now();

  SELECT COALESCE(
    (SELECT valor::NUMERIC FROM configuracion
     WHERE clave = 'comision_porcentaje_grupo' AND empresa = v_empresa), 80
  ) INTO v_pct_grupo;

  SELECT COALESCE(
    (SELECT valor::NUMERIC FROM configuracion
     WHERE clave = 'comision_porcentaje_lider' AND empresa = v_empresa), 25
  ) INTO v_pct_lider;

  FOR v_vendedor IN
    SELECT id, rol, grupo_id FROM profiles
    WHERE rol IN ('vendedor', 'oficinista', 'lider', 'admin')
  LOOP
    IF v_vendedor.rol IN ('oficinista', 'admin') THEN
      v_pct_aplicado := 100;
    ELSIF v_vendedor.rol = 'vendedor' AND v_vendedor.grupo_id IS NULL THEN
      v_pct_aplicado := 100;
    ELSE
      v_pct_aplicado := v_pct_grupo;
    END IF;

    -- Usar timestamps exactos para delimitar el ciclo
    SELECT COUNT(*)::INT, COALESCE(SUM(COALESCE(precio_concretado, precio)), 0)
    INTO v_cant, v_monto
    FROM ventas
    WHERE vendedor_id = v_vendedor.id
      AND estado = 'concretado'
      AND empresa = v_empresa
      AND fecha_concretado >= v_fecha_inicio
      AND fecha_concretado < v_ahora;

    -- Los admins solo generan fila si vendieron algo en el ciclo
    IF v_vendedor.rol = 'admin' AND v_cant = 0 THEN
      CONTINUE;
    END IF;

    INSERT INTO ciclo_pagos (
      ciclo_id, vendedor_id, rol_snapshot, grupo_id_snapshot,
      cantidad_ventas, monto_total_ventas, porcentaje_aplicado,
      monto_comision, monto_liderazgo, monto_total, empresa
    ) VALUES (
      p_ciclo_id, v_vendedor.id, v_vendedor.rol, v_vendedor.grupo_id,
      v_cant, v_monto, v_pct_aplicado,
      ROUND(v_monto * v_pct_aplicado / 100, 2), 0,
      ROUND(v_monto * v_pct_aplicado / 100, 2), v_empresa
    );
  END LOOP;

  -- Bonus de liderazgo
  UPDATE ciclo_pagos cp
  SET
    monto_liderazgo = sub.bonus,
    monto_total = cp.monto_comision + sub.bonus
  FROM (
    SELECT
      g.lider_id,
      ROUND(
        COALESCE(SUM(COALESCE(v.precio_concretado, v.precio)), 0) * v_pct_lider / 100, 2
      ) AS bonus
    FROM grupos g
    JOIN profiles p ON p.grupo_id = g.id AND p.rol = 'vendedor'
    LEFT JOIN ventas v ON v.vendedor_id = p.id
      AND v.estado = 'concretado'
      AND v.empresa = v_empresa
      AND v.fecha_concretado >= v_fecha_inicio
      AND v.fecha_concretado < v_ahora
    GROUP BY g.lider_id
  ) sub
  WHERE cp.ciclo_id = p_ciclo_id
    AND cp.vendedor_id = sub.lider_id;

  -- Cerrar ciclo A
  UPDATE ciclos_comision
  SET estado = 'cerrado', fecha_cierre_real = v_ahora
  WHERE id = p_ciclo_id;

  -- Auto-crear ciclo B
  INSERT INTO ciclos_comision (fecha_inicio, fecha_cierre_prevista, estado, created_by, empresa)
  VALUES (v_ahora, (v_ahora + INTERVAL '30 days')::date, 'activo', auth.uid(), v_empresa);
END;
$function$;

-- -----------------------------------------------------------------------------
-- Backfill: ciclos CERRADOS donde un admin vendió pero no tiene fila.
-- Verificado en vivo (2026-07-27): genera exactamente 17 filas, todas de Adrián
-- Arauz — 6 Chipped (42 ventas, $630.000) + 11 Ultra (188 ventas, $3.380.000).
-- created_at = fecha_cierre_real para que el historial ordene cronológico.
-- -----------------------------------------------------------------------------
INSERT INTO ciclo_pagos (
  ciclo_id, vendedor_id, rol_snapshot, grupo_id_snapshot,
  cantidad_ventas, monto_total_ventas, porcentaje_aplicado,
  monto_comision, monto_liderazgo, monto_total, empresa, pagado, created_at
)
SELECT
  c.id, p.id, p.rol, p.grupo_id,
  COUNT(v.id)::INT,
  COALESCE(SUM(COALESCE(v.precio_concretado, v.precio)), 0),
  100,
  ROUND(COALESCE(SUM(COALESCE(v.precio_concretado, v.precio)), 0), 2),
  0,
  ROUND(COALESCE(SUM(COALESCE(v.precio_concretado, v.precio)), 0), 2),
  c.empresa,
  false,
  c.fecha_cierre_real
FROM ciclos_comision c
JOIN profiles p ON p.rol = 'admin'
JOIN ventas v
  ON v.vendedor_id = p.id
 AND v.estado = 'concretado'
 AND v.empresa = c.empresa
 AND v.fecha_concretado >= c.fecha_inicio
 AND v.fecha_concretado < c.fecha_cierre_real
WHERE c.estado = 'cerrado'
  AND NOT EXISTS (
    SELECT 1 FROM ciclo_pagos cp
    WHERE cp.ciclo_id = c.id AND cp.vendedor_id = p.id
  )
GROUP BY c.id, c.empresa, c.fecha_cierre_real, p.id, p.rol, p.grupo_id
HAVING COUNT(v.id) > 0
ON CONFLICT (ciclo_id, vendedor_id) DO NOTHING;
