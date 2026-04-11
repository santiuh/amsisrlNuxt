# Diseño CRM AMSI SRL

Fecha: 2026-02-25

## Resumen

CRM de gestión de ventas full-stack para "AMSI SRL". Gestiona el ciclo de vida de una venta desde la carga inicial hasta su concreción o rechazo. Interfaz en español, diseño administrativo profesional.

## Stack

- **Framework:** Nuxt 4 (existente)
- **Auth + DB:** Supabase (`qdtfmciooezhopcmmrqh` — `supabase-amsisrl-database`)
- **UI Components:** @nuxt/ui (sobre Tailwind CSS)
- **CSS:** Tailwind CSS (existente)
- **Package manager:** pnpm

## Base de Datos

### Tabla `profiles`

Vinculada a `auth.users`. Almacena rol y datos del usuario.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | FK → auth.users.id |
| `nombre` | TEXT | |
| `email` | TEXT | |
| `rol` | TEXT | `vendedor` / `oficinista` / `admin` |
| `created_at` | TIMESTAMPTZ | Default now() |

### Tabla `ventas`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | Default gen_random_uuid() |
| `vendedor_id` | UUID | FK → profiles.id |
| `fecha_carga` | TIMESTAMPTZ | Default now() |
| `cliente` | TEXT | |
| `dni_cuil` | TEXT | |
| `direccion` | TEXT | |
| `telefono` | TEXT | Se usa para generar link WhatsApp |
| `paquete` | TEXT | `basico` / `intermedio` / `premium` |
| `precio` | NUMERIC | |
| `forma_pago` | TEXT | `debito` / `transferencia` / `efectivo` |
| `estado` | TEXT | `pendiente` (default) / `en_proceso` / `rechazado` / `aceptado` / `concretado` |
| `comentarios_venta` | TEXT | Editable solo por quien carga |
| `comentarios_gestion` | TEXT | Editable solo por oficinista/admin |
| `created_at` | TIMESTAMPTZ | Default now() |

## Row Level Security (RLS)

### `profiles`
- SELECT: autenticado (todos pueden ver profiles para mostrar nombre del vendedor)
- INSERT: solo admin (via función de servidor)
- UPDATE: solo admin
- DELETE: solo admin

### `ventas`
- SELECT vendedor: `vendedor_id = auth.uid()`
- SELECT oficinista/admin: todas
- INSERT: vendedor y oficinista
- UPDATE vendedor: **bloqueado**
- UPDATE oficinista: solo `estado` y `comentarios_gestion`
- UPDATE admin: todo
- DELETE: solo admin

## Roles y Permisos

| Acción | Vendedor | Oficinista | Admin |
|---|---|---|---|
| Ver sus ventas | ✓ | ✓ | ✓ |
| Ver todas las ventas | — | ✓ | ✓ |
| Cargar nueva venta | ✓ | ✓ | ✓ |
| Editar venta propia | — | — | ✓ |
| Cambiar estado venta | — | ✓ | ✓ |
| Agregar comentario gestión | — | ✓ | ✓ |
| Exportar CSV | — | ✓ | ✓ |
| Crear usuarios | — | — | ✓ |
| Ver dashboard global | — | — | ✓ |

## Estructura de Rutas

```
/login                    → Auth (adaptar existente)
/                         → Redirect a /dashboard según rol
/dashboard                → Dashboard dinámico por rol
/ventas                   → Listado de ventas
/ventas/nueva             → Formulario nueva venta
/ventas/[id]              → Detalle + edición
/admin/usuarios           → Gestión de usuarios (solo admin)
```

## Dashboards por Rol

### Vendedor
- Tarjeta: Ventas del mes (cantidad)
- Tarjeta: Ventas aceptadas (cantidad)
- Tabla: sus ventas con filtro por estado + buscador

### Oficinista
- Igual al vendedor pero sobre todas las ventas
- Botón exportar CSV

### Admin Supremo
- Tarjeta: Total ventas del mes
- Tarjeta: % Conversión (aceptadas / total)
- Tabla: Ranking de vendedores del mes (nombre, cantidad ventas, cantidad aceptadas)
- Tabla: Actividad de oficinistas (nombre, ventas gestionadas)
- Botón exportar CSV

## Componentes Principales

- `AppSidebar.vue` — navegación lateral con menú por rol
- `AppHeader.vue` — header con nombre de usuario y botón logout
- `VentaForm.vue` — formulario reutilizable nueva/editar venta
- `VentaTable.vue` — tabla con filtros, buscador, exportar CSV
- `StatsCard.vue` — tarjeta de estadística reutilizable

## Middleware

- `auth.ts` — redirige a /login si no hay sesión activa
- `role.ts` — protege rutas /admin/* para no-admins

## Funcionalidades Especiales

- **WhatsApp link:** teléfono genera `https://wa.me/549{telefono}` (AR)
- **Badges de estado:** colores por estado (gris/amarillo/rojo/verde/azul)
- **Exportar CSV:** JavaScript nativo, exporta tabla filtrada
- **Buscador:** por DNI/CUIL o nombre de cliente, en tiempo real
- **Footer:** link a `soldemayosoft.com` como desarrollador

## Usuario Admin Inicial

- Email: `valentinaarauz@hotmail.com`
- Password: `Pichu29071303!`
- Creado via migración SQL en Supabase (INSERT en auth.users + profiles)

## Variables de Entorno

```env
SUPABASE_URL=https://qdtfmciooezhopcmmrqh.supabase.co
SUPABASE_KEY=<anon key del proyecto activo>
```
