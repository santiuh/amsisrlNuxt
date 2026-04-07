-- ============================================================
-- RPC: admin_reset_password
-- Permite al admin resetear la contraseña de cualquier usuario
-- y fuerza must_change_password = true
-- ============================================================
CREATE OR REPLACE FUNCTION admin_reset_password(
  p_user_id UUID,
  p_new_password TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el caller es admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden resetear contraseñas';
  END IF;

  -- Verificar que el usuario objetivo existe
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- Actualizar contraseña en auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = p_user_id;

  -- Forzar cambio de contraseña en próximo login
  UPDATE profiles
  SET must_change_password = true
  WHERE id = p_user_id;
END;
$$;
