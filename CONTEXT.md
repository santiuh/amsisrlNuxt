# AMSI SRL CRM — Contexto del Proyecto

## Stack
- **Framework:** Nuxt 4 (`compatibilityVersion: 4`, directorio `app/`)
- **UI:** @nuxt/ui v2 (Tailwind CSS v3 — NO v4)
- **Auth/DB:** @nuxtjs/supabase v1
- **Package manager:** pnpm
- **Modo:** `ssr: false` (SPA, auth-gated, sin SEO)
- **Deploy:** Vercel (GitHub → auto-deploy a `main`)

## Supabase
- **Project ID:** `qdtfmciooezhopcmmrqh`
- **Acceso:** Integración Vercel (org `vercel_icfg_9apyzUwM3uXixzUphK3jsFaG`)

## Base de Datos

### Tablas principales
```
profiles     id (UUID PK), nombre, email, rol, grupo_id (FK→grupos), created_at
paquetes     id (UUID PK), nombre, precio, activo, created_at
extras       id (UUID PK), nombre, precio, activo, created_at
ventas       id, vendedor_id (FK→profiles), cliente, dni_cuil, telefono,
             dir_calle, dir_entre_calles, dir_localidad, dir_aclaracion,
             paquete_id (FK→paquetes), paquete_nombre (snapshot), paquete_precio_snapshot,
             precio (total calculado), forma_pago, estado,
             fecha_coordinacion (TIMESTAMPTZ, nullable — requerida si estado='coordinado'),
             comentarios_venta (TEXT),
             comentarios_gestion (JSONB DEFAULT '[]' — array de {fecha_hora, autor, tipo, texto}),
             fecha_carga, created_by
venta_extras venta_id (FK→ventas), extra_id (FK→extras), precio_snapshot  ← PK compuesta
grupos       id (UUID PK), lider_id (FK→profiles), created_at

prospectos   id, nombre, telefono, canal, estado, motivo_perdida,
             dir_calle, dir_entre_calles, dir_localidad, dir_aclaracion,
             lat, lng (double precision, NULL/NULL = "sin ubicar"),
             notas, proxima_visita (date), fecha_ultima_interaccion (denorm.),
             vendedor_id (FK→profiles, dueño), created_by, venta_id (UNIQUE FK→ventas),
             origen ('manual'|'importado'|'venta'), created_at, updated_at
             CHECK estado IN ('por_visitar','ausente','visitado','ofrecido','contratado','perdido','reconectar')
             CHECK canal IN ('puerta_a_puerta','telefono','whatsapp','instagram','facebook','referido','otro')
             CHECK perdido ⇒ motivo_perdida NOT NULL
prospecto_interacciones  id, prospecto_id (FK CASCADE), autor_id, tipo, resultado,
             estado_resultante, comentario, proxima_visita, created_at  ← append-only (sin UPDATE/DELETE)
geocode_cache  direccion (PK, normalizada), lat, lng, provider  ← cache geocodificación
```

### Rol CHECK constraint
```sql
rol IN ('vendedor', 'oficinista', 'admin', 'lider')
```

### RLS — ventas (políticas aditivas OR)
- `vendedor_select_own` — vendedor ve solo sus ventas (`vendedor_id = auth.uid()`)
- `oficinista_select_all` — oficinista ve todas
- `admin_select_all` — admin ve todas
- `lider_select_grupo_ventas` — lider ve ventas de su grupo

### RLS — prospectos (mismo patrón aditivo)
- SELECT/UPDATE: `own` (vendedor_id = auth.uid()) + `lider_grupo` (miembros de su grupo) + `staff` (admin/oficinista)
- INSERT: vendedor/lider solo propio; staff cualquier vendedor_id
- DELETE: solo admin
- `prospecto_interacciones`: hereda acceso vía subquery a prospectos (corre bajo RLS del usuario); append-only

