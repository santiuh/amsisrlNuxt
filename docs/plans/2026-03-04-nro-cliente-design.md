# Diseño: Campo "Número de Cliente" en Ventas

## Fecha
2026-03-04

## Contexto

Las ventas que pasan al estado `coordinado` necesitan registrar el número de cliente asignado por la empresa de servicios. Este número lo ingresa el oficinista o el admin. Es opcional y visible en modo lectura para todos los roles.

---

## Decisión de diseño

**Opción elegida: Opción A — campo directo en tabla `ventas`**

Campo `nro_cliente TEXT` (nullable) en la tabla `ventas`. Sin restricciones adicionales.

Alternativas descartadas:
- Opción B (columna en `comentarios_gestion` JSONB): mezclaba datos estructurados con log de texto libre, complicaba queries y validaciones.
- Opción C (tabla separada): sobreingeniería para un campo simple de texto.

---

## Base de datos

Migración: `ALTER TABLE ventas ADD COLUMN nro_cliente TEXT;`

Sin índices, sin triggers, sin constraints adicionales. Nullable por defecto.

---

## Frontend

### 1. Panel de gestión del oficinista — `ventas/[id].vue`

Dentro del bloque `v-if="isOficinistra"`, se agrega un `UFormGroup` con `UInput` para `nro_cliente`.

- Siempre visible en el panel
- Editable **únicamente** cuando `gestionForm.estado === 'coordinado'`
- Cuando el estado es otro, el input aparece con `:disabled="true"`
- El valor se inicializa desde `venta.nro_cliente` en `onMounted`
- Se guarda junto al resto del payload en `guardarGestion()`

### 2. Formulario admin — `VentaForm.vue`

Se agrega el campo `nro_cliente` como input de texto opcional, sin restricción de estado. El admin puede editarlo siempre que edite la venta.

### 3. Vista de solo lectura — bloque de metadata (`ventas/[id].vue`)

En la sección de metadata superior (junto a "Vendedor" y "Fecha de carga"), se agrega:

```
Nro. de Cliente: {{ venta.nro_cliente }}
```

Renderizado **solo si `venta.nro_cliente` tiene valor** (`v-if`). Visible para todos los roles en modo lectura.

### 4. Fuera de scope

- VentaTable: no se agrega columna
- Exportación CSV: no se incluye el campo
- Validación obligatoria: campo opcional, sin errores si está vacío

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Migración Supabase | `ALTER TABLE ventas ADD COLUMN nro_cliente TEXT` |
| `app/pages/ventas/[id].vue` | Input en panel oficinista + visualización en metadata |
| `app/components/VentaForm.vue` | Campo opcional para admin |
