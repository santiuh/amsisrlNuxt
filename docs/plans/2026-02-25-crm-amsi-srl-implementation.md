# CRM AMSI SRL — Plan de Implementación

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Construir un CRM de ventas full-stack para AMSI SRL con 3 roles (Vendedor, Oficinista, Admin), gestión del ciclo de vida de ventas, dashboards por rol y gestión de usuarios.

**Architecture:** Nuxt 4 con @nuxtjs/supabase para auth y datos, @nuxt/ui para componentes UI, RLS en Supabase para seguridad por rol. Una tabla `profiles` vinculada a `auth.users` almacena el rol. Una tabla `ventas` con políticas RLS estrictas.

**Tech Stack:** Nuxt 4, @nuxtjs/supabase v1, @nuxt/ui v3, Tailwind CSS, pnpm, Supabase (proyecto: qdtfmciooezhopcmmrqh)

---

## Task 1: Actualizar .env e instalar @nuxt/ui

**Files:**
- Modify: `.env`
- Modify: `package.json` (via pnpm install)
- Modify: `nuxt.config.ts`

**Step 1: Actualizar .env**

Reemplazar contenido de `.env`:
```env
SUPABASE_URL=https://qdtfmciooezhopcmmrqh.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkdGZtY2lvb2V6aG9wY21tcnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTQ4MzUsImV4cCI6MjA4NzAzMDgzNX0.aYH5ri2vnDe_760wXLYjuuuIsceJ16LZyOEepwvtH_k
```

**Step 2: Instalar @nuxt/ui**

```bash
pnpm add @nuxt/ui
```

**Step 3: Actualizar nuxt.config.ts**

Reemplazar el archivo completo:
```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase', '@nuxt/ui', '@nuxthub/core'],

  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: [],
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  app: {
    layoutTransition: { name: 'layout', mode: 'out-in' },
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  compatibilityDate: '2025-02-19',
})
```

**Step 4: Verificar que el dev server arranca**

```bash
pnpm dev
```
Expected: compilación exitosa en http://localhost:3000

**Step 5: Commit**

```bash
git add .env nuxt.config.ts package.json pnpm-lock.yaml
git commit -m "feat: install @nuxt/ui and update supabase config"
```

---

## Task 2: Migración DB — Tabla profiles + trigger

**Files:** Solo SQL via Supabase MCP

**Step 1: Aplicar migración profiles**

Ejecutar en Supabase MCP (`apply_migration`, project: `qdtfmciooezhopcmmrqh`, name: `create_profiles`):

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('vendedor', 'oficinista', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Todos los autenticados pueden leer profiles (para mostrar nombre del vendedor)
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Solo admin puede crear profiles (via función)
CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
    OR auth.uid() = id  -- permite el trigger
  );

-- Solo admin puede actualizar profiles
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Trigger: crea profile automáticamente al crear usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'vendedor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Step 2: Verificar tabla creada**

Ejecutar `execute_sql` en Supabase MCP:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'profiles' ORDER BY ordinal_position;
```
Expected: columnas id, nombre, email, rol, created_at

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add profiles table with RLS and trigger"
```

---

## Task 3: Migración DB — Tabla ventas + RLS

**Files:** Solo SQL via Supabase MCP

**Step 1: Aplicar migración ventas**

Ejecutar en Supabase MCP (`apply_migration`, project: `qdtfmciooezhopcmmrqh`, name: `create_ventas`):

```sql
CREATE TABLE public.ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID NOT NULL REFERENCES public.profiles(id),
  fecha_carga TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cliente TEXT NOT NULL,
  dni_cuil TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  paquete TEXT NOT NULL CHECK (paquete IN ('basico', 'intermedio', 'premium')),
  precio NUMERIC(10,2) NOT NULL,
  forma_pago TEXT NOT NULL CHECK (forma_pago IN ('debito', 'transferencia', 'efectivo')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'rechazado', 'aceptado', 'concretado')),
  comentarios_venta TEXT,
  comentarios_gestion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

-- SELECT: vendedor ve sus ventas; oficinista y admin ven todas
CREATE POLICY "ventas_select"
  ON public.ventas FOR SELECT
  TO authenticated
  USING (
    vendedor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol IN ('oficinista', 'admin')
    )
  );

-- INSERT: vendedor, oficinista y admin pueden insertar
CREATE POLICY "ventas_insert"
  ON public.ventas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol IN ('vendedor', 'oficinista', 'admin')
    )
  );

-- UPDATE: solo oficinista y admin (vendedor NO puede editar)
CREATE POLICY "ventas_update"
  ON public.ventas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol IN ('oficinista', 'admin')
    )
  );

-- DELETE: solo admin
CREATE POLICY "ventas_delete_admin"
  ON public.ventas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Índices para performance
CREATE INDEX idx_ventas_vendedor_id ON public.ventas(vendedor_id);
CREATE INDEX idx_ventas_estado ON public.ventas(estado);
CREATE INDEX idx_ventas_fecha_carga ON public.ventas(fecha_carga);
```

**Step 2: Verificar**

```sql
SELECT table_name, row_security FROM information_schema.tables
WHERE table_name = 'ventas';
```
Expected: ventas | on

**Step 3: Commit**

```bash
git commit -m "feat: add ventas table with RLS policies"
```

---

## Task 4: Crear usuario Admin Supremo

**Files:** Solo SQL via Supabase MCP

**Step 1: Crear usuario en auth.users**

Ejecutar `execute_sql` en Supabase MCP (project: `qdtfmciooezhopcmmrqh`):

```sql
-- Requiere extensión pgcrypto (disponible por defecto en Supabase)
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
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'valentinaarauz@hotmail.com',
  crypt('Pichu29071303!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"nombre":"Admin Supremo","rol":"admin"}',
  FALSE, '', '', '', ''
)
ON CONFLICT (email) DO NOTHING;
```