### RPCs SECURITY DEFINER
- `admin_create_user(p_email, p_password, p_nombre, p_rol)` — crea usuario en auth + profile
- `admin_create_grupo(p_lider_id UUID) RETURNS UUID`
- `admin_set_grupo_members(p_grupo_id UUID, p_vendedor_ids UUID[]) RETURNS VOID`
- `prospectos_mapa()` — capa limitada del mapa para TODOS los autenticados: solo columnas
  seguras (id, lat/lng, estado, fechas, vendedor id+nombre, localidad, flag acceso_completo).
  ⚠️ NUNCA agregarle teléfono/nombre del cliente/notas/dirección exacta sin revisar visibilidad.

### FK aliases para joins con Supabase
- Lider de grupo: `profiles!grupos_lider_id_fkey`
- Miembros de grupo: `profiles!profiles_grupo_id_fkey`

## Roles y Permisos

| Rol | Ver sus ventas | Ver grupo | Ver todas | Cargar venta | Admin |
|---|---|---|---|---|---|
| vendedor | ✓ | — | — | ✓ | — |
| lider | ✓ + grupo (read-only) | ✓ | — | ✓ | — |
| oficinista | ✓ | — | ✓ | ✓ | — |
| admin | ✓ | ✓ | ✓ | ✓ | ✓ |

## Estructura de Archivos

```
app/
├── app.vue
├── assets/css/tailwind.postcss
├── composables/
│   └── useProfile.ts          ← Profile interface + useCurrentProfile + useFetchProfile
├── components/
│   ├── AppHeader.vue           ← título página + nombre usuario + logout
│   ├── AppSidebar.vue          ← nav por rol (lider/vendedor → "Mis Ventas", admin → +Grupos)
│   ├── StatsCard.vue           ← tarjeta de estadística (label, value, icon, color, sub)
│   ├── VentaTable.vue          ← tabla reutilizable (props: ventas, loading, showVendedor, canExport)
│   ├── VentaForm.vue           ← formulario nueva venta
│   ├── ErrorAlert.vue
│   └── SuccessAlert.vue
├── layouts/
│   ├── default.vue             ← sidebar + header + main (llama useFetchProfile)
│   └── auth.vue                ← layout login/forgot-password
├── middleware/
│   └── role.ts                 ← protege /admin/* → solo rol='admin'
├── pages/
│   ├── index.vue               ← redirect a /dashboard
│   ├── login.vue
│   ├── forgot-password.vue
│   ├── new-password.vue
│   ├── dashboard.vue           ← vistas por rol: vendedor / lider / oficinista / admin
│   ├── ventas/
│   │   ├── index.vue           ← lista de ventas (filtros, búsqueda)
│   │   ├── nueva.vue           ← carga nueva venta
│   │   └── [id].vue            ← detalle/edición venta
│   └── admin/
│       ├── usuarios.vue        ← gestión de usuarios (crear, listar)
│       ├── grupos.vue          ← gestión de grupos (crear, asignar miembros)
│       └── catalogo.vue        ← gestión de paquetes y extras (tabs, CRUD, toggle activo)
└── utils/
    ├── dates.ts
    └── exportCsv.ts
server/
├── utils/
│   └── auth.ts                ← requireAuth, requireProfile, requireAdmin, requireRole
└── api/
    ├── profile.get.ts          ← GET perfil del usuario autenticado
    ├── cambiar-contrasena.post.ts ← cambiar password (requireAuth)
    ├── admin/
    │   ├── usuarios.post.ts    ← crear usuario (requireAdmin)
    │   ├── usuarios/[id].put.ts ← editar usuario (requireAdmin)
    │   ├── catalogo/
    │   │   ├── config.put.ts   ← precios boca/deco extra (requireAdmin)
    │   │   ├── paquetes.post.ts ← crear paquete (requireAdmin)
    │   │   ├── paquetes/[id].put.ts ← editar paquete (requireAdmin)
    │   │   ├── extras.post.ts  ← crear extra (requireAdmin)
    │   │   └── extras/[id].put.ts ← editar extra (requireAdmin)
    │   ├── grupos.post.ts      ← crear grupo (requireAdmin)
    │   ├── grupos/miembros.put.ts ← asignar miembros (requireAdmin)
    │   └── comisiones/
    │       ├── config.put.ts   ← porcentajes comisión (requireAdmin)
    │       ├── ciclos.post.ts  ← crear ciclo (requireAdmin)
    │       ├── ciclos/fecha.put.ts ← editar fecha cierre (requireAdmin)
    │       ├── ciclos/cerrar.post.ts ← cerrar ciclo (requireAdmin)
    │       └── pagos/[id].put.ts ← marcar pago (requireAdmin)
    └── ventas/
        ├── index.post.ts       ← crear venta (requireProfile)
        ├── [id].put.ts         ← editar venta completa (requireAdmin)
        ├── gestion.put.ts      ← gestión oficinista (requireRole(['oficinista']))
        ├── comentario.post.ts  ← comentario conflicto (requireRole(['vendedor','lider']))
        └── leida.post.ts       ← marcar leída (requireAuth)
```

