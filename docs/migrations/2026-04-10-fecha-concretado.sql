-- Migración: fecha_concretado + backfill precio_concretado
-- Fecha: 2026-04-10
-- Descripción:
--   1. Agrega columna fecha_concretado para atribuir ventas al ciclo correcto
--   2. Backfill de fecha_concretado en concretadas existentes (usa fecha_carga)
--   3. Backfill de precio_concretado en ventas >= en_proceso (congela precio)
--   4. Índice parcial para queries de comisiones

-- 1. Nueva columna
ALTER TABLE ventas ADD COLUMN fecha_concretado TIMESTAMPTZ;

-- 2. Backfill fecha_concretado
UPDATE ventas SET fecha_concretado = fecha_carga
WHERE estado = 'concretado' AND fecha_concretado IS NULL;

-- 3. Backfill precio_concretado
UPDATE ventas SET precio_concretado = precio
WHERE estado IN ('en_proceso', 'coordinado', 'concretado') AND precio_concretado IS NULL;

-- 4. Índice
CREATE INDEX idx_ventas_empresa_fecha_concretado
  ON ventas (empresa, fecha_concretado)
  WHERE fecha_concretado IS NOT NULL;
