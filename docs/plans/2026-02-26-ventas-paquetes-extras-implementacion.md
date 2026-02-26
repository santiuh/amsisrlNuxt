# Ventas: Paquetes/Extras Dinámicos + Dirección Expandida — Plan de Implementación

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reemplazar dirección simple + paquetes hardcodeados + precio manual por dirección estructurada, paquetes/extras dinámicos gestionados por admin y precio calculado automáticamente.

**Architecture:** Tablas relacionales `paquetes` y `extras` con snapshots de precio en `venta_extras` y en `ventas`. El formulario carga datos dinámicamente desde Supabase. Admin gestiona catálogo desde `/admin/catalogo`.

**Tech Stack:** Nuxt 4 SPA, @nuxt/ui v2, @nuxtjs/supabase v1, Supabase MCP (`project_id: qdtfmciooezhopcmmrqh`), pnpm.

---

## Task 1: Migración DB — Tablas nuevas (paquetes, extras, venta_extras)

**Files:**
- DB migration via Supabase MCP

**Step 1: Aplicar migración — crear tablas**

Usar herramienta `apply_migration` con `project_id: qdtfmciooezhopcmmrqh`, name: `create_paquetes_extras_tables`:

```sql
-- Tabla paquetes
CREATE TABLE paquetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla extras
CREATE TABLE extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla pivot venta_extras
CREATE TABLE venta_extras (
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  extra_id UUID NOT NULL REFERENCES extras(id),
  precio_snapshot NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (venta_id, extra_id)
);
```

**Step 2: Verificar**

Usar `execute_sql`: `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('paquetes','extras','venta_extras');`

Esperado: 3 filas.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add paquetes, extras, venta_extras tables to Supabase"
```

---

## Task 2: Migración DB — Modificar tabla ventas

**Files:**
- DB migration via Supabase MCP

**Step 1: Aplicar migración — alterar ventas**

Usar `apply_migration`, name: `alter_ventas_direccion_paquete`:

```sql
-- Reemplazar direccion por 4 campos estructurados
ALTER TABLE ventas
  DROP COLUMN IF EXISTS direccion,
  ADD COLUMN dir_calle TEXT,
  ADD COLUMN dir_entre_calles TEXT,
  ADD COLUMN dir_localidad TEXT,
  ADD COLUMN dir_aclaracion TEXT;

-- Reemplazar paquete (texto) por FK + snapshots
ALTER TABLE ventas
  DROP COLUMN IF EXISTS paquete,
  ADD COLUMN paquete_id UUID REFERENCES paquetes(id),
  ADD COLUMN paquete_nombre TEXT,
  ADD COLUMN paquete_precio_snapshot NUMERIC(10,2);
```

**Step 2: Verificar columnas**

Usar `execute_sql`:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ventas'
AND column_name IN ('dir_calle','dir_localidad','paquete_id','paquete_nombre','paquete_precio_snapshot');
```

Esperado: 5 filas.

**Step 3: Commit**

```bash
git commit -m "feat: alter ventas table — expanded address + paquete FK + snapshots"
```

---

## Task 3: RLS — Políticas para paquetes, extras, venta_extras

**Files:**
- DB migration via Supabase MCP

**Step 1: Aplicar RLS**

Usar `apply_migration`, name: `rls_paquetes_extras_venta_extras`:

```sql
-- RLS paquetes: todos leen, solo admin escribe
ALTER TABLE paquetes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos_select_paquetes"
  ON paquetes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_insert_paquetes"
  ON paquetes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "admin_update_paquetes"
  ON paquetes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- RLS extras: todos leen, solo admin escribe
ALTER TABLE extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos_select_extras"
  ON extras FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_insert_extras"
  ON extras FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "admin_update_extras"
  ON extras FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- RLS venta_extras: heredar acceso de ventas
ALTER TABLE venta_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_venta_extras"
  ON venta_extras FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ventas v
      WHERE v.id = venta_id
      AND (
        v.vendedor_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','oficinista'))
        OR EXISTS (
          SELECT 1 FROM profiles lider
          JOIN grupos g ON g.lider_id = lider.id
          JOIN profiles vendedor ON vendedor.grupo_id = g.id
          WHERE lider.id = auth.uid() AND vendedor.id = v.vendedor_id
        )
      )
    )
  );

CREATE POLICY "insert_venta_extras"
  ON venta_extras FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

**Step 2: Verificar**

Usar `execute_sql`:
```sql
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('paquetes','extras','venta_extras')
ORDER BY tablename;
```

Esperado: 7 políticas.

**Step 3: Commit**

```bash
git commit -m "feat: add RLS policies for paquetes, extras, venta_extras"
```

---

## Task 4: Admin Catálogo — `/admin/catalogo.vue`

**Files:**
- Create: `app/pages/admin/catalogo.vue`

**Step 1: Crear la página con tabs Paquetes y Extras**

Crear `app/pages/admin/catalogo.vue`:

```vue
<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800">Catálogo</h2>
    </div>

    <UTabs :items="tabs" v-model="tabActivo">
      <!-- Tab Paquetes -->
      <template #paquetes>
        <div class="space-y-4 pt-4">
          <div class="flex justify-end">
            <UButton icon="i-heroicons-plus" label="Nuevo Paquete" size="sm" @click="abrirModalPaquete()" />
          </div>
          <UCard>
            <UTable :rows="paquetes" :columns="columnasPaquetes" :loading="loadingPaquetes">
              <template #activo-data="{ row }">
                <UBadge :color="row.activo ? 'green' : 'gray'" :label="row.activo ? 'Activo' : 'Inactivo'" variant="subtle" />
              </template>
              <template #precio-data="{ row }">
                {{ formatPrecio(row.precio) }}
              </template>
              <template #acciones-data="{ row }">
                <div class="flex gap-2">
                  <UButton size="xs" icon="i-heroicons-pencil" color="gray" variant="ghost" @click="abrirModalPaquete(row)" />
                  <UButton
                    size="xs"
                    :icon="row.activo ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                    :color="row.activo ? 'orange' : 'green'"
                    variant="ghost"
                    @click="toggleActivo('paquetes', row)"
                  />
                </div>
              </template>
            </UTable>
          </UCard>
        </div>
      </template>

      <!-- Tab Extras -->
      <template #extras>
        <div class="space-y-4 pt-4">
          <div class="flex justify-end">
            <UButton icon="i-heroicons-plus" label="Nuevo Extra" size="sm" @click="abrirModalExtra()" />
          </div>
          <UCard>
            <UTable :rows="extras" :columns="columnasExtras" :loading="loadingExtras">
              <template #activo-data="{ row }">
                <UBadge :color="row.activo ? 'green' : 'gray'" :label="row.activo ? 'Activo' : 'Inactivo'" variant="subtle" />
              </template>
              <template #precio-data="{ row }">
                {{ formatPrecio(row.precio) }}
              </template>
              <template #acciones-data="{ row }">
                <div class="flex gap-2">
                  <UButton size="xs" icon="i-heroicons-pencil" color="gray" variant="ghost" @click="abrirModalExtra(row)" />
                  <UButton
                    size="xs"
                    :icon="row.activo ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                    :color="row.activo ? 'orange' : 'green'"
                    variant="ghost"
                    @click="toggleActivo('extras', row)"
                  />
                </div>
              </template>
            </UTable>
          </UCard>
        </div>
      </template>
    </UTabs>

    <!-- Modal Paquete -->
    <UModal v-model="showModalPaquete">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">{{ editandoPaquete?.id ? 'Editar Paquete' : 'Nuevo Paquete' }}</h3>
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" size="xs" @click="showModalPaquete = false" />
          </div>
        </template>
        <div class="space-y-4">
          <UFormGroup label="Nombre *">
            <UInput v-model="formPaquete.nombre" placeholder="Ej: Plan Básico" class="w-full" />
          </UFormGroup>
          <UFormGroup label="Precio *">
            <UInput v-model.number="formPaquete.precio" type="number" step="0.01" min="0" placeholder="0.00" class="w-full" />
          </UFormGroup>
          <UAlert v-if="errorModal" icon="i-heroicons-exclamation-circle" color="red" variant="soft" :title="errorModal" />
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="outline" @click="showModalPaquete = false" />
            <UButton :label="editandoPaquete?.id ? 'Guardar Cambios' : 'Crear Paquete'" :loading="guardando" @click="guardarPaquete" />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal Extra -->
    <UModal v-model="showModalExtra">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">{{ editandoExtra?.id ? 'Editar Extra' : 'Nuevo Extra' }}</h3>
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" size="xs" @click="showModalExtra = false" />
          </div>
        </template>
        <div class="space-y-4">
          <UFormGroup label="Nombre *">
            <UInput v-model="formExtra.nombre" placeholder="Ej: Extra Fútbol" class="w-full" />
          </UFormGroup>
          <UFormGroup label="Precio *">
            <UInput v-model.number="formExtra.precio" type="number" step="0.01" min="0" placeholder="0.00" class="w-full" />
          </UFormGroup>
          <UAlert v-if="errorModal" icon="i-heroicons-exclamation-circle" color="red" variant="soft" :title="errorModal" />
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="outline" @click="showModalExtra = false" />
            <UButton :label="editandoExtra?.id ? 'Guardar Cambios' : 'Crear Extra'" :loading="guardando" @click="guardarExtra" />
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