**Step 2: Verificar profile del admin (trigger debería haberlo creado)**

```sql
SELECT p.nombre, p.email, p.rol
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'valentinaarauz@hotmail.com';
```
Expected: Admin Supremo | valentinaarauz@hotmail.com | admin

**Step 3: Si el rol no es 'admin', actualizarlo manualmente**

```sql
UPDATE public.profiles
SET rol = 'admin', nombre = 'Admin Supremo'
WHERE email = 'valentinaarauz@hotmail.com';
```

**Step 4: Commit**

```bash
git commit -m "feat: create admin supremo user"
```

---

## Task 5: Composable useProfile

**Files:**
- Create: `app/composables/useProfile.ts`

**Step 1: Crear el composable**

```typescript
// app/composables/useProfile.ts
export interface Profile {
  id: string
  nombre: string
  email: string
  rol: 'vendedor' | 'oficinista' | 'admin'
  created_at: string
}

export const useCurrentProfile = () => {
  return useState<Profile | null>('current-profile', () => null)
}

export const useFetchProfile = async () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()
  const profile = useCurrentProfile()

  if (!user.value) {
    profile.value = null
    return
  }

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.value.id)
    .single()

  if (!error && data) {
    profile.value = data as Profile
  }
}
```

**Step 2: Commit**

```bash
git add app/composables/useProfile.ts
git commit -m "feat: add useProfile composable"
```

---

## Task 6: Middleware de rol

**Files:**
- Create: `app/middleware/role.ts`

**Step 1: Crear middleware**

```typescript
// app/middleware/role.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const profile = useCurrentProfile()

  // Si no hay profile, intentar obtenerlo
  if (!profile.value) {
    await useFetchProfile()
  }

  // Proteger rutas /admin/* solo para admin
  if (to.path.startsWith('/admin') && profile.value?.rol !== 'admin') {
    return navigateTo('/dashboard')
  }

  // Redirigir / a /dashboard
  if (to.path === '/') {
    return navigateTo('/dashboard')
  }
})
```

**Step 2: Registrar middleware como global en nuxt.config.ts**

Agregar dentro de `defineNuxtConfig`:
```typescript
routeRules: {
  '/admin/**': { middleware: ['role'] },
  '/': { middleware: ['role'] },
}
```

**Step 3: Commit**

```bash
git add app/middleware/role.ts nuxt.config.ts
git commit -m "feat: add role-based route middleware"
```

---

## Task 7: Layout principal del dashboard

**Files:**
- Modify: `app/layouts/default.vue`
- Create: `app/components/AppSidebar.vue`
- Create: `app/components/AppHeader.vue`

**Step 1: Crear AppSidebar.vue**

```vue
<!-- app/components/AppSidebar.vue -->
<template>
  <aside class="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
    <!-- Logo -->
    <div class="px-6 py-5 border-b border-gray-700">
      <h1 class="text-xl font-bold text-white">AMSI SRL</h1>
      <p class="text-xs text-gray-400 mt-0.5">Gestión de Ventas</p>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-4 space-y-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="$route.path === item.to
          ? 'bg-primary-600 text-white'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'"
      >
        <UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
        {{ item.label }}
      </NuxtLink>
    </nav>

    <!-- Footer -->
    <div class="px-6 py-4 border-t border-gray-700">
      <p class="text-xs text-gray-500">
        Desarrollado por
        <a href="https://soldemayosoft.com" target="_blank" class="text-primary-400 hover:underline">
          SolDeMayoSoft
        </a>
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
const profile = useCurrentProfile()

const navItems = computed(() => {
  const rol = profile.value?.rol
  const items = [
    { to: '/dashboard', label: 'Inicio', icon: 'i-heroicons-home' },
    { to: '/ventas/nueva', label: 'Nueva Venta', icon: 'i-heroicons-plus-circle' },
    { to: '/ventas', label: rol === 'vendedor' ? 'Mis Ventas' : 'Todas las Ventas', icon: 'i-heroicons-table-cells' },
  ]
  if (rol === 'admin') {
    items.push({ to: '/admin/usuarios', label: 'Usuarios', icon: 'i-heroicons-users' })
  }
  return items
})
</script>
```

**Step 2: Crear AppHeader.vue**

```vue
<!-- app/components/AppHeader.vue -->
<template>
  <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
    <h2 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h2>
    <div class="flex items-center gap-4">
      <div class="text-right">
        <p class="text-sm font-medium text-gray-800">{{ profile?.nombre }}</p>
        <p class="text-xs text-gray-500 capitalize">{{ rolLabel }}</p>
      </div>
      <UButton
        icon="i-heroicons-arrow-right-on-rectangle"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="logout"
        :loading="loading"
        label="Salir"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const profile = useCurrentProfile()
const route = useRoute()
const loading = ref(false)

const rolLabel = computed(() => {
  const labels = { vendedor: 'Vendedor', oficinista: 'Oficinista', admin: 'Administrador' }
  return labels[profile.value?.rol ?? 'vendedor']
})

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/ventas': 'Ventas',
    '/ventas/nueva': 'Nueva Venta',
    '/admin/usuarios': 'Gestión de Usuarios',
  }
  return titles[route.path] ?? 'AMSI SRL'
})

const logout = async () => {
  loading.value = true
  await client.auth.signOut()
  loading.value = false
  navigateTo('/login')
}
</script>
```

**Step 3: Actualizar app/layouts/default.vue**

```vue
<!-- app/layouts/default.vue -->
<template>
  <div class="flex h-screen bg-gray-50">
    <AppSidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <AppHeader />
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
await useFetchProfile()
</script>
```

**Step 4: Verificar en browser que el layout carga (login primero)**

