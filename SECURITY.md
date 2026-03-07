# Seguridad — AMSI SRL CRM

## Arquitectura de Seguridad

El proyecto implementa **defensa en profundidad** con dos capas:

### Capa 1: API Routes de Nitro (server-side)
Todas las operaciones de escritura (insert, update, delete, RPC) pasan por rutas en `server/api/`.
Cada ruta usa helpers de `server/utils/auth.ts` para verificar:

| Helper | Qué verifica | HTTP si falla |
|--------|-------------|---------------|
| `requireAuth(event)` | Sesión válida vía `serverSupabaseUser()` | 401 |
| `requireProfile(event)` | Auth + perfil existente en tabla `profiles` | 401/403 |
| `requireAdmin(event)` | Auth + perfil + `rol = 'admin'` | 401/403 |
| `requireRole(event, roles)` | Auth + perfil + rol en la lista | 401/403 |

### Capa 2: Supabase RLS (Row Level Security)
Las políticas de fila en PostgreSQL actúan como segunda barrera:
- Cada tabla tiene políticas RLS activas
- Las funciones RPC son `SECURITY DEFINER` con validaciones internas
- La `anon key` solo expone lo que RLS permite

### Lecturas vs Escrituras
- **Lecturas (SELECT):** se hacen desde el cliente con `useSupabaseClient()`, protegidas por RLS
- **Escrituras (INSERT/UPDATE/DELETE/RPC):** se hacen vía `$fetch('/api/...')`, verificadas server-side

## Protección por Rol

| Área | Endpoint pattern | Rol requerido |
|------|-----------------|---------------|
| Gestión de usuarios | `/api/admin/usuarios/**` | admin |
| Catálogo (paquetes, extras, config) | `/api/admin/catalogo/**` | admin |
| Grupos | `/api/admin/grupos/**` | admin |
| Comisiones (ciclos, pagos, config) | `/api/admin/comisiones/**` | admin |
| Editar venta completa | `PUT /api/ventas/:id` | admin |
| Gestionar venta (estado) | `PUT /api/ventas/gestion` | oficinista |
| Comentario en conflicto | `POST /api/ventas/comentario` | vendedor, lider |
| Crear venta | `POST /api/ventas` | cualquier usuario autenticado |
| Marcar leída | `POST /api/ventas/leida` | cualquier usuario autenticado |
| Perfil propio | `GET /api/profile` | cualquier usuario autenticado |
| Cambiar contraseña | `POST /api/cambiar-contrasena` | cualquier usuario autenticado |

## Middleware Frontend (complementario)
- `role.ts` — redirige a `/dashboard` si un no-admin intenta acceder a `/admin/*`
- `force-password.global.ts` — redirige a `/cambiar-contrasena` si `must_change_password = true`

> **Nota:** los middleware de frontend son solo UX. La seguridad real está en las API routes server-side y en RLS.

## Reportar Vulnerabilidades
Contactar directamente al equipo de desarrollo.
