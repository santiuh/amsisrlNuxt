-- Arreglar usuarios con campos NULL en auth.users que rompen el login
-- Fecha: 2026-05-21
--
-- Síntoma: usuarios creados por admin no pueden loguearse. GoTrue devuelve
--   500 / "Database error querying schema"
-- Error real (auth logs):
--   error finding user: sql: Scan error on column index 8, name "email_change":
--   converting NULL to string is unsupported
--
-- Causa: la función admin_create_user inserta en auth.users sin setear
-- email_change, email_change_token_new ni recovery_token. Esas columnas en
-- el schema actual de Supabase no tienen DEFAULT, quedan NULL, y el modelo
-- Go de GoTrue las espera como string no-nullable.
--
-- Reportado por: Andrea (Gata Malvada). Usuarios afectados al momento del
-- reporte: frandicampli@hotmail.com, ferfontano@gmail.com, Ferfontano@gmail.com.

-- 1) Data fix: poner '' en cualquier fila con esos campos en NULL.
UPDATE auth.users
SET email_change            = COALESCE(email_change, ''),
    email_change_token_new  = COALESCE(email_change_token_new, ''),
    recovery_token          = COALESCE(recovery_token, '')
WHERE email_change            IS NULL
   OR email_change_token_new  IS NULL
   OR recovery_token          IS NULL;

-- 2) Code fix: actualizar admin_create_user para incluir esas columnas en
-- el INSERT. Mantiene la misma firma para no romper llamadas existentes.
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_password text,
  p_nombre text,
  p_rol text,
  p_puede_vender_ultra boolean DEFAULT false,
  p_puede_vender_chipped boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    email_confirmed_at, created_at, updated_at,
    confirmation_token, recovery_token,
    email_change, email_change_token_new,
    raw_app_meta_data, raw_user_meta_data
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated', p_email,
    crypt(p_password, gen_salt('bf')),
    now(), now(), now(),
    '', '',
    '', '',
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
$function$;