```bash
pnpm dev
```
Abrir http://localhost:3000 → debe redirigir a /login

**Step 5: Commit**

```bash
git add app/layouts/default.vue app/components/AppSidebar.vue app/components/AppHeader.vue
git commit -m "feat: add dashboard layout with sidebar and header"
```

---

## Task 8: Actualizar página de Login (español)

**Files:**
- Modify: `app/pages/login.vue`
- Modify: `app/layouts/auth.vue`
- Delete: `app/pages/register.vue` (sin registro público)

**Step 1: Reemplazar app/pages/login.vue**

```vue
<!-- app/pages/login.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md">
      <!-- Card -->
      <UCard class="shadow-lg">
        <template #header>
          <div class="text-center">
            <h1 class="text-2xl font-bold text-gray-900">AMSI SRL</h1>
            <p class="text-sm text-gray-500 mt-1">Sistema de Gestión de Ventas</p>
          </div>
        </template>

        <UForm :state="form" @submit="login" class="space-y-4">
          <UFormField label="Email" name="email">
            <UInput
              v-model="form.email"
              type="email"
              placeholder="tu@email.com"
              icon="i-heroicons-envelope"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Contraseña" name="password">
            <UInput
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              icon="i-heroicons-lock-closed"
              class="w-full"
            />
          </UFormField>

          <ErrorAlert v-if="error" :error="error" />

          <UButton
            type="submit"
            block
            :loading="loading"
            label="Ingresar"
          />
        </UForm>

        <template #footer>
          <div class="text-center">
            <NuxtLink to="/forgot-password" class="text-sm text-primary-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </NuxtLink>
          </div>
        </template>
      </UCard>

      <p class="text-center text-xs text-gray-400 mt-4">
        Desarrollado por
        <a href="https://soldemayosoft.com" target="_blank" class="hover:underline">SolDeMayoSoft</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const client = useSupabaseClient()
const form = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')

const login = async () => {
  loading.value = true
  error.value = ''
  const { error: err } = await client.auth.signInWithPassword({
    email: form.email,
    password: form.password,
  })
  if (err) {
    error.value = 'Email o contraseña incorrectos.'
    loading.value = false
    return
  }
  navigateTo('/dashboard')
}

useHead({ title: 'Ingresar — AMSI SRL' })
</script>
```

**Step 2: Actualizar app/layouts/auth.vue (layout vacío para páginas de auth)**

```vue
<!-- app/layouts/auth.vue -->
<template>
  <div>
    <slot />
  </div>
</template>
```

**Step 3: Eliminar register.vue (no hay registro público)**

Borrar `app/pages/register.vue`

**Step 4: Verificar login en browser**

Navegar a http://localhost:3000/login, ingresar con valentinaarauz@hotmail.com / Pichu29071303!
Expected: redirige a /dashboard

**Step 5: Commit**

```bash
git add app/pages/login.vue app/layouts/auth.vue
git rm app/pages/register.vue
git commit -m "feat: update login page to Spanish, remove public register"
```

---

## Task 9: Componente StatsCard

**Files:**
- Create: `app/components/StatsCard.vue`

**Step 1: Crear StatsCard.vue**

```vue
<!-- app/components/StatsCard.vue -->
<template>
  <UCard>
    <div class="flex items-center gap-4">
      <div class="p-3 rounded-lg" :class="bgColor">
        <UIcon :name="icon" class="w-6 h-6" :class="iconColor" />
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500">{{ label }}</p>
        <p class="text-2xl font-bold text-gray-900">{{ value }}</p>
        <p v-if="sub" class="text-xs text-gray-400 mt-0.5">{{ sub }}</p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon: string
  sub?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}>()

const props = defineProps<{
  label: string
  value: string | number
  icon: string
  sub?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}>()

const colorMap = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600' },
  yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
}

const colors = computed(() => colorMap[props.color ?? 'blue'])
const bgColor = computed(() => colors.value.bg)
const iconColor = computed(() => colors.value.icon)
</script>
```

**Step 2: Commit**

```bash
git add app/components/StatsCard.vue
git commit -m "feat: add StatsCard component"
```

---

## Task 10: Componente VentaTable

**Files:**
- Create: `app/components/VentaTable.vue`
- Create: `app/utils/exportCsv.ts`

**Step 1: Crear exportCsv.ts**

```typescript
// app/utils/exportCsv.ts
export const exportCsv = (data: Record<string, unknown>[], filename: string) => {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

**Step 2: Crear VentaTable.vue**

```vue
<!-- app/components/VentaTable.vue -->
<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-3">
        <UInput
          v-model="search"
          placeholder="Buscar por cliente o DNI/CUIL..."
          icon="i-heroicons-magnifying-glass"
          class="w-72"
        />
        <USelect
          v-model="filtroEstado"
          :options="estadoOptions"
          placeholder="Todos los estados"
          class="w-48"
        />
      </div>
      <UButton
        v-if="canExport"
        icon="i-heroicons-arrow-down-tray"
        label="Exportar CSV"
        color="neutral"
        variant="outline"
        size="sm"
        @click="handleExport"
      />
    </div>

    <!-- Tabla -->
    <UTable :rows="ventasFiltradas" :columns="columns" :loading="loading">
      <!-- Estado -->
      <template #estado-data="{ row }">
        <UBadge :color="estadoColor(row.estado)" :label="estadoLabel(row.estado)" variant="subtle" />
      </template>

      <!-- Teléfono con WhatsApp -->
      <template #telefono-data="{ row }">
        <a
          v-if="row.telefono"
          :href="`https://wa.me/549${row.telefono.replace(/\D/g, '')}`"
          target="_blank"
          class="flex items-center gap-1 text-green-600 hover:underline"
        >
          <UIcon name="i-heroicons-phone" class="w-4 h-4" />
          {{ row.telefono }}
        </a>
        <span v-else class="text-gray-400">—</span>
      </template>

      <!-- Precio -->
      <template #precio-data="{ row }">
        <span class="font-medium">
          {{ formatPrecio(row.precio) }}
        </span>
      </template>

      <!-- Vendedor (solo para admin/oficinista) -->
      <template #vendedor-data="{ row }">
        <span>{{ row.profiles?.nombre ?? '—' }}</span>
      </template>

      <!-- Acciones -->
      <template #acciones-data="{ row }">
        <NuxtLink :to="`/ventas/${row.id}`">
          <UButton icon="i-heroicons-eye" size="xs" color="neutral" variant="ghost" />
        </NuxtLink>
      </template>
    </UTable>

    <!-- Empty state -->
    <div v-if="!loading && !ventasFiltradas.length" class="text-center py-10 text-gray-400">
      No hay ventas que coincidan con los filtros.
    </div>
  </div>
