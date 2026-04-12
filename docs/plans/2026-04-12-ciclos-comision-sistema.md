# Sistema de Ciclos de Comisión

Fecha: 2026-04-12

## Resumen

Los ciclos de comisión definen períodos de tiempo durante los cuales se contabilizan las ventas concretadas para calcular comisiones. Cada empresa (Express, Ultra) tiene su propio ciclo independiente.

## Tabla `ciclos_comision`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `fecha_inicio` | TIMESTAMPTZ | Timestamp exacto de inicio del ciclo |
| `fecha_cierre_prevista` | DATE | Fecha estimada de cierre (solo referencia) |
| `fecha_cierre_real` | TIMESTAMPTZ | Timestamp exacto de cierre (null si activo) |
| `estado` | TEXT | `activo` / `cerrado` |
| `created_by` | UUID | FK → auth.users.id |
| `created_at` | TIMESTAMPTZ | |
| `empresa` | TEXT | `express` / `ultra` |

**Regla:** solo puede existir un ciclo activo por empresa.

## Flujo de vida de un ciclo

```
Crear ciclo A (manual)
    │
    │  fecha_inicio = now()  ← timestamp exacto
    │  estado = 'activo'
    │
    ▼
Ciclo A activo
    │
    │  Ventas se concretadan durante este período
    │  Se atribuyen al ciclo si: fecha_concretado >= fecha_inicio AND fecha_concretado < fecha_cierre_real
    │
    ▼
Cerrar ciclo A (admin presiona "Cerrar ciclo")
    │
    │  1. fecha_cierre_real = now()  ← timestamp exacto del cierre
    │  2. Se genera snapshot de comisiones en `ciclo_pagos`
    │  3. estado = 'cerrado'
    │  4. Se auto-crea ciclo B con fecha_inicio = now() (mismo timestamp)
    │
    ▼
Ciclo B activo (automático)
    │
    │  fecha_inicio = timestamp exacto del cierre de A
    │  fecha_cierre_prevista = fecha_inicio + 30 días
    │
    ▼
... (se repite)
```

## Frontera entre ciclos (timestamp exacto)

La delimitación entre ciclos es por **timestamp**, no por día:

- Si ciclo A se cierra el 07/04 a las 17:59:30:
  - Venta concretada a las 17:59:29 → **ciclo A**
  - Venta concretada a las 17:59:31 → **ciclo B**
- No hay gaps ni superposición: `ciclo_A.fecha_cierre_real = ciclo_B.fecha_inicio`

## Atribución de ventas al ciclo

El campo clave es `ventas.fecha_concretado` (TIMESTAMPTZ), que se setea automáticamente cuando el estado de una venta cambia a `concretado`.

**Condición de pertenencia:**
```sql
fecha_concretado >= ciclo.fecha_inicio AND fecha_concretado < ciclo.fecha_cierre_real
```

Para el ciclo activo (sin cierre aún):
```sql
fecha_concretado >= ciclo.fecha_inicio AND fecha_concretado <= now()
```

## RPCs de Supabase

### `admin_crear_ciclo(p_fecha_cierre_prevista, p_empresa)`

- Valida que el caller sea admin
- Valida que no exista otro ciclo activo para la empresa
- Inserta ciclo con `fecha_inicio = now()`

### `admin_cerrar_ciclo(p_ciclo_id)`

1. Valida admin y ciclo activo
2. Captura `v_ahora = now()` como timestamp de cierre
3. Para cada vendedor/oficinista/líder:
   - Cuenta ventas concretadas en `[fecha_inicio, v_ahora)`
   - Calcula comisión según porcentaje del grupo
   - Inserta registro en `ciclo_pagos`
4. Calcula bonus de liderazgo para líderes
5. Cierra el ciclo: `estado = 'cerrado'`, `fecha_cierre_real = v_ahora`
6. Auto-crea ciclo nuevo: `fecha_inicio = v_ahora`, `fecha_cierre_prevista = v_ahora + 30 días`

### `admin_actualizar_fecha_cierre(p_ciclo_id, p_nueva_fecha)`

- Actualiza `fecha_cierre_prevista` del ciclo activo

## Tabla `ciclo_pagos` (snapshot de comisiones)

Se genera al cerrar un ciclo. Contiene:

| Campo | Tipo | Notas |
|---|---|---|
| `ciclo_id` | UUID | FK → ciclos_comision.id |
| `vendedor_id` | UUID | FK → profiles.id |
| `rol_snapshot` | TEXT | Rol al momento del cierre |
| `grupo_id_snapshot` | UUID | Grupo al momento del cierre |
| `cantidad_ventas` | INT | Concretadas en el período |
| `monto_total_ventas` | NUMERIC | Suma de precio_concretado |
| `porcentaje_aplicado` | NUMERIC | % de comisión aplicado |
| `monto_comision` | NUMERIC | Comisión calculada |
| `monto_liderazgo` | NUMERIC | Bonus por liderazgo |
| `monto_total` | NUMERIC | comisión + liderazgo |
| `empresa` | TEXT | |
| `pagado` | BOOLEAN | Control de pago |

## Porcentajes de comisión

Configurados en tabla `configuracion` por empresa:

- `comision_porcentaje_grupo`: % que reciben vendedores con grupo (default 80%)
- `comision_porcentaje_lider`: % de bonus sobre ventas del equipo (default 25%)

**Reglas:**
- Oficinistas: siempre 100%
- Vendedores sin grupo: 100%
- Vendedores con grupo: `comision_porcentaje_grupo`
- Líderes: comisión propia + bonus sobre ventas de su equipo

## Archivos clave

| Archivo | Rol |
|---|---|
| `server/api/admin/comisiones/ciclos.post.ts` | API: crear ciclo |
| `server/api/admin/comisiones/ciclos/cerrar.post.ts` | API: cerrar ciclo (llama RPC) |
| `server/api/admin/comisiones/ciclos/fecha.put.ts` | API: editar fecha cierre prevista |
| `server/api/ventas/gestion.put.ts` | Setea `fecha_concretado` al cambiar estado |
| `server/api/ventas/[id].put.ts` | Setea `fecha_concretado` (edit admin) |
| `app/pages/admin/comisiones.vue` | UI admin: gestión de ciclos y pagos |
| `app/pages/comisiones.vue` | UI vendedor: ver sus comisiones |
| `app/pages/dashboard.vue` | CicloCards + estadísticas del ciclo |
| `app/components/CicloCard.vue` | Card visual del ciclo activo |
| `app/composables/useComisiones.ts` | Cálculo de estimaciones de comisión |
