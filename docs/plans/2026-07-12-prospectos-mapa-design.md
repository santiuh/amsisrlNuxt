# Prospección / Mapa de clientes — Diseño

**Fecha:** 2026-07-12 · **Migración:** `docs/migrations/2026-07-12-prospectos-mapa.sql` (aplicada vía MCP)

## Problema

La comercializadora vende puerta a puerta pero el CRM solo registra ventas: no hay
registro de casas visitadas, ofertas rechazadas, motivos de pérdida ni agenda de
revisitas. Dos vendedores pueden trabajar la misma casa sin saberlo.

## Solución

Herramienta de prospección centrada en un mapa interactivo (`/mapa`):

- **Prospectos** con pipeline: `por_visitar → ausente / visitado → ofrecido → contratado | perdido | reconectar`.
  `perdido` exige `motivo_perdida` (CHECK en DB + validación en server).
- **Interacciones** append-only por prospecto (visita, llamada, whatsapp, red social)
  con resultado, comentario y `proxima_visita` para agendar revisitas.
- **Canal de origen**: puerta_a_puerta, telefono, whatsapp, instagram, facebook, referido, otro.
- **Conversión**: botón "Crear venta" → `/ventas/nueva?prospecto=<id>` prefillado; al
  guardar, `link-venta` setea `venta_id` + `estado='contratado'`. El mapa es también
  mapa de clientes (pines contratados).
- **Import**: CSV con mapeo de columnas (papaparse) + generación desde ventas existentes.
  Filas sin coordenadas quedan "sin ubicar" (geocodificación best-effort georef-ar →
  Nominatim con `geocode_cache`, o colocación manual en el mapa).
- **Mobile-first**: quick-add con GPS ("Cargar acá"), bottom sheet, chips de filtros.
  El tab "Comisiones" de la bottom nav se reemplaza por "Mapa".

## Estado del acceso (2026-07-13)