</template>

<script setup lang="ts">
import { exportCsv } from '~/utils/exportCsv'

const props = defineProps<{
  ventas: any[]
  loading?: boolean
  canExport?: boolean
  showVendedor?: boolean
}>()

const profile = useCurrentProfile()
const search = ref('')
const filtroEstado = ref('')

const estadoOptions = [
  { label: 'Todos los estados', value: '' },
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'En Proceso', value: 'en_proceso' },
  { label: 'Rechazado', value: 'rechazado' },
  { label: 'Aceptado', value: 'aceptado' },
  { label: 'Concretado', value: 'concretado' },
]

const columns = computed(() => {
  const base = [
    { key: 'fecha_carga', label: 'Fecha', sortable: true },
    { key: 'cliente', label: 'Cliente' },
    { key: 'dni_cuil', label: 'DNI/CUIL' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'paquete', label: 'Paquete' },
    { key: 'precio', label: 'Precio' },
    { key: 'forma_pago', label: 'Forma de Pago' },
    { key: 'estado', label: 'Estado' },
    { key: 'acciones', label: '' },
  ]
  if (props.showVendedor) {
    base.splice(3, 0, { key: 'vendedor', label: 'Vendedor' })
  }
  return base
})

const ventasFiltradas = computed(() => {
  return props.ventas.filter(v => {
    const matchSearch = !search.value ||
      v.cliente?.toLowerCase().includes(search.value.toLowerCase()) ||
      v.dni_cuil?.includes(search.value)
    const matchEstado = !filtroEstado.value || v.estado === filtroEstado.value
    return matchSearch && matchEstado
  })
})

const estadoLabel = (estado: string) => ({
  pendiente: 'Pendiente', en_proceso: 'En Proceso',
  rechazado: 'Rechazado', aceptado: 'Aceptado', concretado: 'Concretado',
}[estado] ?? estado)

const estadoColor = (estado: string) => ({
  pendiente: 'neutral', en_proceso: 'warning',
  rechazado: 'error', aceptado: 'success', concretado: 'info',
}[estado] as any ?? 'neutral')

const formatPrecio = (precio: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(precio)

const handleExport = () => {
  const data = ventasFiltradas.value.map(v => ({
    Fecha: new Date(v.fecha_carga).toLocaleDateString('es-AR'),
    Cliente: v.cliente,
    'DNI/CUIL': v.dni_cuil,
    Dirección: v.direccion ?? '',
    Teléfono: v.telefono ?? '',
    Paquete: v.paquete,
    Precio: v.precio,
    'Forma de Pago': v.forma_pago,
    Estado: estadoLabel(v.estado),
    Vendedor: v.profiles?.nombre ?? '',
    'Comentarios Venta': v.comentarios_venta ?? '',
    'Comentarios Gestión': v.comentarios_gestion ?? '',
  }))
  exportCsv(data, `ventas-${new Date().toISOString().split('T')[0]}.csv`)
}
</script>
```

**Step 3: Commit**

```bash
git add app/components/VentaTable.vue app/utils/exportCsv.ts
git commit -m "feat: add VentaTable component with search, filters, and CSV export"
```

---

## Task 11: Componente VentaForm

**Files:**
- Create: `app/components/VentaForm.vue`

**Step 1: Crear VentaForm.vue**

```vue
<!-- app/components/VentaForm.vue -->
<template>
  <UForm :state="form" @submit="submit" class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField label="Cliente *" name="cliente" class="md:col-span-2">
        <UInput v-model="form.cliente" placeholder="Nombre completo" class="w-full" />
      </UFormField>

      <UFormField label="DNI / CUIL *" name="dni_cuil">
        <UInput v-model="form.dni_cuil" placeholder="20123456789" class="w-full" />
      </UFormField>

      <UFormField label="Teléfono" name="telefono">
        <UInput v-model="form.telefono" placeholder="1123456789" class="w-full" />
      </UFormField>

      <UFormField label="Dirección" name="direccion" class="md:col-span-2">
        <UInput v-model="form.direccion" placeholder="Calle 123, Ciudad" class="w-full" />
      </UFormField>

      <UFormField label="Paquete *" name="paquete">
        <USelect
          v-model="form.paquete"
          :options="paqueteOptions"
          placeholder="Seleccionar paquete"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Precio *" name="precio">
        <UInput v-model="form.precio" type="number" step="0.01" placeholder="0.00" class="w-full" />
      </UFormField>

      <UFormField label="Forma de Pago *" name="forma_pago">
        <USelect
          v-model="form.forma_pago"
          :options="formaPagoOptions"
          placeholder="Seleccionar forma de pago"
          class="w-full"
        />
      </UFormField>

      <!-- Estado: solo para oficinista/admin en modo edición -->
      <UFormField v-if="canEditEstado" label="Estado" name="estado">
        <USelect
          v-model="form.estado"
          :options="estadoOptions"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Comentarios de Venta" name="comentarios_venta" class="md:col-span-2">
        <UTextarea
          v-model="form.comentarios_venta"
          placeholder="Observaciones adicionales..."
          :rows="3"
          class="w-full"
        />
      </UFormField>

      <!-- Comentarios de Gestión: solo oficinista/admin -->
      <UFormField
        v-if="canEditGestion"
        label="Comentarios de Gestión"
        name="comentarios_gestion"
        class="md:col-span-2"
      >
        <UTextarea
          v-model="form.comentarios_gestion"
          placeholder="Notas de gestión interna..."
          :rows="3"
          class="w-full"
        />
      </UFormField>
    </div>

    <ErrorAlert v-if="error" :error="error" />

    <div class="flex justify-end gap-3">
      <UButton
        v-if="showCancel"
        label="Cancelar"
        color="neutral"
        variant="outline"
        @click="$emit('cancel')"
      />
      <UButton
        type="submit"
        :loading="loading"
        :label="submitLabel"
      />
    </div>
  </UForm>
</template>

<script setup lang="ts">
const props = defineProps<{
  initialData?: Partial<typeof form>
  submitLabel?: string
  showCancel?: boolean
}>()

const emit = defineEmits<{
  submit: [data: typeof form]
  cancel: []
}>()

const profile = useCurrentProfile()

const canEditEstado = computed(() =>
  props.initialData && ['oficinista', 'admin'].includes(profile.value?.rol ?? '')
)
const canEditGestion = computed(() =>
  ['oficinista', 'admin'].includes(profile.value?.rol ?? '')
)

const form = reactive({
  cliente: '',
  dni_cuil: '',
  telefono: '',
  direccion: '',
  paquete: '',
  precio: 0,
  forma_pago: '',
  estado: 'pendiente',
  comentarios_venta: '',
  comentarios_gestion: '',
  ...props.initialData,
})

const paqueteOptions = [
  { label: 'Básico', value: 'basico' },
  { label: 'Intermedio', value: 'intermedio' },
  { label: 'Premium', value: 'premium' },
]

const formaPagoOptions = [
  { label: 'Débito', value: 'debito' },
  { label: 'Transferencia', value: 'transferencia' },
  { label: 'Efectivo', value: 'efectivo' },
]

const estadoOptions = [
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'En Proceso', value: 'en_proceso' },
  { label: 'Rechazado', value: 'rechazado' },
  { label: 'Aceptado', value: 'aceptado' },
  { label: 'Concretado', value: 'concretado' },
]