const tabs = [
  { label: 'Paquetes', slot: 'paquetes' },
  { label: 'Extras', slot: 'extras' },
]
const tabActivo = ref(0)

// ——— Paquetes ———
const paquetes = ref<any[]>([])
const loadingPaquetes = ref(true)
const showModalPaquete = ref(false)
const editandoPaquete = ref<any>(null)
const formPaquete = reactive({ nombre: '', precio: 0 })
const guardando = ref(false)
const errorModal = ref('')

const columnasPaquetes = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'precio', label: 'Precio' },
  { key: 'activo', label: 'Estado' },
  { key: 'acciones', label: '' },
]

const cargarPaquetes = async () => {
  loadingPaquetes.value = true
  const { data } = await client.from('paquetes').select('*').order('created_at', { ascending: false })
  paquetes.value = data ?? []
  loadingPaquetes.value = false
}

const abrirModalPaquete = (item?: any) => {
  editandoPaquete.value = item ?? null
  formPaquete.nombre = item?.nombre ?? ''
  formPaquete.precio = item?.precio ?? 0
  errorModal.value = ''
  showModalPaquete.value = true
}

const guardarPaquete = async () => {
  if (!formPaquete.nombre || formPaquete.precio < 0) {
    errorModal.value = 'Completá nombre y precio válido.'
    return
  }
  guardando.value = true
  errorModal.value = ''
  if (editandoPaquete.value?.id) {
    const { error } = await client.from('paquetes').update({ nombre: formPaquete.nombre, precio: formPaquete.precio }).eq('id', editandoPaquete.value.id)
    if (error) { errorModal.value = error.message; guardando.value = false; return }
    toast.add({ title: 'Paquete actualizado', color: 'green' })
  } else {
    const { error } = await client.from('paquetes').insert({ nombre: formPaquete.nombre, precio: formPaquete.precio })
    if (error) { errorModal.value = error.message; guardando.value = false; return }
    toast.add({ title: 'Paquete creado', color: 'green' })
  }
  guardando.value = false
  showModalPaquete.value = false
  await cargarPaquetes()
}

// ——— Extras ———
const extras = ref<any[]>([])
const loadingExtras = ref(true)
const showModalExtra = ref(false)
const editandoExtra = ref<any>(null)
const formExtra = reactive({ nombre: '', precio: 0 })

