# Contexto para agentes de código

## Resumen del proyecto
- Proyecto: **AMSI SRL CRM** (CRM de ventas con Nuxt + Supabase).
- Stack principal: **Nuxt 4**, **@nuxtjs/supabase**, **@nuxt/ui v2**, **pnpm**.
- Objetivo: gestión de ventas, usuarios, comisiones y catálogo con roles (vendedor, líder, oficinista, admin).

## Estructura relevante
- `app/pages/`: vistas del CRM (dashboard, ventas, admin, auth).
- `app/layouts/`: layouts (`default.vue`, `auth.vue`).
- `app/components/`: componentes reutilizables de UI.
- `app/composables/`: lógica compartida (`useProfile`, `useComisiones`, `useSidebar`).
- `app/middleware/`: guards de navegación (`role.ts`, `force-password.global.ts`).
- `server/utils/auth.ts`: funciones de autenticación y autorización server-side.
- `server/api/`: API routes protegidas (admin, ventas, perfil).
- `nuxt.config.ts`: módulos y configuración.

## Comandos del proyecto
- Instalar dependencias: `pnpm install`
- Desarrollo: `pnpm dev`
- Build: `pnpm build`
- Preview: `pnpm preview`
- Generate: `pnpm generate`

## Variables de entorno esperadas
Crear `.env` con:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Convenciones para cambios
1. Mantener cambios mínimos y enfocados.
2. No romper el flujo de autenticación existente.
3. Preservar estilo visual actual (Tailwind + componentes existentes).
4. Evitar agregar dependencias nuevas si no son necesarias.
5. Si se toca configuración, validar que `pnpm dev` arranque sin errores.
6. **Todas las mutaciones (insert/update/delete/rpc) deben pasar por API routes en `server/api/`**, nunca desde el cliente directo.
7. Cada API route debe usar los helpers de `server/utils/auth.ts` (`requireAuth`, `requireAdmin`, `requireRole`).
8. Las lecturas (SELECT) se mantienen client-side con `useSupabaseClient()` protegidas por RLS de Supabase.

## Perfil del desarrollador
- **Frontend**: Mid-senior en Nuxt/Vue. No necesita explicaciones básicas de componentes, composables, stores ni routing.
- **Backend**: Conocimiento muy limitado. Explicar siempre con simplicidad y contexto cuando se toque lógica de servidor, base de datos o APIs.
- **Claude Code**: Usuario nuevo en la herramienta. Orientar cuando sea relevante.
- **Idioma**: Responder siempre en español.

## Notas rápidas
- Módulos Nuxt activos: `@nuxtjs/supabase`, `@nuxt/ui`.
- `compatibilityVersion` de Nuxt configurado en `4`.
- `ssr: false` (SPA). Deploy: Vercel.
- Seguridad en dos capas: API routes de Nitro (auth + roles) + RLS de Supabase.
- `server/utils/auth.ts` se auto-importa en todos los event handlers de Nitro.