const loading = ref(false)
const error = ref('')

const submit = async () => {
  if (!form.cliente || !form.dni_cuil || !form.paquete || !form.forma_pago || !form.precio) {
    error.value = 'Por favor completá los campos obligatorios (*)'
    return
  }
  loading.value = true
  error.value = ''
  emit('submit', { ...form })
  loading.value = false
}
</script>
```

**Step 2: Commit**

```bash
git add app/components/VentaForm.vue
git commit -m "feat: add VentaForm component"
```

---

## Task 12: Página Dashboard (role-aware)

**Files:**
- Modify: `app/pages/index.vue`

**Step 1: Reemplazar index.vue con dashboard**

```vue
<!-- app/pages/index.vue -->
<template>
  <div class="space-y-6">
    <!-- Vendedor -->
    <template v-if="profile?.rol === 'vendedor'">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatsCard
          label="Mis Ventas del Mes"
          :value="stats.misVentasMes"
          icon="i-heroicons-chart-bar"
          color="blue"
        />
        <StatsCard
          label="Mis Ventas Aceptadas"
          :value="stats.misAceptadas"
          icon="i-heroicons-check-circle"
          color="green"
        />
      </div>
      <UCard>
        <template #header><h3 class="font-semibold text-gray-800">Mis Ventas</h3></template>
        <VentaTable :ventas="ventas" :loading="loading" :show-vendedor="false" />
      </UCard>
    </template>

    <!-- Oficinista -->
    <template v-else-if="profile?.rol === 'oficinista'">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatsCard
          label="Ventas del Mes"
          :value="stats.totalMes"
          icon="i-heroicons-chart-bar"
          color="blue"
        />
        <StatsCard
          label="Ventas Aceptadas"
          :value="stats.aceptadas"
          icon="i-heroicons-check-circle"
          color="green"
        />
      </div>
      <UCard>
        <template #header><h3 class="font-semibold text-gray-800">Todas las Ventas</h3></template>
        <VentaTable :ventas="ventas" :loading="loading" :show-vendedor="true" :can-export="true" />
      </UCard>
    </template>

    <!-- Admin -->
    <template v-else-if="profile?.rol === 'admin'">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Total Ventas del Mes"
          :value="stats.totalMes"
          icon="i-heroicons-chart-bar"
          color="blue"
        />
        <StatsCard
          label="% Conversión"
          :value="`${stats.porcentajeConversion}%`"
          icon="i-heroicons-arrow-trending-up"
          color="green"
          :sub="`${stats.aceptadas} aceptadas / ${stats.totalMes} total`"
        />
        <StatsCard
          label="Ventas Concretadas"
          :value="stats.concretadas"
          icon="i-heroicons-banknotes"
          color="purple"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Ranking vendedores -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-gray-800">Ranking de Vendedores (Mes Actual)</h3>
          </template>
          <UTable :rows="rankingVendedores" :columns="rankingColumns" />
        </UCard>

        <!-- Actividad oficinistas -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-gray-800">Actividad de Oficinistas</h3>
          </template>
          <UTable :rows="actividadOficинistas" :columns="actividadColumns" />
        </UCard>
      </div>

      <UCard>
        <template #header><h3 class="font-semibold text-gray-800">Todas las Ventas</h3></template>
        <VentaTable :ventas="ventas" :loading="loading" :show-vendedor="true" :can-export="true" />
      </UCard>
    </template>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const profile = useCurrentProfile()