const columnasExtras = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'precio', label: 'Precio' },
  { key: 'activo', label: 'Estado' },
  { key: 'acciones', label: '' },
]

const cargarExtras = async () => {
  loadingExtras.value = true
  const { data } = await client.from('extras').select('*').order('created_at', { ascending: false })
  extras.value = data ?? []
  loadingExtras.value = false
}

const abrirModalExtra = (item?: any) => {
  editandoExtra.value = item ?? null
  formExtra.nombre = item?.nombre ?? ''
  formExtra.precio = item?.precio ?? 0
  errorModal.value = ''
  showModalExtra.value = true
}

const guardarExtra = async () => {
  if (!formExtra.nombre || formExtra.precio < 0) {
    errorModal.value = 'Completá nombre y precio válido.'
    return
  }
  guardando.value = true
  errorModal.value = ''
  if (editandoExtra.value?.id) {
    const { error } = await client.from('extras').update({ nombre: formExtra.nombre, precio: formExtra.precio }).eq('id', editandoExtra.value.id)
    if (error) { errorModal.value = error.message; guardando.value = false; return }
    toast.add({ title: 'Extra actualizado', color: 'green' })
  } else {
    const { error } = await client.from('extras').insert({ nombre: formExtra.nombre, precio: formExtra.precio })
    if (error) { errorModal.value = error.message; guardando.value = false; return }
    toast.add({ title: 'Extra creado', color: 'green' })
  }
  guardando.value = false
  showModalExtra.value = false
  await cargarExtras()
}

// ——— Toggle activo ———
const toggleActivo = async (tabla: 'paquetes' | 'extras', row: any) => {
  await client.from(tabla).update({ activo: !row.activo }).eq('id', row.id)
  if (tabla === 'paquetes') await cargarPaquetes()
  else await cargarExtras()
  toast.add({ title: `${row.activo ? 'Desactivado' : 'Activado'} correctamente`, color: 'green' })
}

const formatPrecio = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

onMounted(() => {
  cargarPaquetes()
  cargarExtras()
})

useHead({ title: 'Catálogo — AMSI SRL' })
</script>
```

**Step 2: Verificar en dev server**

Correr `pnpm dev` y navegar a `/admin/catalogo` (logueado como admin). Verificar que se ven los tabs Paquetes y Extras, y que se pueden crear ítems.

**Step 3: Commit**

```bash
git add app/pages/admin/catalogo.vue
git commit -m "feat: add /admin/catalogo page for dynamic packages and extras management"
```

---

## Task 5: Sidebar — Agregar link Catálogo

**Files:**
- Modify: `app/components/AppSidebar.vue`

**Step 1: Leer el archivo**

Leer `app/components/AppSidebar.vue` para entender la estructura de navegación actual.

**Step 2: Agregar link Catálogo para admin**

En la sección de links de admin (donde están Usuarios y Grupos), agregar:
```vue
<NuxtLink
  v-if="profile?.rol === 'admin'"
  to="/admin/catalogo"
  class="..."
>
  <UIcon name="i-heroicons-tag" class="w-5 h-5" />
  Catálogo