## Decisiones Arquitecturales Clave

1. **`ssr: false`** — evita conflicto CJS/ESM de `@headlessui/vue` con Nuxt 4 + Vite 7
2. **RLS aditiva** — múltiples políticas SELECT en `ventas` se combinan con OR automáticamente
3. **`grupo_id` en profiles** — vendedores tienen FK a su grupo; líderes tienen `grupo_id = null`
4. **Lider = rol separado** — `rol='lider'`, no pertenece a ningún grupo, lidera uno
5. **`@nuxthub/core` removido** — estaba forzando preset `cloudflare-pages` → roto en Vercel
6. **API routes para mutaciones** — todas las escrituras (insert/update/delete/rpc) pasan por `server/api/` con verificación de auth + rol server-side; las lecturas siguen client-side protegidas por RLS

## Convenciones de Código

- Componentes: `PascalCase`, archivos `PascalCase.vue`
- Composables: `camelCase`, prefijo `use`
- Páginas admin: `definePageMeta({ middleware: ['role'] })`
- Toast: `useToast()` de @nuxt/ui → `toast.add({ title, color })`
- Supabase client: `useSupabaseClient()` solo para lecturas (SELECT), usuario: `useSupabaseUser()`
- Mutaciones: `$fetch('/api/...')` → API routes server-side con auth
- Server auth: `requireAuth()`, `requireAdmin()`, `requireRole()` de `server/utils/auth.ts`
- Profile global: `useCurrentProfile()` (useState), carga vía `$fetch('/api/profile')`

## Comandos Útiles

```bash
pnpm dev          # dev server → localhost:3000
pnpm build        # production build
git push origin main  # → trigger Vercel deploy automático
```

## Asistente IA (admin-only)

- **Página:** `/admin/asistente` (`middleware: ['role']`) — chat para consultar los datos del CRM en lenguaje natural. Link en sidebar + menú móvil, título en AppHeader.
- **Endpoint:** `server/api/asistente/chat.post.ts` — `requireAdmin` + rate limit en memoria (15 msg/min por usuario). Body `{ messages: [{role, text}] }` → `{ ok, reply, consultas }`.
- **Cerebro:** `server/utils/asistente.ts` — system prompt con el esquema completo de la DB + loop de function calling con Gemini (`gemini-2.5-flash`). El modelo llama a la herramienta `consultar_sql`, el server la ejecuta y le devuelve las filas hasta que responde en texto (máx. 6 rondas / 10 consultas por mensaje). Los errores SQL vuelven al modelo para que corrija.
- **Seguridad DB:** RPC `chatbot_sql(p_sql)` (SECURITY DEFINER, owner `chatbot_readonly`): re-valida rol admin por JWT, solo UNA sentencia SELECT/WITH, máx. 200 filas, corre con el rol `chatbot_readonly` que solo tiene SELECT sobre columnas permitidas — **sin acceso a `ventas.cbu` / `nro_tarjeta` / `vencimiento_tarjeta`** (por eso `SELECT *` en ventas falla: hay que nombrar columnas). Migración: `docs/migrations/2026-07-27-asistente-chatbot.sql`.
- **Markdown:** respuestas renderizadas con `app/utils/markdownLite.ts` (mini-renderer seguro: escapa todo antes de armar HTML; tablas GFM, listas, negrita, código).
- **Env:** `GEMINI_API_KEY` (misma key que Solcito en soldemayosoft) + opcional `GEMINI_MODEL`. En Vercel hay que cargar `GEMINI_API_KEY`; sin key el endpoint responde 503. `nitro.vercel.functions.maxDuration = 60` para las rondas múltiples.
- **Fórmula de montos:** el prompt le enseña al modelo la fórmula oficial `coalesce(precio_concretado, precio)` (la misma de `admin_cerrar_ciclo`) y la atribución de ventas a ciclos por `fecha_concretado`. Porcentajes: oficinistas, admins y vendedores sin grupo cobran 100%; vendedores con grupo y líderes cobran `comision_porcentaje_grupo`; el líder suma `monto_liderazgo`. Los admins que venden se liquidan como cualquier vendedor (migración `docs/migrations/2026-07-27-comisiones-admin.sql`); solo generan fila en `ciclo_pagos` si vendieron algo en el ciclo.

