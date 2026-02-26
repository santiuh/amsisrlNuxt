# Líder de Grupo — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Agregar el rol `lider` con tabla `grupos`, dashboard de equipo, y página `/admin/grupos` para gestión completa de grupos.

**Architecture:** Tabla `grupos` (lider_id → profiles) + campo `grupo_id` en profiles para vendedores. RLS aditiva en ventas. Dashboard del líder con dos secciones: propias + equipo.

**Tech Stack:** Nuxt 4, @nuxtjs/supabase, @nuxt/ui v2, Supabase Postgres RLS, SECURITY DEFINER RPCs

---

### Task 1: Migración — crear tabla `grupos` + RLS

**Files:**
- Supabase MCP: `apply_migration` en proyecto `qdtfmciooezhopcmmrqh`

**Step 1: Aplicar migración**

Usar `apply_migration` con name `create_grupos` y query:

```sql
CREATE TABLE grupos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lider_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;

-- Líder ve su propio grupo
CREATE POLICY "lider_select_own_grupo" ON grupos
  FOR SELECT USING (lider_id = auth.uid());

-- Admin hace todo
CREATE POLICY "admin_all_grupos" ON grupos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );
```

**Step 2: Verificar**

```sql
SELECT tablename FROM pg_tables WHERE tablename = 'grupos';
```

Esperado: `grupos` en el resultado.

---

### Task 2: Migración — alterar `profiles` (grupo_id + rol check)

**Files:**
- Supabase MCP: `apply_migration` en proyecto `qdtfmciooezhopcmmrqh`

**Step 1: Aplicar migración**

Usar `apply_migration` con name `alter_profiles_lider` y query:

```sql
-- Agregar grupo_id (FK a grupos)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES grupos(id) ON DELETE SET NULL;

-- Actualizar CHECK constraint del rol para incluir 'lider'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_rol_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_rol_check
  CHECK (rol IN ('vendedor', 'oficinista', 'admin', 'lider'));
```

**Step 2: Verificar**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'grupo_id';
```

Esperado: fila con `grupo_id` de tipo `uuid`.

---

### Task 3: Migración — agregar política RLS lider en `ventas`

**Files:**
- Supabase MCP: `apply_migration` en proyecto `qdtfmciooezhopcmmrqh`

**Step 1: Aplicar migración**

Usar `apply_migration` con name `ventas_rls_lider` y query:

```sql
-- Política adicional (OR con las existentes): líder ve ventas de su grupo
CREATE POLICY "lider_select_grupo_ventas" ON ventas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'lider')
    AND vendedor_id IN (
      SELECT p.id FROM profiles p
      INNER JOIN grupos g ON p.grupo_id = g.id
      WHERE g.lider_id = auth.uid()
    )
  );