</NuxtLink>
```
Seguir el patrón exacto de los links existentes (mismas clases CSS).

**Step 3: Verificar en browser**

El sidebar de admin debe mostrar "Catálogo" debajo de "Grupos".

**Step 4: Commit**

```bash
git add app/components/AppSidebar.vue
git commit -m "feat: add Catálogo nav link for admin in sidebar"
```

---

## Task 6: VentaForm — Dirección expandida + paquetes dinámicos + extras + precio calculado

**Files:**
- Modify: `app/components/VentaForm.vue`

**Step 1: Reemplazar el contenido completo de VentaForm.vue**

```vue
<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Cliente y DNI -->
      <UFormGroup label="Cliente *" class="md:col-span-2">
        <UInput v-model="form.cliente" placeholder="Nombre completo del cliente" class="w-full" />
      </UFormGroup>

      <UFormGroup label="DNI / CUIL *">
        <UInput v-model="form.dni_cuil" placeholder="20123456789" class="w-full" />
      </UFormGroup>

      <UFormGroup label="Teléfono">
        <UInput v-model="form.telefono" placeholder="1123456789" class="w-full" />
      </UFormGroup>

      <!-- Dirección estructurada -->
      <UFormGroup label="Dirección *">
        <UInput v-model="form.dir_calle" placeholder="Ej: Av. Corrientes 1234" class="w-full" />
      </UFormGroup>

      <UFormGroup label="Entre calles">
        <UInput v-model="form.dir_entre_calles" placeholder="Ej: Callao y Riobamba" class="w-full" />
      </UFormGroup>

      <UFormGroup label="Localidad *">
        <UInput v-model="form.dir_localidad" placeholder="Ej: Buenos Aires" class="w-full" />
      </UFormGroup>

      <UFormGroup label="Aclaración">
        <UInput v-model="form.dir_aclaracion" placeholder="Piso, dpto, referencia..." class="w-full" />
      </UFormGroup>

      <!-- Paquete dinámico -->
      <UFormGroup label="Paquete *" class="md:col-span-2">
        <USelect
          v-model="form.paquete_id"
          :options="opcionesPaquetes"
          placeholder="Seleccionar paquete"
          class="w-full"
          :loading="loadingCatalogo"
        />
      </UFormGroup>

      <!-- Extras -->
      <UFormGroup
        v-if="extrasActivos.length > 0"
        label="Extras"
        class="md:col-span-2"
      >
        <div class="space-y-2 mt-1">
          <div
            v-for="extra in extrasActivos"
            :key="extra.id"
            class="flex items-center gap-3 py-1"
          >
            <input
              type="checkbox"
              :id="`extra-${extra.id}`"
              :value="extra.id"
              v-model="form.extras_ids"
              class="w-4 h-4 accent-primary-500"
            />
            <label :for="`extra-${extra.id}`" class="text-sm cursor-pointer flex-1">
              {{ extra.nombre }}
            </label>
            <span class="text-sm text-gray-500">{{ formatPrecio(extra.precio) }}</span>
          </div>
        </div>
      </UFormGroup>

      <!-- Precio calculado (read-only) -->
      <UFormGroup label="Precio Total" class="md:col-span-2">
        <div class="flex items-center gap-2">
          <UInput
            :model-value="formatPrecio(precioCalculado)"
            disabled
            class="w-full bg-gray-50"
          />
          <span class="text-xs text-gray-400 whitespace-nowrap">Calculado automáticamente</span>
        </div>
      </UFormGroup>

      <!-- Forma de pago -->
      <UFormGroup label="Forma de Pago *">
        <USelect
          v-model="form.forma_pago"
          :options="formaPagoOptions"
          placeholder="Seleccionar forma de pago"
          class="w-full"
        />
      </UFormGroup>

      <!-- Estado: solo en modo edición para oficinista/admin -->
      <UFormGroup v-if="canEditEstado" label="Estado">
        <USelect v-model="form.estado" :options="estadoOptions" class="w-full" />
      </UFormGroup>

      <!-- Comentarios venta -->
      <UFormGroup label="Comentarios de Venta" class="md:col-span-2">
        <UTextarea
          v-model="form.comentarios_venta"
          placeholder="Observaciones adicionales de la venta..."
          :rows="3"
          class="w-full"
        />
      </UFormGroup>

      <!-- Comentarios gestión: solo oficinista/admin -->
      <UFormGroup v-if="canEditGestion" label="Comentarios de Gestión" class="md:col-span-2">
        <UTextarea
          v-model="form.comentarios_gestion"
          placeholder="Notas de gestión interna..."
          :rows="3"
          class="w-full"
        />
      </UFormGroup>
    </div>

    <UAlert
      v-if="errorMsg"
      icon="i-heroicons-exclamation-circle"
      color="red"
      variant="soft"
      :title="errorMsg"
    />

    <div class="flex justify-end gap-3">
      <UButton
        v-if="showCancel"
        label="Cancelar"
        color="gray"
        variant="outline"
        @click="$emit('cancel')"
      />
      <UButton
        :loading="loading"
        :label="submitLabel ?? 'Guardar'"
        @click="submit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  initialData?: Record<string, any>
  submitLabel?: string
  showCancel?: boolean
}>()

