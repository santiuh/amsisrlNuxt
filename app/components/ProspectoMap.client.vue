<template>
  <div
    ref="mapEl"
    class="w-full h-full prospecto-map"
    :class="{ 'modo-colocar': modoColocar, 'map-dark': isDark }"
  />
</template>

<script setup lang="ts">
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import type { ProspectoPin } from '~/utils/prospectoUI'

const props = defineProps<{
  puntos: ProspectoPin[]
  seleccionado?: string | null
  modoColocar?: boolean
  // Mini-mapa embebido (ficha): centra en su punto, no usa/pisa la vista guardada
  miniatura?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'place', latlng: { lat: number; lng: number }): void
  (e: 'longpress', latlng: { lat: number; lng: number }): void
}>()

const mapEl = ref<HTMLElement | null>(null)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

let map: L.Map | null = null
let cluster: L.MarkerClusterGroup | null = null
let miUbicacion: L.Marker | null = null
let busquedaMarker: L.Marker | null = null
const markersById = new Map<string, L.Marker>()

// Vista persistida entre navegaciones (misma sesión)
const vistaGuardada = useState<{ lat: number; lng: number; zoom: number } | null>(
  'prospecto-map-vista',
  () => null,
)

// Centro por defecto si no hay pines ni vista guardada (Buenos Aires)
const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816]

