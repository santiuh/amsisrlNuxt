-- =============================================================================
-- Asistente IA (chatbot admin-only): rol de solo lectura + RPC chatbot_sql
-- =============================================================================
-- El asistente del panel admin (/admin/asistente) genera consultas SELECT con
-- Gemini y las ejecuta a través de la función chatbot_sql(). Seguridad en capas:
--
--   1. El endpoint Nitro (server/api/asistente/chat.post.ts) exige rol admin
--      con requireAdmin() antes de llamar a Gemini o a esta función.
--   2. La función vuelve a validar que auth.uid() sea un perfil admin.
--   3. Solo acepta UNA sentencia SELECT/WITH (sin ';' intermedios) y rechaza
--      funciones peligrosas por denylist.
--   4. La función es SECURITY DEFINER con OWNER chatbot_readonly: todo lo que
--      ejecuta corre con ese rol, que SOLO tiene GRANT SELECT sobre columnas
--      permitidas. Las columnas de pago de ventas (cbu, nro_tarjeta,
--      vencimiento_tarjeta) quedan afuera — el asistente no puede leerlas
--      aunque el modelo lo intente. Por eso "SELECT *" sobre ventas falla:
--      hay que nombrar columnas. (No se usa SET ROLE: Postgres lo prohíbe
--      dentro de funciones SECURITY DEFINER; la propiedad del rol logra lo
--      mismo sin excepciones.)
--   5. Máximo 200 filas por consulta. El statement_timeout=8s que ya tiene el
--      rol authenticated acota el tiempo total de la llamada RPC.
--
-- El rol chatbot_readonly no tiene login y nadie es miembro de él (salvo
-- postgres, para administrarlo), así que sus políticas RLS "using (true)" no
-- abren datos a nadie más: a ese rol solo se llega pasando por el chequeo de
-- admin de la función.

-- -----------------------------------------------------------------------------
-- 1. Rol de solo lectura
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'chatbot_readonly') then
    create role chatbot_readonly nologin;
  end if;
end $$;

-- postgres necesita ser miembro para poder asignarle la propiedad de la función
grant chatbot_readonly to postgres;

grant usage on schema public to chatbot_readonly;

-- Tablas completas (no tienen datos de pago)
grant select on public.profiles               to chatbot_readonly;
grant select on public.grupos                 to chatbot_readonly;
grant select on public.paquetes               to chatbot_readonly;
grant select on public.extras                 to chatbot_readonly;
grant select on public.venta_extras           to chatbot_readonly;
grant select on public.configuracion          to chatbot_readonly;
grant select on public.ciclos_comision        to chatbot_readonly;
grant select on public.ciclo_pagos            to chatbot_readonly;
grant select on public.oficinista_activity    to chatbot_readonly;
grant select on public.prospectos             to chatbot_readonly;
grant select on public.prospecto_interacciones to chatbot_readonly;
grant select on public.venta_lecturas         to chatbot_readonly;

-- ventas: columnas explícitas — quedan AFUERA cbu, nro_tarjeta y
-- vencimiento_tarjeta. Si se agregan columnas nuevas a ventas y el asistente
-- debe verlas, hay que sumarlas acá.
grant select (
  id, vendedor_id, fecha_carga, cliente, dni_cuil, telefono, mail, nro_cliente,
  dir_calle, dir_entre_calles, dir_localidad, dir_aclaracion,
  empresa, paquete_id, paquete_nombre, paquete_precio_snapshot,
  bocas, precio_boca_extra_snapshot, decos, precio_deco_extra_snapshot,
  precio, precio_concretado, forma_pago, estado,
  fecha_coordinacion, fecha_concretado, whatsapp_enviado_en,
  comentarios_venta, comentarios_gestion, created_at
) on public.ventas to chatbot_readonly;

-- -----------------------------------------------------------------------------
-- 2. Políticas RLS para el rol del asistente
-- -----------------------------------------------------------------------------
-- Las políticas existentes aplican al rol "authenticated"; chatbot_readonly
-- necesita las suyas. "using (true)" es seguro: a este rol solo se llega vía
-- chatbot_sql(), que ya validó que quien llama es admin (y un admin ve todo).
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'grupos', 'paquetes', 'extras', 'venta_extras',
    'configuracion', 'ciclos_comision', 'ciclo_pagos', 'oficinista_activity',
    'prospectos', 'prospecto_interacciones', 'venta_lecturas', 'ventas'
  ] loop
    execute format('drop policy if exists chatbot_select on public.%I', t);
    execute format(
      'create policy chatbot_select on public.%I for select to chatbot_readonly using (true)', t
    );
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Función RPC
-- -----------------------------------------------------------------------------
create or replace function public.chatbot_sql(p_sql text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text;
  v_sql text;
  v_result jsonb;
begin
  -- Solo admins. Se lee el claim "sub" del JWT directo del GUC (es lo mismo
  -- que hace auth.uid()) para no darle al rol acceso al schema auth. La
  -- función corre como chatbot_readonly (owner), que ve profiles gracias a su
  -- política RLS propia.
  v_uid := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub';
  if v_uid is null or not exists (
    select 1 from public.profiles where id::text = v_uid and rol = 'admin'
  ) then
    raise exception 'Solo disponible para administradores';
  end if;

  v_sql := btrim(coalesce(p_sql, ''));
  v_sql := regexp_replace(v_sql, ';\s*$', '');  -- ';' final inofensivo

  if v_sql = '' then
    return jsonb_build_object('error', 'Consulta vacía');
  end if;
  if v_sql !~* '^\s*(select|with)\M' then
    return jsonb_build_object('error', 'Solo se permiten consultas SELECT (o WITH ... SELECT)');
  end if;
  if position(';' in v_sql) > 0 then
    return jsonb_build_object('error', 'Solo se permite una única sentencia, sin ";"');
  end if;
  -- Denylist defensiva: el rol de solo lectura es la barrera real, esto evita
  -- abusos de funciones que no dependen de permisos de tabla.
  if v_sql ~* '\m(set_config|set\s+role|pg_sleep|pg_read_file|pg_ls_dir|pg_stat_file|dblink|pg_terminate_backend|pg_cancel_backend|lo_import|lo_export)\M' then
    return jsonb_build_object('error', 'Consulta no permitida');
  end if;

  -- La consulta corre como chatbot_readonly (owner de la función):
  -- DML/DDL fallan por falta de permisos.
  execute 'select coalesce(jsonb_agg(_fila), ''[]''::jsonb) '
       || 'from (select * from (' || v_sql || ') _q limit 200) _fila'
    into v_result;

  return jsonb_build_object('rows', v_result, 'row_limit', 200);
exception
  when others then
    -- El error vuelve como dato (no como excepción HTTP): el modelo lo lee,
    -- corrige el SQL y reintenta.
    return jsonb_build_object('error', sqlerrm);
end;
$$;

-- El dueño define con qué permisos ejecuta (SECURITY DEFINER). Cambiar el
-- owner exige que el nuevo dueño tenga CREATE en el schema: se otorga solo
-- para la transferencia y se revoca enseguida.
grant create on schema public to chatbot_readonly;
alter function public.chatbot_sql(text) owner to chatbot_readonly;
revoke create on schema public from chatbot_readonly;

-- Solo usuarios logueados pueden ejecutarla (y adentro se exige admin)
revoke all on function public.chatbot_sql(text) from public;
revoke all on function public.chatbot_sql(text) from anon;
grant execute on function public.chatbot_sql(text) to authenticated;