const emit = defineEmits<{
  submit: [data: Record<string, any>]
  cancel: []
}>()

const client = useSupabaseClient()
const profile = useCurrentProfile()

const canEditEstado = computed(() =>
  !!props.initialData && ['oficinista', 'admin'].includes(profile.value?.rol ?? '')
)
const canEditGestion = computed(() =>
  ['oficinista', 'admin'].includes(profile.value?.rol ?? '')
)

// ——— Catálogo dinámico ———
const paquetesActivos = ref<any[]>([])
const extrasActivos = ref<any[]>([])
const loadingCatalogo = ref(true)

onMounted(async () => {
  const [{ data: paquetesData }, { data: extrasData }] = await Promise.all([
    client.from('paquetes').select('*').eq('activo', true).order('nombre'),
    client.from('extras').select('*').eq('activo', true).order('nombre'),
  ])
  paquetesActivos.value = paquetesData ?? []
  extrasActivos.value = extrasData ?? []
  loadingCatalogo.value = false
})

const opcionesPaquetes = computed(() =>
  paquetesActivos.value.map(p => ({ label: `${p.nombre} — ${formatPrecio(p.precio)}`, value: p.id }))
)

// ——— Formulario ———
const form = reactive({
  cliente: '',
  dni_cuil: '',
  telefono: '',
  dir_calle: '',
  dir_entre_calles: '',
  dir_localidad: '',
  dir_aclaracion: '',
  paquete_id: '',
  extras_ids: [] as string[],
  forma_pago: '',
  estado: 'pendiente',
  comentarios_venta: '',
  comentarios_gestion: '',
  ...(props.initialData ?? {}),
})

// extras_ids desde initialData (para edición)
if (props.initialData?.venta_extras) {
  form.extras_ids = (props.initialData.venta_extras as any[]).map((ve: any) => ve.extra_id)
}

// ——— Precio calculado ———
const precioCalculado = computed(() => {
  const paquete = paquetesActivos.value.find(p => p.id === form.paquete_id)
  const precioExtras = extrasActivos.value
    .filter(e => form.extras_ids.includes(e.id))
    .reduce((sum, e) => sum + Number(e.precio), 0)
  return (paquete ? Number(paquete.precio) : 0) + precioExtras
})

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
const errorMsg = ref('')

const submit = async () => {
  if (!form.cliente || !form.dni_cuil || !form.paquete_id || !form.forma_pago || !form.dir_calle || !form.dir_localidad) {
    errorMsg.value = 'Por favor completá todos los campos obligatorios (*).'
    return
  }
  errorMsg.value = ''
  loading.value = true

  const paquete = paquetesActivos.value.find(p => p.id === form.paquete_id)
  const extrasSeleccionados = extrasActivos.value.filter(e => form.extras_ids.includes(e.id))

  emit('submit', {
    ...form,
    paquete_nombre: paquete?.nombre ?? '',
    paquete_precio_snapshot: paquete?.precio ?? 0,
    precio: precioCalculado.value,
    _extras: extrasSeleccionados.map(e => ({ id: e.id, precio: e.precio })),
  })
  loading.value = false
}

