# Force Password Change on First Login — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Forzar cambio de contraseña en el primer login de usuarios creados por admin, con toggle show/hide en login y en la página de cambio.

**Architecture:** Columna `must_change_password` en `profiles` seteada por `admin_create_user`. Middleware global `force-password.global.ts` intercepta todas las rutas autenticadas. Página `/cambiar-contrasena` llama RPC `user_change_password` y limpia el flag. Toggle ojo en login y en la nueva página.

**Tech Stack:** Nuxt 4 SPA, @nuxt/ui v2, @nuxtjs/supabase, Supabase Postgres (RPC SECURITY DEFINER)

---

### Task 1: Migración DB — agregar columna must_change_password

**Files:**
- Supabase migration via MCP tool

**Step 1: Aplicar migración**

```sql
ALTER TABLE public.profiles
  ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT false;
```

Usar `apply_migration` con name `add_must_change_password_to_profiles`.

**Step 2: Verificar**

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'must_change_password';
```

Esperado: fila con `boolean`, default `false`.

**Step 3: Commit (no aplica — cambio solo en DB)**

---

### Task 2: Actualizar RPC admin_create_user — setear flag en true

**Files:**
- Supabase RPC via `apply_migration`

**Step 1: Reemplazar función**

Agregar al final del cuerpo de `admin_create_user`, antes del `RETURN`, la línea que setea el flag:

```sql
CREATE OR REPLACE FUNCTION public.admin_create_user(p_email text, p_password text, p_nombre text, p_rol text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_caller_rol TEXT;
  v_user_id UUID;
BEGIN
  SELECT rol INTO v_caller_rol FROM public.profiles WHERE id = auth.uid();
  IF v_caller_rol != 'admin' THEN
    RAISE EXCEPTION 'Solo el administrador puede crear usuarios.';
  END IF;

  IF p_rol NOT IN ('vendedor', 'oficinista', 'lider', 'admin') THEN
    RAISE EXCEPTION 'Rol inválido. Usar vendedor, oficinista, lider o admin.';
  END IF;

  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token, recovery_token,
    email_change_token_new, email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated', 'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('nombre', p_nombre, 'rol', p_rol),
    FALSE, '', '', '', ''
  );

  -- El trigger handle_new_user crea el profile; actualizamos el flag
  UPDATE public.profiles
    SET must_change_password = true
    WHERE id = v_user_id;

  RETURN jsonb_build_object('id', v_user_id, 'email', p_email, 'rol', p_rol);
