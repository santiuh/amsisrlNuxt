# API Server-Side — Protección de Endpoints

**Fecha:** 2026-03-07
**Estado:** ✅ Implementado

## Problema

Todas las operaciones de escritura (crear usuarios, gestionar ventas, cambiar configuración, etc.) se ejecutaban directamente desde el navegador usando `useSupabaseClient()`. Aunque Supabase tiene RLS, un usuario autenticado podía potencialmente llamar RPCs de admin o hacer escrituras no autorizadas manipulando el cliente.

## Solución

Capa de API routes server-side con Nitro que:
1. Verifica autenticación en cada request (cookie de sesión → `serverSupabaseUser`)
2. Valida el rol del usuario contra la tabla `profiles` antes de ejecutar operaciones
3. Centraliza todas las escrituras en `server/api/`

## Archivos Creados

### Utilidad de auth
- `server/utils/auth.ts` — 4 helpers: `requireAuth`, `requireProfile`, `requireAdmin`, `requireRole`

### API Routes Admin (todas con `requireAdmin`)
- `server/api/admin/usuarios.post.ts` — crear usuario
- `server/api/admin/usuarios/[id].put.ts` — editar usuario
- `server/api/admin/catalogo/config.put.ts` — precios boca/deco extra
- `server/api/admin/catalogo/paquetes.post.ts` — crear paquete
- `server/api/admin/catalogo/paquetes/[id].put.ts` — editar paquete
- `server/api/admin/catalogo/extras.post.ts` — crear extra
- `server/api/admin/catalogo/extras/[id].put.ts` — editar extra
- `server/api/admin/grupos.post.ts` — crear grupo
- `server/api/admin/grupos/miembros.put.ts` — asignar miembros
- `server/api/admin/comisiones/config.put.ts` — porcentajes comisión
- `server/api/admin/comisiones/ciclos.post.ts` — crear ciclo
- `server/api/admin/comisiones/ciclos/fecha.put.ts` — editar fecha cierre
- `server/api/admin/comisiones/ciclos/cerrar.post.ts` — cerrar ciclo
- `server/api/admin/comisiones/pagos/[id].put.ts` — marcar pago

### API Routes Ventas
- `server/api/ventas/index.post.ts` — crear venta (`requireProfile`)
- `server/api/ventas/[id].put.ts` — editar venta completa (`requireAdmin`)
- `server/api/ventas/gestion.put.ts` — gestión oficinista (`requireRole(['oficinista'])`)
- `server/api/ventas/comentario.post.ts` — comentario conflicto (`requireRole(['vendedor','lider'])`)
- `server/api/ventas/leida.post.ts` — marcar leída (`requireAuth`)

### API Routes Auth/Profile
- `server/api/profile.get.ts` — obtener perfil (`requireAuth`)
- `server/api/cambiar-contrasena.post.ts` — cambiar password (`requireAuth`)

## Archivos Modificados

### Frontend → migrado de `client.rpc()` / `client.from().insert/update()` a `$fetch()`
- `app/pages/admin/usuarios.vue` — crearUsuario, guardarCambios
- `app/pages/admin/catalogo.vue` — guardarConfig, guardarPaquete, guardarExtra, toggleActivo
- `app/pages/admin/grupos.vue` — crearGrupo, guardarMiembros
- `app/pages/admin/comisiones.vue` — guardarConfig, crearCiclo, editarFecha, cerrarCiclo, togglePago
- `app/pages/ventas/nueva.vue` — guardarVenta
- `app/pages/ventas/[id].vue` — actualizar, guardarGestion, guardarComentarioConflicto, marcar leída
- `app/pages/cambiar-contrasena.vue` — guardar contraseña
- `app/composables/useProfile.ts` — useFetchProfile ahora usa `$fetch('/api/profile')`

## Patrón de Seguridad

```
Browser ($fetch) → Nitro (verificar auth + rol) → Supabase (serverSupabaseClient + RLS)
```

Las lecturas siguen siendo client-side (`useSupabaseClient`) protegidas por RLS.
Las escrituras ahora pasan por el servidor donde se verifica identidad y permisos.