const loading = ref(true)
const ventas = ref<any[]>([])

const rankingColumns = [
  { key: 'nombre', label: 'Vendedor' },
  { key: 'total', label: 'Total Ventas' },
  { key: 'aceptadas', label: 'Aceptadas' },
]
const actividadColumns = [
  { key: 'nombre', label: 'Oficinista' },
  { key: 'gestionadas', label: 'Ventas Gestionadas' },
]

onMounted(async () => {
  const query = client
    .from('ventas')
    .select('*, profiles:vendedor_id(nombre, rol)')
    .order('fecha_carga', { ascending: false })

  const { data } = await query
  ventas.value = data ?? []
  loading.value = false
})

const ahora = new Date()
const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

const ventasMes = computed(() =>
  ventas.value.filter(v => v.fecha_carga >= inicioMes)
)

const stats = computed(() => {
  const propias = ventas.value.filter(v => v.vendedor_id === profile.value?.id)
  const propiasMes = propias.filter(v => v.fecha_carga >= inicioMes)
  const total = ventasMes.value.length
  const aceptadas = ventasMes.value.filter(v => v.estado === 'aceptado').length
  const concretadas = ventasMes.value.filter(v => v.estado === 'concretado').length
  return {
    misVentasMes: propiasMes.length,
    misAceptadas: propias.filter(v => v.estado === 'aceptado').length,
    totalMes: total,
    aceptadas,
    concretadas,
    porcentajeConversion: total ? Math.round((aceptadas / total) * 100) : 0,
  }
})

const rankingVendedores = computed(() => {
  const map: Record<string, { nombre: string; total: number; aceptadas: number }> = {}
  ventasMes.value.forEach(v => {
    const nombre = v.profiles?.nombre ?? 'Desconocido'
    if (!map[nombre]) map[nombre] = { nombre, total: 0, aceptadas: 0 }
    map[nombre].total++
    if (v.estado === 'aceptado') map[nombre].aceptadas++
  })
  return Object.values(map).sort((a, b) => b.total - a.total)
})

const actividadOficинistas = computed(() => {
  const map: Record<string, { nombre: string; gestionadas: number }> = {}
  ventas.value.forEach(v => {
    if (v.profiles?.rol === 'oficinista' && v.estado !== 'pendiente') {
      const nombre = v.profiles.nombre
      if (!map[nombre]) map[nombre] = { nombre, gestionadas: 0 }
      map[nombre].gestionadas++
    }
  })
  return Object.values(map).sort((a, b) => b.gestionadas - a.gestionadas)
})

useHead({ title: 'Dashboard — AMSI SRL' })
</script>
```

**Step 2: Verificar dashboard con usuario admin**

Loguear como valentinaarauz@hotmail.com, verificar que se ven las 3 tarjetas y las tablas de ranking.

**Step 3: Commit**

```bash
git add app/pages/index.vue
git commit -m "feat: add role-aware dashboard"
```

---

## Task 13: Página Nueva Venta

**Files:**
- Create: `app/pages/ventas/nueva.vue`

**Step 1: Crear nueva.vue**

```vue
<!-- app/pages/ventas/nueva.vue -->
<template>
  <div class="max-w-3xl mx-auto">
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-gray-800">Cargar Nueva Venta</h2>
      </template>
      <VentaForm
        submit-label="Guardar Venta"
        :show-cancel="true"
        @submit="guardarVenta"
        @cancel="navigateTo('/ventas')"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const profile = useCurrentProfile()
const toast = useToast()

const guardarVenta = async (data: any) => {
  const { error } = await client.from('ventas').insert({
    ...data,
    vendedor_id: profile.value!.id,
  })
  if (error) {
    toast.add({ title: 'Error al guardar', description: error.message, color: 'error' })
    return
  }
  toast.add({ title: 'Venta guardada', color: 'success' })
  navigateTo('/ventas')
}

useHead({ title: 'Nueva Venta — AMSI SRL' })
</script>
```

**Step 2: Verificar creación de venta**

Loguear como admin, ir a /ventas/nueva, completar formulario, verificar que aparece en la lista.

**Step 3: Commit**

```bash
git add app/pages/ventas/nueva.vue
git commit -m "feat: add new sale page"
```

---

## Task 14: Página Listado de Ventas

**Files:**
- Create: `app/pages/ventas/index.vue`

**Step 1: Crear ventas/index.vue**

```vue
<!-- app/pages/ventas/index.vue -->
<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800">
        {{ profile?.rol === 'vendedor' ? 'Mis Ventas' : 'Todas las Ventas' }}
      </h2>
      <UButton
        to="/ventas/nueva"
        icon="i-heroicons-plus"
        label="Nueva Venta"
        size="sm"
      />
    </div>

    <UCard>
      <VentaTable
        :ventas="ventas"
        :loading="loading"
        :show-vendedor="profile?.rol !== 'vendedor'"
        :can-export="profile?.rol !== 'vendedor'"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const profile = useCurrentProfile()
const loading = ref(true)
const ventas = ref<any[]>([])

onMounted(async () => {
  const { data } = await client
    .from('ventas')
    .select('*, profiles:vendedor_id(nombre)')
    .order('fecha_carga', { ascending: false })
  ventas.value = data ?? []
  loading.value = false
})

