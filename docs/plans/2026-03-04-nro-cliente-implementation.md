# Número de Cliente — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Agregar el campo `nro_cliente` (opcional) a las ventas: editable por oficinistas cuando `estado === 'coordinado'`, editable por admin siempre, visible en lectura para todos los roles cuando tiene valor.

**Architecture:** Migración de columna en `ventas`, un campo extra en `VentaForm` (para admin) y un input condicional en el panel de gestión del oficinista dentro de `ventas/[id].vue`. Visualización en el bloque de metadata de solo lectura.

**Tech Stack:** Nuxt 4, @nuxtjs/supabase, Tailwind CSS, Nuxt UI

---

### Task 1: Migración — agregar columna `nro_cliente`

**Files:**
- DB via Supabase MCP (proyecto `qdtfmciooezhopcmmrqh`)

**Step 1: Aplicar migración**

Usar `apply_migration` con:
- `name`: `add_nro_cliente_to_ventas`
- `query`:
```sql
ALTER TABLE ventas ADD COLUMN nro_cliente TEXT;
```

**Step 2: Verificar**

Ejecutar `execute_sql`:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ventas' AND column_name = 'nro_cliente';
```
Expected: una fila con `column_name = nro_cliente`, `data_type = text`, `is_nullable = YES`.

**Step 3: Commit**

```bash
git commit --allow-empty -m "feat: migración add_nro_cliente_to_ventas aplicada"
```

---

### Task 2: VentaForm — campo nro_cliente para admin

**Files:**
- Modify: `app/components/VentaForm.vue`

El admin usa `VentaForm` con `canEdit = true` (sin `readonly`). El campo va después de "Comentarios de Venta" y antes del log de gestión. Es opcional, sin validación obligatoria.

**Step 1: Agregar al objeto `form`**

En el `reactive({...})` del script (línea ~257), agregar junto a los demás campos:
```typescript
nro_cliente: '',
```
Queda dentro del spread `...(props.initialData ?? {})`, por lo que se populará automáticamente desde `initialData`.

**Step 2: Agregar el campo en el template**

Después del `UFormGroup` de `comentarios_venta` (línea ~137) y antes del `UFormGroup` de "Registro de Gestión" (línea ~148), insertar:

```html
<!-- Número de Cliente -->
<UFormGroup label="Número de Cliente" class="md:col-span-2">
  <UInput
    v-model="form.nro_cliente"
    placeholder="Ej: 123456"
    class="w-full"
    :disabled="readonly"
  />
</UFormGroup>
```

**Step 3: Verificar que se emite en submit**

El `submit()` ya hace `emit('submit', { ...form, ... })`, así que `nro_cliente` se incluye automáticamente. No hay cambio necesario aquí.

**Step 4: Commit**

```bash
git add app/components/VentaForm.vue
git commit -m "feat: agregar campo nro_cliente en VentaForm (admin)"
```

---

### Task 3: Panel oficinista — input condicional en `ventas/[id].vue`

**Files:**
- Modify: `app/pages/ventas/[id].vue`

El oficinista tiene su propio `gestionForm` reactive y `guardarGestion()`. El campo `nro_cliente` se agrega ahí: visible siempre, pero editable solo cuando `gestionForm.estado === 'coordinado'`.

**Step 1: Agregar `nro_cliente` al reactive `gestionForm`**

En el script (línea ~226), el objeto `gestionForm` luce así:
```typescript
const gestionForm = reactive({
  estado: 'pendiente',
  fecha_coordinacion: '',
  nuevoComentario: '',
})
```

Agregar el campo:
```typescript
const gestionForm = reactive({
  estado: 'pendiente',
  fecha_coordinacion: '',
  nuevoComentario: '',
  nro_cliente: '',
})
```

**Step 2: Inicializar desde `venta.value` en `onMounted`**

Después de `gestionForm.fecha_coordinacion = ...` (línea ~259), agregar:
```typescript
gestionForm.nro_cliente = data.nro_cliente ?? ''
```

**Step 3: Incluir en el payload de `guardarGestion()`**

En la función `guardarGestion()`, el objeto `payload` (línea ~309) luce así:
```typescript
const payload: Record<string, any> = {
  estado: gestionForm.estado,
  fecha_coordinacion: ...,
  comentarios_gestion: ...,
}
```

Agregar al payload:
```typescript
nro_cliente: gestionForm.nro_cliente || null,
```

**Step 4: Agregar el input en el template del panel del oficinista**

En el template, el panel del oficinista tiene `v-if="isOficinistra"` (línea ~54). Dentro del grid de campos (`grid grid-cols-1 sm:grid-cols-2`), agregar después del `UFormGroup` de "Estado":

```html
<UFormGroup label="Número de Cliente">
  <UInput
    v-model="gestionForm.nro_cliente"
    placeholder="Ej: 123456"
    class="w-full"
    :disabled="gestionForm.estado !== 'coordinado'"
  />
</UFormGroup>
```

**Step 5: Commit**

```bash
git add app/pages/ventas/[id].vue
git commit -m "feat: agregar campo nro_cliente en panel de gestión del oficinista"
```

---

### Task 4: Bloque de metadata — visualización read-only para todos

**Files:**
- Modify: `app/pages/ventas/[id].vue`

El bloque de metadata (línea ~30) muestra vendedor y fecha de carga. Agregar `nro_cliente` debajo, solo si tiene valor.

**Step 1: Agregar en el template**

En el bloque de metadata (dentro del `div` con clase `grid grid-cols-1 sm:grid-cols-2 gap-2`), luego del `div` de "Fecha de carga":

```html
<div v-if="venta.nro_cliente">
  <span class="font-medium">Nro. de Cliente:</span> {{ venta.nro_cliente }}
</div>
```

**Step 2: Commit**

```bash
git add app/pages/ventas/[id].vue
git commit -m "feat: mostrar nro_cliente en metadata de detalle de venta"
```

---

## Verificación manual final

1. Crear una venta nueva → el campo no aparece aún (correcto, solo se ve en detalle cuando tiene valor)
2. Como **oficinista**, abrir la venta → el input "Número de Cliente" está visible pero **deshabilitado** (estado = pendiente)
3. Cambiar estado a "Coordinado" → el input se habilita
4. Ingresar un número y guardar → el valor se persiste
5. Reabrir la venta → el número aparece en el bloque de metadata superior
6. Como **vendedor/líder**, abrir la misma venta → el número es visible en metadata (solo lectura, sin input)
7. Como **admin**, editar la venta → el campo "Número de Cliente" aparece en `VentaForm`, editable en cualquier estado
