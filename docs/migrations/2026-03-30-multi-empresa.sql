-- ============================================================
-- Migración: Soporte Multi-Empresa (Express + Ultra)
-- Fecha: 2026-03-30
-- Descripción: Agrega columna 'empresa' a tablas relevantes,
--   flag 'puede_vender_ultra' a profiles, y modifica configuracion
--   para soportar config por empresa.
-- ============================================================

-- 1. Agregar columna empresa a ventas
ALTER TABLE ventas
  ADD COLUMN empresa TEXT NOT NULL DEFAULT 'express'
  CHECK (empresa IN ('express', 'ultra'));

-- 2. Agregar columna empresa a paquetes
ALTER TABLE paquetes
  ADD COLUMN empresa TEXT NOT NULL DEFAULT 'express'
  CHECK (empresa IN ('express', 'ultra'));

-- 3. Agregar columna empresa a extras
ALTER TABLE extras
  ADD COLUMN empresa TEXT NOT NULL DEFAULT 'express'
  CHECK (empresa IN ('express', 'ultra'));

-- 4. Agregar columna empresa a ciclos_comision
ALTER TABLE ciclos_comision
  ADD COLUMN empresa TEXT NOT NULL DEFAULT 'express'
  CHECK (empresa IN ('express', 'ultra'));

-- 5. Agregar columna empresa a ciclo_pagos
ALTER TABLE ciclo_pagos
  ADD COLUMN empresa TEXT NOT NULL DEFAULT 'express'
  CHECK (empresa IN ('express', 'ultra'));

-- 6. Agregar puede_vender_ultra a profiles
ALTER TABLE profiles
  ADD COLUMN puede_vender_ultra BOOLEAN NOT NULL DEFAULT false;

-- 7. Modificar configuracion: agregar empresa y cambiar PK
ALTER TABLE configuracion
  ADD COLUMN empresa TEXT NOT NULL DEFAULT 'express'
  CHECK (empresa IN ('express', 'ultra'));

ALTER TABLE configuracion DROP CONSTRAINT configuracion_pkey;
ALTER TABLE configuracion ADD PRIMARY KEY (clave, empresa);

-- Duplicar config existente para Ultra (mismos valores iniciales)
INSERT INTO configuracion (clave, valor, empresa, updated_at)
SELECT clave, valor, 'ultra', updated_at
FROM configuracion
WHERE empresa = 'express';

-- 8. Índices para performance
CREATE INDEX idx_ventas_empresa ON ventas (empresa);
CREATE INDEX idx_paquetes_empresa ON paquetes (empresa);
CREATE INDEX idx_extras_empresa ON extras (empresa);
CREATE INDEX idx_ciclos_empresa ON ciclos_comision (empresa);

-- Solo un ciclo activo por empresa
CREATE UNIQUE INDEX idx_ciclos_empresa_activo
  ON ciclos_comision (empresa)
  WHERE estado = 'activo';

-- ============================================================
-- 9. Actualizar RPC: admin_create_user
-- ============================================================
CREATE OR REPLACE FUNCTION admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_nombre TEXT,
  p_rol TEXT,
  p_puede_vender_ultra BOOLEAN DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar que el caller es admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden crear usuarios';
  END IF;

  -- Crear usuario en auth.users
  v_user_id := (
    SELECT id FROM auth.users
    WHERE email = p_email
  );

  IF v_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Ya existe un usuario con ese email';
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, confirmation_token,
    raw_app_meta_data, raw_user_meta_data
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated', p_email,
    crypt(p_password, gen_salt('bf')),
    now(), now(), now(), '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  )
  RETURNING id INTO v_user_id;

  -- El trigger on_auth_user_created ya crea el perfil,
  -- pero actualizamos nombre, rol y puede_vender_ultra
  UPDATE profiles
  SET nombre = p_nombre,
      rol = p_rol,
      must_change_password = true,
      puede_vender_ultra = p_puede_vender_ultra
  WHERE id = v_user_id;
END;
$$;

-- ============================================================
-- 10. Actualizar RPC: admin_update_profile
-- ============================================================
CREATE OR REPLACE FUNCTION admin_update_profile(
  p_user_id UUID,
  p_nombre TEXT,
  p_rol TEXT,
  p_puede_vender_ultra BOOLEAN DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden editar perfiles';
  END IF;

  UPDATE profiles
  SET nombre = p_nombre,
      rol = p_rol,
      puede_vender_ultra = p_puede_vender_ultra
  WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- 11. Actualizar RPC: admin_crear_ciclo (ahora con empresa)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_crear_ciclo(
  p_fecha_cierre_prevista TIMESTAMPTZ,
  p_empresa TEXT DEFAULT 'express'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden crear ciclos';
  END IF;

  -- Verificar que no hay ciclo activo para esta empresa
  IF EXISTS (
    SELECT 1 FROM ciclos_comision
    WHERE estado = 'activo' AND empresa = p_empresa
  ) THEN
    RAISE EXCEPTION 'Ya existe un ciclo activo para esta empresa';
  END IF;

  INSERT INTO ciclos_comision (fecha_inicio, fecha_cierre_prevista, estado, created_by, empresa)
  VALUES (now(), p_fecha_cierre_prevista, 'activo', auth.uid(), p_empresa);
END;
$$;