const iconoPin = (p: ProspectoPin, selected: boolean) =>
  L.divIcon({
    className: 'prospecto-pin-wrap',
    html: `<div class="prospecto-pin${selected ? ' prospecto-pin--sel' : ''}${p.acceso_completo ? '' : ' prospecto-pin--ajeno'}${p.ubicacion_aproximada ? ' prospecto-pin--aprox' : ''}" style="--pin:${prospectoPinColor(p.estado)}"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })

const renderMarkers = () => {
  if (!map || !cluster) return
  cluster.clearLayers()
  markersById.clear()
  const layers: L.Marker[] = []
  for (const p of props.puntos) {
    const m = L.marker([p.lat, p.lng], { icon: iconoPin(p, p.id === props.seleccionado) })
    m.on('click', () => emit('select', p.id))
    markersById.set(p.id, m)
    layers.push(m)
  }
  cluster.addLayers(layers)
}

const fitATodos = () => {
  if (!map || props.puntos.length === 0) return
  const bounds = L.latLngBounds(props.puntos.map(p => [p.lat, p.lng] as [number, number]))
  map.fitBounds(bounds.pad(0.15), { maxZoom: 16 })
}

const centrarEn = (lat: number, lng: number, zoom = 17) => {
  map?.setView([lat, lng], zoom)
}

// Marca el resultado de una búsqueda de dirección con un pin distintivo y centra
const marcarBusqueda = (lat: number, lng: number) => {
  if (!map) return
  if (busquedaMarker) busquedaMarker.remove()
  busquedaMarker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: 'prospecto-pin-wrap',
      html: '<div class="busqueda-pin"><span></span></div>',
      iconSize: [30, 42],
      iconAnchor: [15, 42],
    }),
    interactive: false,
    zIndexOffset: 1000,
  }).addTo(map)
  map.setView([lat, lng], 17)
}

const limpiarBusqueda = () => {
  if (busquedaMarker) {
    busquedaMarker.remove()
    busquedaMarker = null
  }
}

// Marca la posición GPS del usuario y centra el mapa. Devuelve las coords.
const irAMiUbicacion = () =>
  new Promise<{ lat: number; lng: number }>((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Este dispositivo no tiene GPS disponible'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (map) {
          if (miUbicacion) miUbicacion.remove()
          miUbicacion = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'prospecto-pin-wrap',
              html: '<div class="mi-ubicacion-dot"></div>',
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            }),
            interactive: false,
          }).addTo(map)
          map.setView([lat, lng], Math.max(map.getZoom(), 16))
        }
        resolve({ lat, lng })
      },
      (err) => {
        reject(new Error(
          err.code === err.PERMISSION_DENIED
            ? 'Permiso de ubicación denegado. Activalo en el navegador.'
            : 'No se pudo obtener tu ubicación',
        ))
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    )
  })

let resizeObserver: ResizeObserver | null = null

// Init idempotente: guarda contra doble init (el componente puede montar dos
// veces con el ref nulo en la primera pasada en algunos entornos/Suspense).
const initMap = () => {
  if (map || !mapEl.value) return
  if ((mapEl.value as any)._leaflet_id) return

  map = L.map(mapEl.value, { zoomControl: false })
  L.control.zoom({ position: 'bottomright' }).addTo(map)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)

  cluster = L.markerClusterGroup({
    maxClusterRadius: 48,
    disableClusteringAtZoom: 17,
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
  })
  map.addLayer(cluster)

  if (props.miniatura && props.puntos.length > 0) {
    map.setView([props.puntos[0].lat, props.puntos[0].lng], 16)
  } else if (props.miniatura) {
    map.setView(DEFAULT_CENTER, 13)
  } else if (vistaGuardada.value) {
    map.setView([vistaGuardada.value.lat, vistaGuardada.value.lng], vistaGuardada.value.zoom)
  } else if (props.puntos.length > 0) {
    fitATodos()
  } else {
    map.setView(DEFAULT_CENTER, 13)
  }

  if (!props.miniatura) {
    map.on('moveend', () => {
      if (!map) return
      const c = map.getCenter()
      vistaGuardada.value = { lat: c.lat, lng: c.lng, zoom: map.getZoom() }
    })
  }

  // En recarga directa el layout puede asentarse después del init de Leaflet
  // (tiles en blanco): recalcular tamaño apenas se estabiliza y ante resizes.
  setTimeout(() => map?.invalidateSize(), 150)
  if ('ResizeObserver' in window && mapEl.value) {
    resizeObserver = new ResizeObserver(() => map?.invalidateSize())
    resizeObserver.observe(mapEl.value)
  }

  map.on('click', (e: L.LeafletMouseEvent) => {
    if (props.modoColocar) emit('place', { lat: e.latlng.lat, lng: e.latlng.lng })
  })

  // En mobile, Leaflet dispara contextmenu con long-press
  map.on('contextmenu', (e: L.LeafletMouseEvent) => {
    emit('longpress', { lat: e.latlng.lat, lng: e.latlng.lng })
  })

  renderMarkers()

  // Si la primera carga de pines llega después del mount y no había vista guardada
  if (!vistaGuardada.value && props.puntos.length === 0) {
    const stop = watch(() => props.puntos.length, (n) => {
      if (n > 0 && !vistaGuardada.value) {
        fitATodos()
        stop()
      }
    })
  }
}

onMounted(() => {
  initMap()
  // Reintento si el ref no estaba listo en la primera pasada
  if (!map) nextTick(initMap)
})

watch(() => props.puntos, renderMarkers)

// Nota: NO llamar invalidateSize al togglear modo-colocar. El tamaño del mapa no
// cambia (los overlays son absolute), e invalidateSize forzaba un reset de tiles
// que los dejaba parpadear/en blanco. El ResizeObserver ya cubre cambios reales
// de tamaño.

watch(() => props.seleccionado, (nuevo, anterior) => {
  for (const id of [anterior, nuevo]) {
    if (!id) continue
    const marker = markersById.get(id)
    const pin = props.puntos.find(p => p.id === id)
    if (marker && pin) marker.setIcon(iconoPin(pin, id === nuevo))
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  map?.remove()
  map = null
  cluster = null
  markersById.clear()
})

defineExpose({ centrarEn, fitATodos, irAMiUbicacion, marcarBusqueda, limpiarBusqueda, invalidateSize: () => map?.invalidateSize() })
</script>

<style>
/* Sin scoped: Leaflet renderiza los pines fuera del alcance de Vue */

.prospecto-map {
  background: #dfe8ef;
  /* Recortar: si no, al hacer zoom Leaflet dibuja tiles fuera de la caja y se
     derraman sobre la barra/UI. */
  overflow: hidden;
  /* Stacking context propio: contiene los panes de Leaflet (z-index 200-700)
     para que no se pinten por encima de la UI de la app. */
  position: relative;
  z-index: 0;
}

.prospecto-map.modo-colocar .leaflet-container,
.prospecto-map.modo-colocar {
  cursor: crosshair !important;
}

/* El reset global `img, video { max-width: 100% }` (Tailwind/Nuxt UI) le gana al
   override de Leaflet (que no lleva !important) y, como el contenedor del tile
   tiene ancho 0, clampea el ancho del tile a 0 → mapa en blanco. Forzamos el
   tamaño natural de los tiles. */
.prospecto-map .leaflet-tile,
.prospecto-map .leaflet-tile-pane img,
.prospecto-map .leaflet-marker-pane img,
.prospecto-map .leaflet-image-layer {
  max-width: none !important;
}

.prospecto-pin-wrap {
  background: transparent;
  border: none;
}

.prospecto-pin {
  width: 22px;
  height: 22px;
  margin: 2px;
  border-radius: 9999px 9999px 9999px 2px;
  transform: rotate(-45deg);
  background: var(--pin, #64748b);
  border: 2.5px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s ease;
}

.prospecto-pin--sel {
  transform: rotate(-45deg) scale(1.35);
  box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.35), 0 3px 8px rgba(0, 0, 0, 0.4);
}

.prospecto-pin--ajeno {
  opacity: 0.75;
}

/* Ubicación aproximada (centro del pueblo): pin punteado/hueco para distinguirlo
   de una posición exacta confirmada. */
.prospecto-pin--aprox {
  background: transparent;
  border-style: dashed;
  border-color: var(--pin, #64748b);
  border-width: 3px;
  opacity: 0.9;
}

.mi-ubicacion-dot {
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: #0ea5e9;
  border: 3px solid #fff;
  box-shadow: 0 0 0 6px rgba(14, 165, 233, 0.25);
  animation: mi-ubicacion-pulse 2s ease-in-out infinite;
}

/* Pin del resultado de búsqueda de dirección (forma de gota, rojo) */
.busqueda-pin {
  width: 30px;
  height: 42px;
  position: relative;
  filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.4));
  animation: busqueda-drop 0.4s ease-out;
}
.busqueda-pin::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 0;
  width: 24px;
  height: 24px;
  border-radius: 50% 50% 50% 0;
  background: #ef4444;
  border: 3px solid #fff;
  transform: rotate(-45deg);
}
.busqueda-pin span {
  position: absolute;
  left: 11px;
  top: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  z-index: 1;
}
@keyframes busqueda-drop {
  0% { transform: translateY(-14px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes mi-ubicacion-pulse {
  0%, 100% { box-shadow: 0 0 0 6px rgba(14, 165, 233, 0.25); }
  50% { box-shadow: 0 0 0 12px rgba(14, 165, 233, 0.1); }
}

/* Modo oscuro: filtro clásico sobre los tiles.
   El translateZ mantiene el pane en su propia capa GPU para que el filtro no se
   caiga cuando repinta un hermano (ej. al togglear modo-colocar → tiles en blanco). */
.map-dark .leaflet-tile-pane {
  filter: invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.9) saturate(0.7);
  transform: translateZ(0);
  backface-visibility: hidden;
}

.map-dark {
  background: #0b1220;
}

.map-dark .leaflet-control-zoom a {
  background: #111827;
  color: #e5e7eb;
  border-color: rgba(255, 255, 255, 0.08);
}

.map-dark .leaflet-control-attribution {
  background: rgba(17, 24, 39, 0.7);
  color: #94a3b8;
}

.map-dark .leaflet-control-attribution a {
  color: #67e8f9;
}

/* En mobile la bottom nav tapa la franja inferior: subir controles/attribution */
@media (max-width: 767px) {
  .prospecto-map .leaflet-bottom {
    bottom: 72px;
  }
}
</style>