**ADMIN-ONLY por ahora.** A pedido del dueño, `/mapa`, `/prospectos/[id]` y
`/prospectos/importar` están restringidas a rol admin (`app/middleware/admin.ts`),
y el link "Mapa de Clientes" aparece solo para admin en la sidebar y el menú móvil.
La bottom nav móvil volvió a "Comisiones". Toda la lógica de visibilidad por rol
(RLS + RPC) quedó construida y probada: para reactivar el acceso a vendedores/líderes
alcanza con sacar el middleware `admin` de esas páginas y devolver el link a todos los
roles en la nav. Las rutas server/api/prospectos/* siguen aceptando vendedor/lider
(protegidas por RLS), justamente para esa reactivación futura.

## Extras implementados (más allá del plan original)

- **Buscador de direcciones** en el mapa (`/api/geo/buscar`, georef + OSM en paralelo).
- **Reubicar pin** desde la sheet y la ficha.
- **Ubicación aproximada**: `prospectos.ubicacion_aproximada` + `/api/prospectos/ubicar-aproximado`.
  Las direcciones que ni georef ni OSM encuentran (calles de pueblos chicos) se colocan
  en el centro de su localidad (con jitter), pin punteado, ajustable; reubicar a mano la
  vuelve exacta. Migración `docs/migrations/2026-07-13-prospectos-ubicacion-aproximada.sql`.
- **Geocodificación por departamento + validación por distancia** (georef falla filtrando
  por localidad_censal): tabla de localidades → dep/centroide/prov en `server/utils/geo.ts`.
- **Paginación de la capa del mapa**: PostgREST corta las RPC en 1000 filas → `useProspectosMapa`
  pagina con `.range()` + `.order('id')` para traer todos los pines.

### Bugs de renderizado de Leaflet resueltos (para no repetir)

- Mapa en blanco al cargar: doble montaje del componente `.client.vue` → init idempotente
  (guarda `if (map || _leaflet_id)`) + reintento en `nextTick`.
- Tiles invisibles (ancho 0): el reset global `img{max-width:100%}` de Nuxt UI clampeaba
  el ancho del tile (contenedor Leaflet de ancho 0) → `max-width:none !important` en los tiles.
- Mapa tapando la UI al hacer zoom: faltaba `overflow:hidden` + stacking context (`z-index:0`)
  en el contenedor. NO usar `isolation:isolate` en el contenedor (recompone y parpadea al
  togglear clases).

## Visibilidad (decisión del dueño)

| Rol | Filas completas | Capa de mapa (pines) |
|---|---|---|
| vendedor | propias | todos (ajenos: solo estado/fecha/vendedor/localidad) |
| lider | propias + su grupo | todos (ídem) |
| oficinista/admin | todas | todos |

Enforzado en DB, no en UI:
- **RLS** en `prospectos` (políticas aditivas own/lider_grupo/staff, patrón `ventas`).
- **RPC `prospectos_mapa()`** SECURITY DEFINER: expone SOLO columnas seguras
  (id, lat/lng, estado, fechas, vendedor id+nombre, localidad, flag `acceso_completo`).
  ⚠️ Nunca agregar teléfono/nombre del cliente/notas/dirección exacta sin revisar esto.
- `prospecto_interacciones` hereda el acceso vía subquery a `prospectos` (corre bajo
  el RLS del usuario). Sin UPDATE/DELETE → inmutable.

## Arquitectura

- Lecturas client-side bajo RLS (`from('prospectos')`, `rpc('prospectos_mapa')`).
- Escrituras vía `server/api/prospectos/*` y `server/api/geo/geocode` con
  `requireProfile`/`requireRole`/`requireAdmin`.
- `fecha_ultima_interaccion` y `proxima_visita` en `prospectos` son denormalizados:
  los mantiene `interacciones.post.ts` (sin triggers, convención del proyecto).
- Mapa: Leaflet + OSM + markercluster, lazy-import en `ProspectoMap.client.vue`
  (sin plugin global; solo paga el peso quien abre el mapa). Pines `L.divIcon`
  coloreados por estado (`app/utils/prospectoUI.ts`).

## Geocodificación (estrategia validada con datos reales, 2026-07-12)

- **Masivo** (`/api/geo/geocode-lote`, botón "Geocodificar todos"): tandas de 200
  server-side → cache en bloque → **consulta BULK de georef** (100 direcciones por
  POST, sin límite de 1/seg). El panel encadena tandas por offset hasta agotar
  pendientes.
- **Hallazgo clave**: filtrar georef por `localidad_censal` falla — INDEC asigna
  cuadras a localidades censales que no coinciden con el nombre coloquial (ej.
  "Villa Elvira" dentro de Capitán Bermúdez). La estrategia correcta es consultar
  por **departamento** (máx. 3 candidatos) y **validar por distancia al centroide**
  de la localidad esperada (~15 km). Tabla de localidades → departamento/centroide
  en `server/utils/geo.ts` (`LOCALIDAD_GEO`, centroides de georef /localidades).
- **Alias de localidades**: los vendedores cargan abreviado ("Baigorria",
  "C. Bermudez", "F. L. Beltran"...). `normalizarLocalidad()` traduce al nombre
  censal. `limpiarCalle()` corta "dto/piso/casa..." que rompen el match.
- **Cobertura**: georef no tiene calles de localidades chicas (Barrancas casi
  entera). **Nominatim** (OSM) sí las tiene → es el fallback del endpoint
  individual (`/api/geo/geocode`): búsqueda estructurada street/city/state, luego
  texto libre, siempre validando distancia. Cache miss de georef se marca
  `provider='georef_miss'` para que el individual salte directo a Nominatim.
- Al agregar una zona de venta nueva, agregar la localidad a `LOCALIDAD_GEO`
  y su alias a `normalizarLocalidad` (verificar centroide en
  `apis.datos.gob.ar/georef/api/localidades?nombre=...`).

## Verificación RLS realizada (2026-07-12, transacciones con rollback)

- Vendedor A: SELECT directo solo ve sus filas; `prospectos_mapa()` devuelve pin
  ajeno con `acceso_completo=false` y sin datos sensibles. ✔
- Líder: ve filas de su grupo, no de otros grupos; flags de mapa correctos. ✔
- INSERT de interacción sobre prospecto ajeno → 42501 RLS violation. ✔
- INSERT de prospecto con `vendedor_id` ajeno como vendedor → 42501 RLS violation. ✔

## Fuera de v1 (mejoras futuras anotadas)

- Soporte XLSX en el import (hoy: guardar como CSV desde Excel).
- Quick-adds offline (patrón localStorage de `useBorradorVentas.ts`).
- IA (resumen de motivos de pérdida, zonas calientes) — decidido posponer.
- Zonas dibujadas/asignadas por grupo (leaflet-draw).
- Bounding-box server-side en la RPC si el volumen de pines supera ~10k.
