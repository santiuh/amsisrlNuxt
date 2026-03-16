# Copilot instructions for AMSI SRL CRM

## Contexto esencial
- CRM de ventas en Nuxt 4 + Supabase con roles: `vendedor`, `lider`, `oficinista`, `admin`.
- App SPA (`ssr: false`) en [nuxt.config.ts](../nuxt.config.ts): priorizar lógica client-side.
- Frontend en `app/` y mutaciones en `server/api/` (Nitro).

## Arquitectura (regla principal)
- **SELECT**: cliente con `useSupabaseClient()` + RLS.
  - Ejemplo: [app/pages/ventas/index.vue](../app/pages/ventas/index.vue).
- **INSERT/UPDATE/DELETE/RPC**: siempre vía API route.
  - UI: [app/pages/ventas/[id].vue](../app/pages/ventas/[id].vue)
  - API: [server/api/ventas/gestion.put.ts](../server/api/ventas/gestion.put.ts)
- Auth/roles server-side con `requireAuth`, `requireAdmin`, `requireRole` de [server/utils/auth.ts](../server/utils/auth.ts).

## DO / DON'T del proyecto
- DO: usar `useCurrentProfile()` + `useFetchProfile()` de [app/composables/useProfile.ts](../app/composables/useProfile.ts).
- DO: respetar middleware de navegación:
  - [app/middleware/role.ts](../app/middleware/role.ts)
  - [app/middleware/force-password.global.ts](../app/middleware/force-password.global.ts)
- DO: reutilizar fechas de [app/utils/dates.ts](../app/utils/dates.ts) (evita desfase AR).
- DO: mantener UI con `@nuxt/ui` + Tailwind.
- DON'T: mutar Supabase directo desde `app/**`.
- DON'T: crear endpoints sin guard de rol/autenticación.

## Integraciones sensibles
- Supabase Auth + DB con RLS.
- Admin usa RPC server-side (ejemplo `admin_create_user`): [server/api/admin/usuarios.post.ts](../server/api/admin/usuarios.post.ts).
- Convención de endpoints: `*.post.ts`, `*.put.ts` en `server/api/**`; consumo en UI con `$fetch('/api/...')`.

## Flujo recomendado para cambios
1. Definir si el cambio es lectura o mutación.
2. Si es mutación: crear/ajustar endpoint en `server/api/...` con guard (`requireRole`/`requireAdmin`).
3. En UI, enviar payload mínimo con `$fetch` y mostrar feedback (`useToast()`).
4. Validar impacto por rol en flujos de ventas/admin.

## Workflows de desarrollo
- `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm generate`.
- Sin scripts de test/lint en [package.json](../package.json): validar con dev/build + consola + Network.
- `.env` mínimo: `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