END;
$function$;
```

Usar `apply_migration` con name `admin_create_user_set_must_change_password`.

**Step 2: Verificar** — crear usuario de prueba desde la UI y chequear en DB:

```sql
SELECT email, must_change_password FROM profiles ORDER BY created_at DESC LIMIT 3;
```

Esperado: usuario nuevo con `must_change_password = true`.

---

### Task 3: Crear RPC user_change_password

**Files:**
- Supabase RPC via `apply_migration`

**Step 1: Crear función**

```sql
CREATE OR REPLACE FUNCTION public.user_change_password(p_new_password text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Validar longitud mínima
  IF length(p_new_password) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres.';
  END IF;

  -- Actualizar contraseña en auth.users
  UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = auth.uid();

  -- Limpiar flag
  UPDATE public.profiles
    SET must_change_password = false
    WHERE id = auth.uid();
END;
$function$;
```

Usar `apply_migration` con name `create_user_change_password_rpc`.

**Step 2: Verificar definición**

```sql
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'user_change_password';
```

---

### Task 4: Actualizar Profile interface

**Files:**
- Modify: `app/composables/useProfile.ts`

**Step 1: Agregar campo**

En la interface `Profile`, agregar debajo de `created_at`:

```ts
must_change_password: boolean
```

Resultado final:

```ts
export interface Profile {
  id: string
  nombre: string
  email: string
  rol: 'vendedor' | 'oficinista' | 'admin' | 'lider'
  grupo_id: string | null
  created_at: string
  must_change_password: boolean
}
```

**Step 2: Commit**

```bash
git add app/composables/useProfile.ts
git commit -m "feat: add must_change_password to Profile interface"
```

---

### Task 5: Crear middleware force-password.global.ts

**Files:**
- Create: `app/middleware/force-password.global.ts`

**Step 1: Escribir middleware**

```ts
export default defineNuxtRouteMiddleware((to) => {
  // Rutas que no requieren el chequeo
  const rutasLibres = ['/login', '/forgot-password', '/new-password', '/cambiar-contrasena']
  if (rutasLibres.some(r => to.path.startsWith(r))) return

  const profile = useCurrentProfile()
  if (!profile.value) return  // No autenticado, otros guards lo manejan

  if (profile.value.must_change_password) {
    return navigateTo('/cambiar-contrasena')
  }
})
```

**Step 2: Commit**

```bash
git add app/middleware/force-password.global.ts
git commit -m "feat: add force-password global middleware"
```

---

### Task 6: Crear página /cambiar-contrasena.vue

**Files:**
- Create: `app/pages/cambiar-contrasena.vue`

**Step 1: Escribir página**

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md px-4">
      <UCard class="shadow-lg">
        <template #header>
          <div class="text-center py-2">
            <h1 class="text-2xl font-bold text-gray-900">AMSI SRL</h1>
            <p class="text-sm text-gray-500 mt-1">Cambiar contraseña</p>
          </div>
        </template>

        <div class="space-y-4">
          <UAlert
            v-if="esPrimerLogin"
            icon="i-heroicons-exclamation-triangle"
            color="amber"
            variant="soft"
            title="Debés cambiar tu contraseña para continuar"
            description="Tu cuenta fue creada con una contraseña genérica. Elegí una nueva contraseña segura."
          />

          <UFormGroup label="Nueva contraseña">
            <UInput
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Mínimo 6 caracteres"
              icon="i-heroicons-lock-closed"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  variant="link"
                  color="gray"
                  :padded="false"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
          </UFormGroup>

          <UFormGroup label="Repetir contraseña">
            <UInput
              v-model="form.confirm"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="Repetí la contraseña"
              icon="i-heroicons-lock-closed"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  :icon="showConfirm ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  variant="link"
                  color="gray"
                  :padded="false"
                  @click="showConfirm = !showConfirm"
                />
              </template>
            </UInput>
          </UFormGroup>

          <UAlert
            v-if="errorMsg"
            icon="i-heroicons-exclamation-circle"
            color="red"
            variant="soft"
            :title="errorMsg"
          />

          <UButton
            block
            :loading="loading"
            label="Guardar contraseña"
            @click="guardar"
          />
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const client = useSupabaseClient()
const profile = useCurrentProfile()
const toast = useToast()

const form = reactive({ password: '', confirm: '' })
const showPassword = ref(false)
const showConfirm = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const esPrimerLogin = computed(() => profile.value?.must_change_password === true)

const guardar = async () => {
  errorMsg.value = ''

  if (form.password.length < 6) {
    errorMsg.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  if (form.password !== form.confirm) {
    errorMsg.value = 'Las contraseñas no coinciden.'
    return
  }

  loading.value = true

  const { error } = await client.rpc('user_change_password', {
    p_new_password: form.password,
  })

  if (error) {
    errorMsg.value = error.message
    loading.value = false
    return
  }

  // Actualizar estado local sin nueva query
  if (profile.value) {
    profile.value.must_change_password = false
  }

  toast.add({ title: 'Contraseña actualizada', color: 'green' })
  loading.value = false
  await navigateTo('/dashboard')
}

useHead({ title: 'Cambiar contraseña — AMSI SRL' })
</script>
```

**Step 2: Commit**

```bash
git add app/pages/cambiar-contrasena.vue
git commit -m "feat: add cambiar-contrasena page with force-change flow"
```

---

### Task 7: Agregar toggle de contraseña en login.vue

**Files:**
- Modify: `app/pages/login.vue`

**Step 1: Agregar ref showPassword y actualizar UInput**

Agregar en `<script setup>` después de `const errorMsg = ref('')`:

```ts
const showPassword = ref(false)
```

Reemplazar el `UFormGroup` de contraseña actual:

```vue
<UFormGroup label="Contraseña">
  <UInput
    v-model="form.password"
    :type="showPassword ? 'text' : 'password'"
    placeholder="••••••••"
    icon="i-heroicons-lock-closed"
    class="w-full"
  >
    <template #trailing>
      <UButton
        :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
        variant="link"
        color="gray"
        :padded="false"
        @click="showPassword = !showPassword"
      />
    </template>
  </UInput>
</UFormGroup>
```

**Step 2: Commit**

```bash
git add app/pages/login.vue
git commit -m "feat: add password visibility toggle to login"
```

---

### Task 8: Push y verificación final

**Step 1: Push a main**

```bash
git push origin main
```

**Step 2: Verificar deploy en Vercel**

Esperar build. Verificar en `amsisrl-nuxt.vercel.app`:
- Login con usuario nuevo (creado desde admin) → redirige a `/cambiar-contrasena` con banner amber
- Cambiar contraseña → entra al dashboard
- Login nuevamente con nueva contraseña → entra directo al dashboard (sin redirect)
- Toggle ojo funciona en login y en página cambio

**Step 3: Verificar en DB**

```sql
SELECT email, must_change_password FROM profiles ORDER BY created_at DESC LIMIT 5;
```

Esperado: usuario que ya cambió → `false`.
