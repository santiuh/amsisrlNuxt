# Force Password Change on First Login — Design

**Date:** 2026-02-26
**Status:** Approved

## Objetivo

Al crear un usuario desde `/admin/usuarios`, se le asigna una contraseña genérica. En el primer inicio de sesión, el sistema debe forzar al usuario a cambiar su contraseña antes de acceder a cualquier sección. Además, el login y la página de cambio de contraseña incluirán toggle para mostrar/ocultar contraseña.

## Arquitectura

### 1. Base de datos

**Migración:** columna `must_change_password BOOLEAN NOT NULL DEFAULT false` en `profiles`.

**`admin_create_user` (RPC existente):** se actualiza para setear `must_change_password = true` al insertar el profile (actualmente lo hace el trigger `on_auth_user_created`). Se actualiza el trigger o el RPC para que el nuevo usuario tenga el flag en `true`.

**RPC nuevo `user_change_password(p_new_password TEXT)`:** SECURITY DEFINER, cambia la contraseña via `auth.users` y pone `must_change_password = false` en una sola transacción. Solo puede ser llamado por el propio usuario autenticado.

### 2. Middleware `force-password.ts`

Corre en cada navegación protegida (excluye `/login`, `/cambiar-contrasena`, `/forgot-password`, `/new-password`). Lee `useCurrentProfile()` (estado en memoria, sin query extra). Si `must_change_password === true`, redirige a `/cambiar-contrasena`.

### 3. Página `/cambiar-contrasena`

- Layout: `auth`
- Estilo: @nuxt/ui (igual al login)
- Campos: nueva contraseña + repetir contraseña, ambos con toggle ojo
- Banner condicional: si `must_change_password === true` muestra aviso de cambio obligatorio
- Al guardar: llama RPC `user_change_password` → actualiza profile en estado → navega a `/dashboard`
- Accesible también voluntariamente (futuro link desde perfil)

### 4. Login — toggle contraseña

En `login.vue`: tipo del `UInput` de contraseña alterna entre `password` y `text` con botón ojo en el slot `trailing`.

### 5. `Profile` interface

Agrega `must_change_password: boolean` en `useProfile.ts`.

## Flujo de usuario

```
Admin crea usuario → must_change_password = true
Usuario inicia sesión → middleware detecta flag → redirige a /cambiar-contrasena
Usuario cambia contraseña → RPC setea flag = false + actualiza estado → /dashboard
```

## Archivos afectados

- `supabase`: migración + trigger/RPC actualizados + nuevo RPC
- `app/composables/useProfile.ts` — agrega campo
- `app/middleware/force-password.ts` — nuevo
- `app/pages/cambiar-contrasena.vue` — nuevo
- `app/pages/login.vue` — toggle contraseña
