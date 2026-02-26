# Diseño: Rol Líder de Grupo

Fecha: 2026-02-26

## Resumen

Agregar el rol `lider` al CRM AMSI SRL. Un líder puede cargar sus propias ventas (igual que un vendedor) y además ver las ventas de los vendedores de su grupo en modo lectura. Los grupos tienen identidad propia vía tabla `grupos`. Solo el Admin Supremo puede crear grupos y asignar el rol de líder.

## Base de Datos

### Nueva tabla `grupos`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | gen_random_uuid() |
| `lider_id` | UUID | FK → profiles.id |
| `created_at` | TIMESTAMPTZ | Default now() |

### Cambios en `profiles`

- Agregar columna `grupo_id` UUID nullable → FK → grupos.id
- Actualizar CHECK constraint de `rol`: `'vendedor' / 'oficinista' / 'admin' / 'lider'`
- Líderes: `rol = 'lider'`, `grupo_id = null` (lideran, no pertenecen a un grupo)
- Vendedores en grupo: `grupo_id = grupos.id`
- Vendedores sin grupo: `grupo_id = null`

### RLS `ventas` — nuevo caso líder

```sql
-- Líder ve sus propias ventas
vendedor_id = auth.uid()

-- Líder ve ventas de su grupo (UNION con la anterior)
vendedor_id IN (
  SELECT id FROM profiles
  WHERE grupo_id = (
    SELECT id FROM grupos WHERE lider_id = auth.uid()
  )
)

-- Líder NO puede UPDATE ni DELETE ventas del equipo
-- Sus propias ventas: sin cambio (igual que vendedor → bloqueado)
```

### RLS `grupos`

- SELECT: `lider_id = auth.uid()` (lider ve su grupo) OR `admin`
- INSERT/UPDATE/DELETE: solo admin

## Roles y Permisos

| Acción | Vendedor | Líder | Oficinista | Admin |
|---|---|---|---|---|
| Ver sus ventas | ✓ | ✓ | ✓ | ✓ |
| Ver ventas de su grupo | — | ✓ solo leer | — | ✓ |
| Ver todas las ventas | — | — | ✓ | ✓ |
| Cargar nueva venta | ✓ | ✓ | ✓ | ✓ |
| Editar estado/comentarios | — | — | ✓ | ✓ |
| Exportar CSV | — | ✓ (su grupo) | ✓ | ✓ |
| Gestionar usuarios | — | — | — | ✓ |
| Gestionar grupos | — | — | — | ✓ |

## Dashboard Líder

### Sección "Mis Ventas"
- StatsCard: ventas del mes propias
- StatsCard: ventas aceptadas propias
- Tabla: ventas propias con filtros (igual que vendedor)

### Sección "Mi Equipo"
- StatsCard: total ventas del equipo (mes)
- StatsCard: ventas aceptadas del equipo
- Tabla: ventas del grupo, read-only, columna vendedor visible, buscador, exportar CSV

## Rutas Nuevas

```
/admin/grupos             → Gestión de grupos (solo admin)
```

## Componentes Afectados

- `AppSidebar.vue` — sin cambio (lider ve mismas rutas que vendedor)
- `dashboard.vue` — agregar caso `lider` con 2 secciones
- `VentaTable.vue` — ya tiene `showVendedor` y `canExport` props, reutilizable
- `admin/usuarios.vue` — agregar rol `lider` al selector de roles; al crear vendedor opcionalmente asignar grupo

## Nueva Página `/admin/grupos`

- Tabla de grupos: líder (nombre), cantidad miembros, acciones
- Modal "Crear grupo": seleccionar usuario con rol lider (o promover vendedor a lider)
- Modal "Gestionar miembros": lista de vendedores sin grupo + miembros actuales, drag o checkboxes para asignar/desasignar
- Cambiar líder de un grupo existente

## RPC Functions Supabase

- `admin_create_grupo(lider_id, vendedor_ids[])` — SECURITY DEFINER, verifica caller es admin
- `admin_update_grupo_members(grupo_id, add_ids[], remove_ids[])` — SECURITY DEFINER

## Sidebar del Admin

Agregar link "Grupos" bajo "Usuarios" en el nav del admin.

## Migración

1. Agregar `grupo_id` a `profiles`
2. Crear tabla `grupos` con RLS
3. Actualizar CHECK de `rol` en `profiles`
4. Actualizar políticas RLS de `ventas` para líder
