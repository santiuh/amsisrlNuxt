# Contexto para agentes de código

## Resumen del proyecto
- Proyecto: **SupaAuth** (starter de autenticación con Nuxt + Supabase).
- Stack principal: **Nuxt 4**, **@nuxtjs/supabase**, **Tailwind CSS**, **pnpm**.
- Objetivo: flujo de autenticación por email/password (login, registro, recuperación y cambio de contraseña).

## Estructura relevante
- `app/pages/`: vistas de auth (`login.vue`, `register.vue`, `forgot-password.vue`, `new-password.vue`, `index.vue`).
- `app/layouts/`: layouts (`default.vue`, `auth.vue`).
- `app/components/`: componentes reutilizables de UI y alertas.
- `nuxt.config.ts`: módulos, configuración de Supabase y Tailwind.

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

## Perfil del desarrollador
- **Frontend**: Mid-senior en Nuxt/Vue. No necesita explicaciones básicas de componentes, composables, stores ni routing.
- **Backend**: Conocimiento muy limitado. Explicar siempre con simplicidad y contexto cuando se toque lógica de servidor, base de datos o APIs.
- **Claude Code**: Usuario nuevo en la herramienta. Orientar cuando sea relevante.
- **Idioma**: Responder siempre en español.

## Notas rápidas
- Módulos Nuxt activos: `@nuxtjs/supabase`, `@nuxtjs/tailwindcss`, `@nuxthub/core`.
- `compatibilityVersion` de Nuxt configurado en `4`.
- Proyecto orientado a despliegue moderno (incluye soporte con `wrangler` en devDependencies).