```

**Step 2: Verificar**

```sql
SELECT policyname FROM pg_policies
WHERE tablename = 'ventas' AND policyname = 'lider_select_grupo_ventas';
```

Esperado: aparece `lider_select_grupo_ventas`.

---

### Task 4: Migración — RPCs admin para gestión de grupos

**Files:**
- Supabase MCP: `apply_migration` en proyecto `qdtfmciooezhopcmmrqh`

**Step 1: Aplicar migración**

Usar `apply_migration` con name `create_grupo_rpcs` y query:

```sql
-- Crear grupo con líder
CREATE OR REPLACE FUNCTION admin_create_grupo(p_lider_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_grupo_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin') THEN
    RAISE EXCEPTION 'Solo el admin puede crear grupos.';
  END IF;

  INSERT INTO grupos (lider_id) VALUES (p_lider_id) RETURNING id INTO v_grupo_id;
  RETURN v_grupo_id;
END;
$$;

-- Reemplazar miembros de un grupo (set completo)
CREATE OR REPLACE FUNCTION admin_set_grupo_members(
  p_grupo_id     UUID,
  p_vendedor_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin') THEN
    RAISE EXCEPTION 'Solo el admin puede gestionar grupos.';
  END IF;

  -- Quitar todos los miembros actuales de este grupo
  UPDATE profiles SET grupo_id = NULL WHERE grupo_id = p_grupo_id;

  -- Asignar nuevos miembros (solo vendedores)
  IF p_vendedor_ids IS NOT NULL AND array_length(p_vendedor_ids, 1) > 0 THEN
    UPDATE profiles
    SET grupo_id = p_grupo_id
    WHERE id = ANY(p_vendedor_ids) AND rol = 'vendedor';
  END IF;
END;
$$;
```

**Step 2: Verificar**

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('admin_create_grupo', 'admin_set_grupo_members');
```

Esperado: 2 filas.

---

### Task 5: Actualizar `useProfile.ts` — agregar tipo lider y grupo_id

**Files:**
- Modify: `app/composables/useProfile.ts`

**Step 1: Editar archivo**

Reemplazar el contenido completo con:

```typescript
export interface Profile {
  id: string
  nombre: string
  email: string
  rol: 'vendedor' | 'oficinista' | 'admin' | 'lider'
  grupo_id: string | null
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
git commit -m "feat: add lider role and grupo_id to Profile type"
```

---

### Task 6: Actualizar `AppSidebar.vue` — nav para lider y link Grupos para admin

**Files:**
- Modify: `app/components/AppSidebar.vue`

**Step 1: Editar el bloque `navItems` computed**

Reemplazar el script section completo:

```typescript
const profile = useCurrentProfile()
const route = useRoute()

const navItems = computed(() => {
  const rol = profile.value?.rol
  const items: { to: string; label: string; icon: string }[] = [
    { to: '/dashboard', label: 'Inicio', icon: 'i-heroicons-home' },
    { to: '/ventas/nueva', label: 'Nueva Venta', icon: 'i-heroicons-plus-circle' },
    {
      to: '/ventas',
      label: (rol === 'vendedor' || rol === 'lider') ? 'Mis Ventas' : 'Todas las Ventas',
      icon: 'i-heroicons-table-cells',
    },
  ]
  if (rol === 'admin') {
    items.push({ to: '/admin/usuarios', label: 'Usuarios', icon: 'i-heroicons-users' })
    items.push({ to: '/admin/grupos', label: 'Grupos', icon: 'i-heroicons-user-group' })
  }
  return items
})
```

**Step 2: Commit**

```bash
git add app/components/AppSidebar.vue
git commit -m "feat: add Grupos nav link for admin, lider label in sidebar"
```

---

### Task 7: Actualizar `dashboard.vue` — agregar caso lider

**Files:**
- Modify: `app/pages/dashboard.vue`

**Step 1: Agregar sección lider en template**

Insertar ANTES del bloque `<!-- ============ OFICINISTA ============ -->`:

```vue
<!-- ============ LIDER ============ -->
<template v-else-if="profile?.rol === 'lider'">
  <!-- Mis Ventas -->
  <h3 class="text-base font-semibold text-gray-600 uppercase tracking-wide">Mis Ventas</h3>
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
    <template #header>
      <h3 class="font-semibold text-gray-800">Mis Ventas</h3>
    </template>
    <VentaTable :ventas="ventasPropias" :loading="loading" :show-vendedor="false" />
  </UCard>

  <!-- Mi Equipo -->
  <h3 class="text-base font-semibold text-gray-600 uppercase tracking-wide mt-2">Mi Equipo</h3>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <StatsCard
      label="Ventas del Equipo (Mes)"
      :value="stats.equipoMes"
      icon="i-heroicons-users"
      color="orange"
    />
    <StatsCard
      label="Aceptadas del Equipo"
      :value="stats.equipoAceptadas"
      icon="i-heroicons-check-badge"
      color="teal"
    />
  </div>
  <UCard>
    <template #header>
      <h3 class="font-semibold text-gray-800">Ventas de mi Equipo</h3>
    </template>
    <VentaTable :ventas="ventasEquipo" :loading="loading" :show-vendedor="true" :can-export="true" />
  </UCard>
</template>
```

**Step 2: Agregar computed `ventasPropias` y `ventasEquipo` en script**

Agregar DESPUÉS de `const ventasMes = computed(...)`:

```typescript
// Para lider: separar propias vs equipo
const ventasPropias = computed(() =>
  ventas.value.filter(v => v.vendedor_id === profile.value?.id)
)
const ventasEquipo = computed(() =>
  ventas.value.filter(v => v.vendedor_id !== profile.value?.id)
)
```

**Step 3: Extender `stats` computed para lider**

Dentro del objeto retornado por `stats`, agregar:

```typescript
const equipoMes = ventasEquipo.value.filter(v => v.fecha_carga >= inicioMes).length
const equipoAceptadas = ventasEquipo.value.filter(v =>
  v.fecha_carga >= inicioMes && v.estado === 'aceptado'
).length
// Agregar al return:
equipoMes,
equipoAceptadas,
```

**Step 4: Commit**

```bash
git add app/pages/dashboard.vue
git commit -m "feat: add lider dashboard with own sales + team sections"
```

---

### Task 8: Actualizar `admin/usuarios.vue` — agregar lider al selector de roles

**Files:**
- Modify: `app/pages/admin/usuarios.vue`

**Step 1: Agregar 'lider' a las opciones del USelect**

Reemplazar el bloque de options del USelect de Rol:

```vue
<USelect
  v-model="nuevoUsuario.rol"
  :options="[
    { label: 'Vendedor', value: 'vendedor' },
    { label: 'Líder de Grupo', value: 'lider' },
    { label: 'Oficinista', value: 'oficinista' },
  ]"
  class="w-full"
/>
```

**Step 2: Agregar lider a `rolLabel` y `rolColor`**

```typescript
const rolLabel = (r: string) => ({
  vendedor: 'Vendedor',
  lider: 'Líder',
  oficinista: 'Oficinista',
  admin: 'Admin',
}[r] ?? r)

const rolColor = (r: string): any => ({
  admin: 'red',
  oficinista: 'yellow',
  vendedor: 'blue',
  lider: 'orange',
}[r] ?? 'gray')
```

**Step 3: Commit**

```bash
git add app/pages/admin/usuarios.vue
git commit -m "feat: add lider role option to user creation form"
```

---

### Task 9: Crear `/admin/grupos.vue` — gestión de grupos

**Files:**
- Create: `app/pages/admin/grupos.vue`

**Step 1: Crear el archivo completo**

```vue
<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800">Gestión de Grupos</h2>
      <UButton
        icon="i-heroicons-plus"
        label="Nuevo Grupo"
        size="sm"
        @click="abrirModalCrear"
      />
    </div>

    <UCard>
      <UTable :rows="grupos" :columns="columnasGrupos" :loading="loading">
        <template #lider-data="{ row }">
          <span class="font-medium">{{ row.lider?.nombre ?? '—' }}</span>
        </template>
        <template #miembros-data="{ row }">
          <UBadge color="blue" variant="subtle">
            {{ row.miembros?.length ?? 0 }} vendedores
          </UBadge>
        </template>
        <template #actions-data="{ row }">
          <UButton
            size="xs"
            icon="i-heroicons-users"
            label="Miembros"
            color="gray"
            variant="outline"
            @click="abrirModalMiembros(row)"
          />
        </template>
      </UTable>
    </UCard>

    <!-- Modal: Crear grupo -->
    <UModal v-model="showModalCrear">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">Nuevo Grupo</h3>
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" size="xs" @click="showModalCrear = false" />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Líder del grupo *">
            <USelect
              v-model="nuevoGrupo.lider_id"
              :options="opcionesLideres"
              placeholder="Seleccionar líder"
              class="w-full"
            />
          </UFormGroup>
          <UAlert
            v-if="errorCrear"
            icon="i-heroicons-exclamation-circle"
            color="red"
            variant="soft"
            :title="errorCrear"
          />
          <p v-if="opcionesLideres.length === 0" class="text-sm text-gray-500">
            No hay usuarios con rol Líder. Creá primero un usuario con ese rol desde
            <NuxtLink to="/admin/usuarios" class="text-primary-500 underline">Gestión de Usuarios</NuxtLink>.
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="outline" @click="showModalCrear = false" />
            <UButton label="Crear Grupo" :loading="creando" :disabled="!nuevoGrupo.lider_id" @click="crearGrupo" />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Gestionar miembros -->
    <UModal v-model="showModalMiembros">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">
              Miembros — {{ grupoSeleccionado?.lider?.nombre }}
            </h3>
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" size="xs" @click="showModalMiembros = false" />
          </div>
        </template>

        <div class="space-y-2">
          <p class="text-sm text-gray-500 mb-3">Seleccioná los vendedores que pertenecen a este grupo.</p>
          <div
            v-for="vendedor in todosVendedores"
            :key="vendedor.id"
            class="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
          >
            <input
              type="checkbox"
              :id="`v-${vendedor.id}`"
              :value="vendedor.id"
              v-model="miembrosSeleccionados"
              class="w-4 h-4 accent-primary-500"
            />
            <label :for="`v-${vendedor.id}`" class="text-sm cursor-pointer flex-1">
              {{ vendedor.nombre }}
              <span v-if="vendedor.grupo_id && vendedor.grupo_id !== grupoSeleccionado?.id" class="text-xs text-orange-500 ml-1">
                (en otro grupo)
              </span>
            </label>
          </div>
          <p v-if="todosVendedores.length === 0" class="text-sm text-gray-400">No hay vendedores disponibles.</p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="outline" @click="showModalMiembros = false" />
            <UButton label="Guardar Cambios" :loading="guardando" @click="guardarMiembros" />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['role'] })

const client = useSupabaseClient()
const toast = useToast()

const loading = ref(true)
const grupos = ref<any[]>([])
const todosVendedores = ref<any[]>([])

// Modal crear
const showModalCrear = ref(false)
const nuevoGrupo = reactive({ lider_id: '' })
const creando = ref(false)
const errorCrear = ref('')

// Modal miembros
const showModalMiembros = ref(false)
const grupoSeleccionado = ref<any>(null)
const miembrosSeleccionados = ref<string[]>([])
const guardando = ref(false)

const columnasGrupos = [
  { key: 'lider', label: 'Líder' },
  { key: 'miembros', label: 'Miembros' },
  { key: 'actions', label: '' },
]

const opcionesLideres = computed(() =>
  grupos.value
    .filter(g => g.lider)
    .map(g => g.lider) // already in groups — don't re-add
    // actually: lideres disponibles = profiles con rol lider
    // ver cargarDatos
    .map(() => null)
    .filter(Boolean)
)

// Lideres disponibles (profiles con rol='lider' SIN grupo asignado, O el del grupo actual)
const lideresSinGrupo = ref<any[]>([])
const opcionesLideresModal = computed(() =>
  lideresSinGrupo.value.map(l => ({ label: l.nombre, value: l.id }))
)

const cargarDatos = async () => {
  loading.value = true

  // Cargar grupos con lider y miembros
  const { data: gruposData } = await client
    .from('grupos')
    .select('id, created_at, lider:profiles!grupos_lider_id_fkey(id, nombre), miembros:profiles!profiles_grupo_id_fkey(id, nombre)')
    .order('created_at', { ascending: false })
  grupos.value = gruposData ?? []

  // Todos los vendedores
  const { data: vendedoresData } = await client
    .from('profiles')
    .select('id, nombre, grupo_id')
    .eq('rol', 'vendedor')
    .order('nombre')
  todosVendedores.value = vendedoresData ?? []

  // Lideres disponibles (no tienen grupo creado aún)
  const lideresConGrupo = new Set((gruposData ?? []).map((g: any) => g.lider?.id).filter(Boolean))
  const { data: lideresData } = await client
    .from('profiles')
    .select('id, nombre')
    .eq('rol', 'lider')
    .order('nombre')
  lideresSinGrupo.value = (lideresData ?? []).filter((l: any) => !lideresConGrupo.has(l.id))

  loading.value = false
}

onMounted(cargarDatos)

const abrirModalCrear = () => {
  nuevoGrupo.lider_id = ''
  errorCrear.value = ''
  showModalCrear.value = true
}

const crearGrupo = async () => {
  if (!nuevoGrupo.lider_id) return
  creando.value = true
  errorCrear.value = ''
  const { error } = await client.rpc('admin_create_grupo', { p_lider_id: nuevoGrupo.lider_id })
  if (error) {
    errorCrear.value = error.message
    creando.value = false
    return
  }
  toast.add({ title: 'Grupo creado', color: 'green' })
  showModalCrear.value = false
  creando.value = false
  await cargarDatos()
}

const abrirModalMiembros = (grupo: any) => {
  grupoSeleccionado.value = grupo
  miembrosSeleccionados.value = (grupo.miembros ?? []).map((m: any) => m.id)
  showModalMiembros.value = true
}

const guardarMiembros = async () => {
  if (!grupoSeleccionado.value) return
  guardando.value = true
  const { error } = await client.rpc('admin_set_grupo_members', {
    p_grupo_id: grupoSeleccionado.value.id,
    p_vendedor_ids: miembrosSeleccionados.value,
  })
  if (error) {
    toast.add({ title: 'Error al guardar', description: error.message, color: 'red' })
    guardando.value = false
    return
  }
  toast.add({ title: 'Miembros actualizados', color: 'green' })
  showModalMiembros.value = false
  guardando.value = false
  await cargarDatos()
}

// Computed corregido: usa lideresSinGrupo para el modal
const opcionesLideresParaModal = computed(() =>
  lideresSinGrupo.value.map(l => ({ label: l.nombre, value: l.id }))
)

useHead({ title: 'Grupos — AMSI SRL' })
</script>
```

> **Nota:** En el template, reemplazar `:options="opcionesLideres"` por `:options="opcionesLideresParaModal"`.

**Step 2: Commit**

```bash
git add app/pages/admin/grupos.vue
git commit -m "feat: add /admin/grupos page for group management"
```

---

### Task 10: Verificación final

**Step 1: Arrancar dev server**

```bash
pnpm dev
```

**Step 2: Login como admin y verificar:**

1. Sidebar muestra "Grupos" bajo "Usuarios"
2. `/admin/grupos` carga sin errores (tabla vacía inicial)
3. `/admin/usuarios` tiene "Líder de Grupo" en el selector de roles
4. Crear un usuario con rol `lider` → aparece en la lista
5. En `/admin/grupos` → "Nuevo Grupo" → el líder recién creado aparece en el selector
6. Crear el grupo → aparece en la tabla con 0 miembros
7. "Miembros" → asignar vendedores → guardar → tabla muestra cantidad actualizada

**Step 3: Verificar dashboard del líder**

1. Hacer logout, login con el usuario líder creado
2. Dashboard muestra dos secciones: "Mis Ventas" y "Mi Equipo"
3. "Mi Equipo" muestra ventas de los vendedores asignados (read-only)
4. `/ventas` muestra solo las ventas propias del líder

**Step 4: Commit final + push**

```bash
git add -A
git commit -m "feat: complete lider de grupo feature"
git push origin main
```
