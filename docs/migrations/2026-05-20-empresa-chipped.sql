-- ============================================================
-- Migración: Agregar empresa "Chipped" (tercera empresa)
-- Fecha: 2026-05-20
-- Descripción: Suma 'chipped' como valor permitido en todas las
--   tablas con CHECK constraint sobre empresa, agrega flag
--   puede_vender_chipped en profiles, clona la configuracion
--   de Express → Chipped y actualiza los RPCs de admin para
--   aceptar el nuevo flag.
-- ============================================================

-- 1. Drop + readd CHECK constraints con 'chipped' incluido
ALTER TABLE ventas DROP CONSTRAINT IF EXISTS ventas_empresa_check;
ALTER TABLE ventas ADD CONSTRAINT ventas_empresa_check
  CHECK (empresa IN ('express', 'ultra', 'chipped'));

ALTER TABLE paquetes DROP CONSTRAINT IF EXISTS paquetes_empresa_check;
ALTER TABLE paquetes ADD CONSTRAINT paquetes_empresa_check
  CHECK (empresa IN ('express', 'ultra', 'chipped'));

ALTER TABLE extras DROP CONSTRAINT IF EXISTS extras_empresa_check;
ALTER TABLE extras ADD CONSTRAINT extras_empresa_check
  CHECK (empresa IN ('express', 'ultra', 'chipped'));

ALTER TABLE ciclos_comision DROP CONSTRAINT IF EXISTS ciclos_comision_empresa_check;
ALTER TABLE ciclos_comision ADD CONSTRAINT ciclos_comision_empresa_check
  CHECK (empresa IN ('express', 'ultra', 'chipped'));

ALTER TABLE ciclo_pagos DROP CONSTRAINT IF EXISTS ciclo_pagos_empresa_check;
ALTER TABLE ciclo_pagos ADD CONSTRAINT ciclo_pagos_empresa_check
  CHECK (empresa IN ('express', 'ultra', 'chipped'));

ALTER TABLE configuracion DROP CONSTRAINT IF EXISTS configuracion_empresa_check;
ALTER TABLE configuracion ADD CONSTRAINT configuracion_empresa_check
  CHECK (empresa IN ('express', 'ultra', 'chipped'));

-- 2. Agregar flag puede_vender_chipped a profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS puede_vender_chipped BOOLEAN NOT NULL DEFAULT false;

-- 3. Clonar configuracion existente para Chipped (mismos valores iniciales que Express)
INSERT INTO configuracion (clave, valor, empresa, updated_at)
SELECT clave, valor, 'chipped', updated_at
FROM configuracion
WHERE empresa = 'express'
ON CONFLICT (clave, empresa) DO NOTHING;

-- ============================================================
-- 4. Actualizar RPC: admin_create_user
-- (DROP previo para evitar overloading; CREATE OR REPLACE no
--  permite agregar parámetros sin crear una nueva firma)
-- ============================================================
DROP FUNCTION IF EXISTS admin_create_user(TEXT, TEXT, TEXT, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_nombre TEXT,
  p_rol TEXT,
  p_puede_vender_ultra BOOLEAN DEFAULT false,
  p_puede_vender_chipped BOOLEAN DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden crear usuarios';
  END IF;

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

  UPDATE profiles
  SET nombre = p_nombre,
      rol = p_rol,
      must_change_password = true,
      puede_vender_ultra = p_puede_vender_ultra,
      puede_vender_chipped = p_puede_vender_chipped
  WHERE id = v_user_id;
END;
$$;

-- ============================================================
-- 5. Actualizar RPC: admin_update_profile
-- (Mismo motivo: drop previo de la firma vieja)
-- ============================================================
DROP FUNCTION IF EXISTS admin_update_profile(UUID, TEXT, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION admin_update_profile(
  p_user_id UUID,
  p_nombre TEXT,
  p_rol TEXT,
  p_puede_vender_ultra BOOLEAN DEFAULT false,
  p_puede_vender_chipped BOOLEAN DEFAULT false
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
      puede_vender_ultra = p_puede_vender_ultra,
      puede_vender_chipped = p_puede_vender_chipped
  WHERE id = p_user_id;
END;
$$;