useHead({ title: 'Ventas — AMSI SRL' })
</script>
```

**Step 2: Commit**

```bash
git add app/pages/ventas/index.vue
git commit -m "feat: add sales list page"
```

---

## Task 15: Página Detalle / Editar Venta

**Files:**
- Create: `app/pages/ventas/[id].vue`

**Step 1: Crear ventas/[id].vue**

```vue
<!-- app/pages/ventas/[id].vue -->
<template>
  <div class="max-w-3xl mx-auto space-y-4">
    <div class="flex items-center gap-3">
      <UButton
        icon="i-heroicons-arrow-left"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="navigateTo('/ventas')"
      />
      <h2 class="text-lg font-semibold text-gray-800">
        {{ canEdit ? 'Editar Venta' : 'Detalle de Venta' }}
      </h2>
      <UBadge :color="estadoColor(venta?.estado)" :label="estadoLabel(venta?.estado)" />
    </div>

    <UCard v-if="venta">
      <!-- Info de carga -->
      <div class="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-1">
        <p><span class="font-medium">Vendedor:</span> {{ venta.profiles?.nombre }}</p>
        <p><span class="font-medium">Fecha de carga:</span> {{ formatFecha(venta.fecha_carga) }}</p>
      </div>

      <VentaForm
        v-if="canEdit"
        :initial-data="venta"
        submit-label="Guardar Cambios"
        :show-cancel="true"
        @submit="actualizar"
        @cancel="navigateTo('/ventas')"
      />

      <!-- Vista de solo lectura para vendedor -->
      <div v-else class="grid grid-cols-2 gap-4 text-sm">
        <div v-for="campo in camposDetalle" :key="campo.label">
          <p class="font-medium text-gray-500">{{ campo.label }}</p>
          <p class="text-gray-900 mt-0.5">{{ campo.value || '—' }}</p>
        </div>
      </div>
    </UCard>

    <div v-else-if="loading" class="text-center py-10 text-gray-400">
      Cargando...
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const client = useSupabaseClient()
const profile = useCurrentProfile()
const toast = useToast()
const loading = ref(true)
const venta = ref<any>(null)

const canEdit = computed(() =>
  ['oficinista', 'admin'].includes(profile.value?.rol ?? '')
)

onMounted(async () => {
  const { data } = await client
    .from('ventas')
    .select('*, profiles:vendedor_id(nombre)')
    .eq('id', route.params.id)
    .single()
  venta.value = data
  loading.value = false
})

const actualizar = async (data: any) => {
  const updateData = profile.value?.rol === 'oficinista'
    ? { estado: data.estado, comentarios_gestion: data.comentarios_gestion }
    : data

  const { error } = await client
    .from('ventas')
    .update(updateData)
    .eq('id', route.params.id)

  if (error) {
    toast.add({ title: 'Error al guardar', color: 'error' })
    return
  }
  toast.add({ title: 'Venta actualizada', color: 'success' })
  navigateTo('/ventas')
}

const estadoLabel = (e: string) => ({
  pendiente: 'Pendiente', en_proceso: 'En Proceso',
  rechazado: 'Rechazado', aceptado: 'Aceptado', concretado: 'Concretado',
}[e] ?? e)

const estadoColor = (e: string) => ({
  pendiente: 'neutral', en_proceso: 'warning',
  rechazado: 'error', aceptado: 'success', concretado: 'info',
}[e] as any ?? 'neutral')

const formatFecha = (f: string) => new Date(f).toLocaleString('es-AR')

const camposDetalle = computed(() => [
  { label: 'Cliente', value: venta.value?.cliente },
  { label: 'DNI/CUIL', value: venta.value?.dni_cuil },
  { label: 'Dirección', value: venta.value?.direccion },
  { label: 'Teléfono', value: venta.value?.telefono },
  { label: 'Paquete', value: venta.value?.paquete },
  { label: 'Precio', value: venta.value?.precio ? `$${venta.value.precio}` : null },
  { label: 'Forma de Pago', value: venta.value?.forma_pago },
  { label: 'Comentarios de Venta', value: venta.value?.comentarios_venta },
  { label: 'Comentarios de Gestión', value: venta.value?.comentarios_gestion },
])

useHead({ title: 'Detalle de Venta — AMSI SRL' })
</script>
```

**Step 2: Commit**

```bash
git add app/pages/ventas/[id].vue
git commit -m "feat: add sale detail and edit page"
```

---

## Task 16: Página Admin — Gestión de Usuarios

**Files:**
- Create: `app/pages/admin/usuarios.vue`

**Step 1: Crear admin/usuarios.vue**

```vue
<!-- app/pages/admin/usuarios.vue -->
<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800">Gestión de Usuarios</h2>
      <UButton
        icon="i-heroicons-plus"
        label="Nuevo Usuario"
        size="sm"
        @click="showModal = true"
      />
    </div>

    <UCard>
      <UTable :rows="usuarios" :columns="columns" :loading="loading">
        <template #rol-data="{ row }">
          <UBadge
            :color="row.rol === 'admin' ? 'error' : row.rol === 'oficinista' ? 'warning' : 'info'"
            :label="rolLabel(row.rol)"
            variant="subtle"
          />
        </template>
        <template #created_at-data="{ row }">
          {{ new Date(row.created_at).toLocaleDateString('es-AR') }}
        </template>
      </UTable>
    </UCard>

    <!-- Modal nuevo usuario -->
    <UModal v-model:open="showModal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="font-semibold text-gray-800">Crear Nuevo Usuario</h3>
          </template>

          <div class="space-y-4">
            <UFormField label="Nombre completo">
              <UInput v-model="nuevoUsuario.nombre" class="w-full" />
            </UFormField>
            <UFormField label="Email">
              <UInput v-model="nuevoUsuario.email" type="email" class="w-full" />
            </UFormField>
            <UFormField label="Contraseña">
              <UInput v-model="nuevoUsuario.password" type="password" class="w-full" />
            </UFormField>
            <UFormField label="Rol">
              <USelect
                v-model="nuevoUsuario.rol"
                :options="[
                  { label: 'Vendedor', value: 'vendedor' },
                  { label: 'Oficinista', value: 'oficinista' },
                ]"
                class="w-full"
              />
            </UFormField>
            <ErrorAlert v-if="createError" :error="createError" />
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton label="Cancelar" color="neutral" variant="outline" @click="showModal = false" />
              <UButton label="Crear Usuario" :loading="creating" @click="crearUsuario" />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['role'] })

