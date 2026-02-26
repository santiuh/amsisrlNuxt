# Design: Ventas — Dirección expandida, Paquetes/Extras dinámicos y Precio calculado

**Fecha:** 2026-02-26
**Estado:** Aprobado

---

## Contexto

Las tablas de ventas requieren las siguientes mejoras:
1. El campo `direccion` (string único) se expande en 4 campos estructurados.
2. Los paquetes pasan de ser hardcodeados a dinámicos, gestionados por el admin.
3. Se agregan "extras" dinámicos (checkboxes en el formulario) gestionados por el admin.
4. El campo precio deja de ser ingresado manualmente por el vendedor: se calcula automáticamente.

---

## Base de Datos

### Tablas nuevas

```sql
CREATE TABLE paquetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE venta_extras (
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  extra_id UUID NOT NULL REFERENCES extras(id),
  precio_snapshot NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (venta_id, extra_id)
);
```

### Modificaciones en `ventas`

- Eliminar columna `direccion`
- Agregar columnas de dirección estructurada:
  - `dir_calle TEXT` — Calle y número (obligatorio)
  - `dir_entre_calles TEXT` — Entre calles A y B (opcional)
  - `dir_localidad TEXT` — Localidad (obligatorio)
  - `dir_aclaracion TEXT` — Aclaración (opcional)
- Cambiar `paquete TEXT` → `paquete_id UUID REFERENCES paquetes(id)`
- Agregar `paquete_nombre TEXT` — snapshot del nombre al momento de la venta
- Agregar `paquete_precio_snapshot NUMERIC(10,2)` — snapshot del precio al momento de la venta
- El campo `precio` existente (total) se mantiene; ahora se calcula como `paquete_precio_snapshot + Σ(venta_extras.precio_snapshot)`

### RLS

- `paquetes` / `extras`: SELECT para todos los roles autenticados; INSERT/UPDATE/DELETE solo admin
- `venta_extras`: SELECT con las mismas políticas que `ventas`; INSERT al crear/editar venta

---

## Frontend

### Nueva página `/admin/catalogo`

- **Layout**: Dos tabs — "Paquetes" y "Extras"
- **Cada tab**: tabla (nombre, precio, activo badge, acciones) + botón "Nuevo" + modal crear/editar
- Desactivar (soft delete con `activo=false`) en lugar de eliminar — preserva historial
- Solo activos aparecen en el formulario de venta

### Formulario de venta — `VentaForm.vue`

**Sección Dirección** (grid 2 cols):
- `dir_calle` — "Dirección *" (obligatorio)
- `dir_entre_calles` — "Entre calles" (opcional, placeholder "Ej: Corrientes y Lavalle")
- `dir_localidad` — "Localidad *" (obligatorio)
- `dir_aclaracion` — "Aclaración" (opcional)

**Paquete**: USelect cargado desde `paquetes WHERE activo=true`

**Extras**: sección de checkboxes cargados desde `extras WHERE activo=true`:
```
[ ] Extra Fútbol        $XXX
[ ] Boca de TV Extra    $XXX
[ ] Extra Adultos       $XXX
```

**Precio total**: campo disabled calculado reactivamente:
```
precio = paquete_seleccionado.precio + Σ(extras_seleccionados.precio)
```

### Tabla de ventas — `VentaTable.vue`

- Columna "Paquete" muestra `paquete_nombre` (snapshot)
- Export CSV incluye los 4 campos de dirección por separado
- Búsqueda puede incluir `dir_localidad`

### Detalle de venta — `/ventas/[id].vue`

- Vista read-only muestra los 4 campos de dirección
- Muestra extras seleccionados con precio snapshot
- Select query actualizado: `*, venta_extras(extra_id, precio_snapshot, extras(nombre))`

### Navegación — `AppSidebar.vue`

- Agregar link "Catálogo" para admin con ícono `i-heroicons-tag`

---

## Snapshots de precios

Al guardar una venta:
1. `ventas.paquete_nombre` = nombre del paquete en ese momento
2. `ventas.paquete_precio_snapshot` = precio del paquete en ese momento
3. `venta_extras` rows con `precio_snapshot` de cada extra seleccionado
4. `ventas.precio` = suma calculada (campo que ya existe)

Si el admin modifica precios en el futuro, las ventas existentes no se ven afectadas.

---

## Archivos a modificar/crear

| Archivo | Acción |
|---|---|
| Supabase migration (DDL) | Crear |
| `app/pages/admin/catalogo.vue` | Crear |
| `app/components/AppSidebar.vue` | Modificar (agregar Catálogo) |
| `app/components/VentaForm.vue` | Modificar (dirección + paquetes dinámicos + extras + precio calculado) |
| `app/components/VentaTable.vue` | Modificar (columna paquete, CSV export) |
| `app/pages/ventas/nueva.vue` | Modificar (guardar venta_extras, snapshots) |
| `app/pages/ventas/[id].vue` | Modificar (select + display dirección + extras) |
| `CONTEXT.md` | Actualizar esquema DB |