const formatPrecio = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n ?? 0)
</script>
```

**Step 2: Verificar en browser**

Navegar a `/ventas/nueva`. Verificar:
- 4 campos de dirección visibles
- USelect de paquetes cargado desde DB (debe estar vacío si no hay paquetes creados)
- Checkboxes de extras (vacío si no hay extras)
- Campo precio disabled, calculado en tiempo real

**Step 3: Commit**

```bash
git add app/components/VentaForm.vue
git commit -m "feat: refactor VentaForm — expanded address, dynamic packages/extras, auto-calculated price"
```

---

## Task 7: Nueva venta — guardar con snapshots y venta_extras

**Files:**
- Modify: `app/pages/ventas/nueva.vue`

**Step 1: Reemplazar contenido de nueva.vue**

```vue
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

const guardarVenta = async (data: Record<string, any>) => {
  // Extraer los extras del payload (no van en la tabla ventas)
  const { _extras, extras_ids, ...ventaData } = data

  const { data: ventaCreada, error } = await client
    .from('ventas')
    .insert({ ...ventaData, vendedor_id: profile.value!.id })
    .select('id')
    .single()

  if (error) {
    toast.add({ title: 'Error al guardar', description: error.message, color: 'red' })
    return
  }

  // Insertar extras seleccionados con snapshot de precio
  if (_extras && _extras.length > 0) {
    const ventaExtrasRows = (_extras as any[]).map((e: any) => ({
      venta_id: ventaCreada.id,
      extra_id: e.id,
      precio_snapshot: e.precio,
    }))
    const { error: errorExtras } = await client.from('venta_extras').insert(ventaExtrasRows)
    if (errorExtras) {
      toast.add({ title: 'Venta guardada pero error en extras', description: errorExtras.message, color: 'orange' })
    }
  }

  toast.add({ title: 'Venta guardada correctamente', color: 'green' })
  await navigateTo('/ventas')
}

useHead({ title: 'Nueva Venta — AMSI SRL' })
</script>
```

**Step 2: Verificar creación completa**

En el browser crear una venta con paquete + extras. Verificar en Supabase que:
- `ventas` tiene `paquete_id`, `paquete_nombre`, `paquete_precio_snapshot`, `precio` correctos
- `venta_extras` tiene las filas correspondientes

**Step 3: Commit**

```bash
git add app/pages/ventas/nueva.vue
git commit -m "feat: update nueva.vue to save venta_extras and price snapshots"
```

---

## Task 8: Detalle/edición de venta — actualizar query y display

**Files:**
- Modify: `app/pages/ventas/[id].vue`

**Step 1: Actualizar query para incluir venta_extras**

En `onMounted`, cambiar el select de:
```javascript
.select('*, profiles:vendedor_id(nombre, rol)')
```
a:
```javascript
.select('*, profiles:vendedor_id(nombre, rol), venta_extras(extra_id, precio_snapshot, extras(nombre))')
```

**Step 2: Actualizar `camposDetalle` para dirección expandida**

Reemplazar `{ label: 'Dirección', value: venta.value?.direccion }` por los 4 campos:
```javascript
{ label: 'Dirección', value: venta.value?.dir_calle },
{ label: 'Entre calles', value: venta.value?.dir_entre_calles },
{ label: 'Localidad', value: venta.value?.dir_localidad },
{ label: 'Aclaración', value: venta.value?.dir_aclaracion },
```

Y cambiar `{ label: 'Paquete', value: venta.value?.paquete }` por:
```javascript
{ label: 'Paquete', value: venta.value?.paquete_nombre },
```

**Step 3: Agregar display de extras en vista read-only**

En la sección `v-else` (vista vendedor), después de los campos, agregar:
```vue
<div v-if="venta?.venta_extras?.length" class="md:col-span-2 space-y-1">
  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Extras</p>
  <div class="flex flex-wrap gap-2">
    <UBadge
      v-for="ve in venta.venta_extras"
      :key="ve.extra_id"
      color="blue"
      variant="subtle"
    >
      {{ ve.extras?.nombre }} — {{ formatPrecio(ve.precio_snapshot) }}
    </UBadge>
  </div>