## Historial de Features Implementadas
- [x] Auth (login, logout, forgot/reset password)
- [x] Roles: vendedor, oficinista, admin, lider
- [x] Dashboard por rol con stats y tablas
- [x] CRUD ventas con estados (pendiente / aceptado / rechazado / concretado)
- [x] Gestión de usuarios (/admin/usuarios)
- [x] Gestión de grupos (/admin/grupos) con asignación de miembros
- [x] Export CSV para oficinista/lider/admin
- [x] Deploy en Vercel (amsisrl-nuxt.vercel.app)
- [x] Asistente IA admin-only (/admin/asistente): chat con Gemini + consultas SQL de solo lectura (ver sección "Asistente IA")
- [x] Paquetes y extras dinámicos con gestión admin (/admin/catalogo) — precio snapshot en ventas
- [x] Dirección estructurada en ventas (dir_calle, dir_entre_calles, dir_localidad, dir_aclaracion)
- [x] Precio calculado automáticamente en formulario (paquete + extras, read-only para vendedor)
- [x] Estado 'coordinado' con fecha_coordinacion obligatoria
- [x] comentarios_gestion como log JSONB: {fecha_hora, autor, tipo ('comentario'|'estado'), texto}
- [x] Oficinistas solo pueden editar estado y agregar comentarios de gestión
- [x] API server-side protegida: todas las mutaciones via Nitro routes con auth + roles (server/api/)
- [x] Prospección / Mapa de clientes (/mapa): **ADMIN-ONLY por ahora** (middleware
      app/middleware/admin.ts en /mapa, /prospectos/[id], /prospectos/importar; el link
      aparece solo para admin en sidebar + menú móvil). Leaflet + OSM + clustering,
      prospectos con pipeline puerta a puerta (por_visitar→…→contratado/perdido/reconectar),
      historial de interacciones append-only, agenda de revisitas, quick-add con GPS,
      buscador de direcciones, import CSV (/prospectos/importar) + desde ventas (todas, con
      mapeo de estado), conversión prospecto→venta (?prospecto= en /ventas/nueva + link-venta).
      Geocodificación: georef-ar por DEPARTAMENTO + validación por distancia al centroide de
      la localidad (georef falla con localidad_censal), Nominatim de fallback, cache; alias de
      localidades y centroides en server/utils/geo.ts. Direcciones que ningún mapa encuentra
      (pueblos chicos) → botón "Ubicar aprox." las pone en el centro del pueblo con
      ubicacion_aproximada=true (pin punteado, ajustable; se limpia al reubicar a mano).
      Visibilidad por rol en la data (RLS + RPC prospectos_mapa() con solo columnas seguras),
      lista para reactivar el acceso a vendedores/líderes cuando se quiera.
      La capa del mapa se pagina (.range de a 1000) porque PostgREST corta las RPC en 1000.
      Diseño: docs/plans/2026-07-12-prospectos-mapa-design.md
      Migraciones: docs/migrations/2026-07-12-prospectos-mapa.sql y 2026-07-13-prospectos-ubicacion-aproximada.sql