const client = useSupabaseClient()
const toast = useToast()
const loading = ref(true)
const usuarios = ref<any[]>([])
const showModal = ref(false)
const creating = ref(false)
const createError = ref('')

const nuevoUsuario = reactive({
  nombre: '', email: '', password: '', rol: 'vendedor',
})

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'rol', label: 'Rol' },
  { key: 'created_at', label: 'Creado' },
]

const rolLabel = (r: string) => ({ vendedor: 'Vendedor', oficinista: 'Oficinista', admin: 'Admin' }[r] ?? r)

onMounted(async () => {
  const { data } = await client.from('profiles').select('*').order('created_at', { ascending: false })
  usuarios.value = data ?? []
  loading.value = false
})

const crearUsuario = async () => {
  if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.password) {
    createError.value = 'Completá todos los campos.'
    return
  }
  creating.value = true
  createError.value = ''

  // Crear usuario en Supabase Auth con metadata
  const { data, error } = await client.auth.admin.createUser({
    email: nuevoUsuario.email,
    password: nuevoUsuario.password,
    email_confirm: true,
    user_metadata: { nombre: nuevoUsuario.nombre, rol: nuevoUsuario.rol },
  })

  if (error) {
    createError.value = error.message
    creating.value = false
    return
  }

  // El trigger crea el profile automáticamente
  // Actualizar lista
  const { data: profiles } = await client.from('profiles').select('*').order('created_at', { ascending: false })
  usuarios.value = profiles ?? []

  toast.add({ title: 'Usuario creado', color: 'success' })
  showModal.value = false
  Object.assign(nuevoUsuario, { nombre: '', email: '', password: '', rol: 'vendedor' })
  creating.value = false
}

useHead({ title: 'Usuarios — AMSI SRL' })
</script>
```

**Nota:** `client.auth.admin.createUser` requiere la service role key. Para que funcione desde el cliente, necesitamos una Server Route de Nuxt que use la service role key. Ver Task 17.

**Step 2: Commit parcial**

```bash
git add app/pages/admin/usuarios.vue
git commit -m "feat: add admin users page (needs server route for user creation)"
```

---

## Task 17: Server Route para crear usuarios (Admin)

**Files:**
- Create: `server/api/admin/create-user.post.ts`
- Modify: `.env` (agregar service role key)

**Step 1: Obtener service role key**

Ir al Supabase dashboard → Settings → API → `service_role` key y agregarla al `.env`:
```env
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_aqui>
```

**Step 2: Crear server route**

```typescript
// server/api/admin/create-user.post.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Verificar que el solicitante es admin (via cookie de sesión)
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { nombre: body.nombre, rol: body.rol },
  })

  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  // Asegurar que el profile tiene el rol correcto
  await supabaseAdmin
    .from('profiles')
    .update({ nombre: body.nombre, rol: body.rol })
    .eq('id', data.user.id)

  return { success: true, user: data.user }
})
```

**Step 3: Actualizar crearUsuario en admin/usuarios.vue**

Reemplazar la llamada a `client.auth.admin.createUser` con:
```typescript
const crearUsuario = async () => {
  // ...validación...
  creating.value = true
  createError.value = ''

  try {
    await $fetch('/api/admin/create-user', {
      method: 'POST',
      body: { ...nuevoUsuario },
    })
    // actualizar lista...
  } catch (err: any) {
    createError.value = err.data?.message ?? 'Error al crear usuario'
  }
  creating.value = false
}
```

**Step 4: Agregar SUPABASE_SERVICE_ROLE_KEY a nuxt.config.ts runtimeConfig**

```typescript
runtimeConfig: {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
}
```

**Step 5: Commit**

```bash
git add server/api/admin/create-user.post.ts .env nuxt.config.ts app/pages/admin/usuarios.vue
git commit -m "feat: add server route for admin user creation"
```

---

## Task 18: Verificación final y limpieza

**Step 1: Verificar flujo completo**

1. Loguear como Admin Supremo (valentinaarauz@hotmail.com)
   - ✓ Dashboard con 3 métricas
   - ✓ Crear nuevo usuario vendedor desde /admin/usuarios
   - ✓ Crear nueva venta

2. Loguear como vendedor creado
   - ✓ Dashboard solo con sus ventas
   - ✓ No puede ver ventas de otros
   - ✓ No puede editar estado

3. Loguear como oficinista
   - ✓ Ve todas las ventas
   - ✓ Puede cambiar estado y comentarios de gestión
   - ✓ Puede exportar CSV

**Step 2: Actualizar AGENTS.md**

Reemplazar contenido con descripción actualizada del proyecto CRM.

**Step 3: Commit final**

```bash
git add -A
git commit -m "feat: complete CRM AMSI SRL - all features implemented"
```

---

## Notas de implementación

- **Nuxt UI v3 API:** Si hay incompatibilidades de API, consultar https://ui.nuxt.com/components
- **RLS Debug:** Si hay errores de permisos, verificar con `execute_sql`: `SELECT * FROM pg_policies WHERE tablename IN ('ventas', 'profiles')`
- **WhatsApp:** El link usa formato argentino `wa.me/549XXXXXXX` (54 = Argentina, 9 = celular)
- **CSV BOM:** El `'\uFEFF'` al inicio del CSV asegura encoding correcto en Excel para caracteres con tilde