</div>
```

**Step 4: Verificar en browser**

Abrir una venta existente. Verificar que muestra la dirección en 4 campos y extras con precios.

**Step 5: Commit**

```bash
git add app/pages/ventas/[id].vue
git commit -m "feat: update venta detail — expanded address, paquete_nombre, extras display"
```

---

## Task 9: VentaTable — actualizar columna paquete y CSV export

**Files:**
- Modify: `app/components/VentaTable.vue`

**Step 1: Actualizar template de paquete**

En `#paquete-data`, cambiar de `row.paquete` a `row.paquete_nombre`:
```vue
<template #paquete-data="{ row }">
  <span>{{ row.paquete_nombre ?? '—' }}</span>
</template>
```

**Step 2: Actualizar handleExport para dirección expandida**

Reemplazar `Dirección: v.direccion ?? ''` por:
```javascript
'Dirección': v.dir_calle ?? '',
'Entre calles': v.dir_entre_calles ?? '',
'Localidad': v.dir_localidad ?? '',
'Aclaración': v.dir_aclaracion ?? '',
```

Y cambiar `Paquete: v.paquete` por `Paquete: v.paquete_nombre ?? ''`.

**Step 3: Verificar export CSV**

Descargar CSV y verificar que tiene las columnas de dirección correctas y paquete_nombre.

**Step 4: Commit**

```bash
git add app/components/VentaTable.vue
git commit -m "feat: update VentaTable — paquete_nombre column + expanded address in CSV export"
```

---

## Task 10: Actualizar CONTEXT.md

**Files:**
- Modify: `CONTEXT.md`

**Step 1: Actualizar sección "Base de Datos"**

Reemplazar la entrada de `ventas` y agregar las tablas nuevas:
```
paquetes     id (UUID PK), nombre, precio, activo, created_at
extras       id (UUID PK), nombre, precio, activo, created_at
venta_extras venta_id (FK→ventas), extra_id (FK→extras), precio_snapshot
ventas       id, vendedor_id (FK→profiles), cliente, dni_cuil, telefono,
             dir_calle, dir_entre_calles, dir_localidad, dir_aclaracion,
             paquete_id (FK→paquetes), paquete_nombre, paquete_precio_snapshot,
             precio (total calculado), forma_pago, estado, comentarios_venta,
             comentarios_gestion, fecha_carga, created_by
grupos       id (UUID PK), lider_id (FK→profiles), created_at
```

**Step 2: Agregar /admin/catalogo en estructura de archivos**

En la sección `pages/admin/`:
```
└── catalogo.vue     ← gestión de paquetes y extras (tabas)
```

**Step 3: Marcar feature como implementada**

En "Historial de Features":
```
- [x] Paquetes y extras dinámicos con gestión admin (/admin/catalogo)
- [x] Dirección estructurada (calle, entre calles, localidad, aclaración)
- [x] Precio calculado automáticamente (paquete + extras)
```

**Step 4: Commit**

```bash
git add CONTEXT.md
git commit -m "docs: update CONTEXT.md with new schema, catalogo page, and features"
```

---

## Checklist final de verificación

- [ ] Tablas `paquetes`, `extras`, `venta_extras` creadas en Supabase
- [ ] Columnas de dirección expandida en `ventas` (sin `direccion`)
- [ ] `paquete_id`, `paquete_nombre`, `paquete_precio_snapshot` en `ventas`
- [ ] RLS activo en 3 tablas nuevas
- [ ] `/admin/catalogo` accesible, permite crear paquetes y extras con precio
- [ ] Link "Catálogo" visible en sidebar de admin
- [ ] Formulario nueva venta: 4 campos de dirección, paquetes desde DB, extras checkboxes, precio calculado
- [ ] Crear venta guarda en `venta_extras` con snapshots
- [ ] Detalle de venta muestra dirección expandida y extras
- [ ] VentaTable muestra `paquete_nombre` y CSV exporta correctamente
