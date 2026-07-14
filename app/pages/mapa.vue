<template>
  <div class="fixed inset-x-0 top-0 md:top-16 bottom-0 lg:left-[260px] z-20 flex flex-col bg-[#f4f6f8] dark:bg-[#080e1a]">
    <!-- ═══ Barra superior: tabs + acciones + filtros ═══ -->
    <div class="shrink-0 px-3 pt-3 pb-2 space-y-2 bg-white/95 dark:bg-[#0b1220]/95 backdrop-blur border-b border-gray-200/60 dark:border-white/[0.06]">
      <div class="flex items-center gap-2">
        <!-- Tabs -->
        <div class="flex-1 grid grid-cols-3 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.05]">
          <button
            v-for="t in TABS"
            :key="t.value"
            type="button"
            class="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
            :class="tab === t.value
              ? 'bg-white dark:bg-[#1e293b] text-cyan-600 dark:text-cyan-400 shadow-sm'
              : 'text-gray-500 dark:text-slate-400'"
            @click="cambiarTab(t.value)"
          >
            <UIcon :name="t.icon" class="w-4 h-4" />
            {{ t.label }}
          </button>
        </div>

        <!-- Acciones -->
        <UButton
          v-if="puedeImportar"
          size="sm"
          color="gray"
          variant="ghost"
          icon="i-heroicons-arrow-up-tray"
          :to="'/prospectos/importar'"
          aria-label="Importar"
        />
        <UButton
          size="sm"
          color="gray"
          variant="ghost"
          icon="i-heroicons-arrow-path"
          :loading="cargando"
          aria-label="Actualizar"
          @click="cargar(true)"
        />
      </div>

      <ProspectoFilters :mostrar-busqueda="tab !== 'mapa'" />

      <!-- Aviso de "sin ubicar" -->
      <button
        v-if="tab === 'mapa' && sinUbicar > 0"
        type="button"
        class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[12px] font-medium"
        @click="sinUbicarAbierto = true"
      >
        <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 shrink-0" />
        {{ sinUbicar }} prospecto{{ sinUbicar === 1 ? '' : 's' }} sin ubicar en el mapa
        <span class="ml-auto underline">Ubicar</span>
      </button>
    </div>

    <!-- ═══ Contenido ═══ -->
    <div class="relative flex-1 min-h-0">
      <!-- ── Tab MAPA ── -->
      <template v-if="tab === 'mapa'">
        <ProspectoMap
          ref="mapRef"
          :puntos="pinsFiltrados"
          :seleccionado="selId"
          :modo-colocar="!!modoColocar"
          @select="seleccionarPin"
          @place="onPlace"
          @longpress="onLongPress"
        />

        <!-- Buscador de direcciones (flotante arriba a la izquierda) -->
        <div v-if="!modoColocar" class="absolute top-3 left-3 right-3 md:right-auto z-[600]">
          <ProspectoBuscarDireccion @seleccionar="onBuscarDireccion" @limpiar="onLimpiarBusqueda" />
        </div>

        <!-- Banner modo colocar -->
        <div
          v-if="modoColocar"
          class="absolute top-3 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900/90 text-white text-[12px] font-semibold shadow-lg backdrop-blur"
        >
          <UIcon name="i-heroicons-cursor-arrow-rays" class="w-4 h-4" />
          Tocá el mapa para {{ modoColocar === 'nuevo' ? 'marcar la casa' : 'ubicar el prospecto' }}
          <button type="button" class="ml-1 underline opacity-80" @click="cancelarColocar">Cancelar</button>
        </div>

        <!-- Error de carga -->
        <div
          v-if="error"
          class="absolute top-3 left-3 right-3 z-[600] px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[12px] font-medium ring-1 ring-rose-200 dark:ring-rose-500/20"
        >
          {{ error }} —
          <button type="button" class="underline" @click="cargar(true)">reintentar</button>
        </div>

        <!-- FABs -->
        <div class="absolute right-3 bottom-24 md:bottom-6 z-[600] flex flex-col items-end gap-2.5">
          <button
            type="button"
            class="w-11 h-11 rounded-full bg-white dark:bg-[#1e293b] shadow-lg ring-1 ring-gray-200/70 dark:ring-white/10 flex items-center justify-center text-gray-600 dark:text-gray-200 active:scale-95 transition-transform"
            aria-label="Mi ubicación"
            @click="irAMiUbicacion"
          >
            <UIcon name="i-heroicons-viewfinder-circle" class="w-5 h-5" />
          </button>
          <button
            type="button"
            class="h-13 pl-4 pr-5 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white shadow-[0_8px_24px_-4px_rgba(8,145,178,0.5)] flex items-center gap-2 text-[14px] font-bold active:scale-95 transition-transform"
            @click="cargarAca"
          >
            <UIcon name="i-heroicons-map-pin" class="w-5 h-5" />
            Cargar acá
          </button>
        </div>

        <!-- Sheet de detalle -->
        <ProspectoSheet
          ref="sheetRef"
          :pin="pinSeleccionado"
          @close="selId = null"
          @interaccion="abrirInteraccion"
          @crear-venta="crearVenta"
          @reubicar="iniciarReubicar"
        />
      </template>

      <!-- ── Tab LISTA ── -->
      <div v-else-if="tab === 'lista'" class="h-full px-3 pt-2">
        <ProspectoLista ref="listaRef" />
      </div>

      <!-- ── Tab AGENDA ── -->
      <div v-else class="h-full px-3 pt-2">
        <ProspectoAgendaList ref="agendaRef" @ver-en-mapa="verEnMapa" />
      </div>
    </div>

    <!-- Modales -->
    <ProspectoQuickAdd
      v-model="quickAddAbierto"
      :coords="quickAddCoords"
      @saved="onProspectoCreado"
    />
    <ProspectoInteraccionForm
      v-model="interaccionAbierta"
      :prospecto="interaccionProspecto"
      :atajo="interaccionAtajo"
      @saved="onInteraccionGuardada"
    />
    <SinUbicarPanel
      v-model="sinUbicarAbierto"
      @colocar="iniciarColocarExistente"
      @cambio="onSinUbicarCambio"
    />
  </div>
</template>

<script setup lang="ts">
import type { ProspectoRow } from '~/utils/prospectoUI'

definePageMeta({ middleware: ['admin'] })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const profile = useCurrentProfile()
const client = useSupabaseClient()

const {
  pins, pinsFiltrados, cargando, error, cargar,
} = useProspectosMapa()

const TABS = [
  { value: 'mapa', label: 'Mapa', icon: 'i-heroicons-map' },
  { value: 'lista', label: 'Lista', icon: 'i-heroicons-list-bullet' },
  { value: 'agenda', label: 'Agenda', icon: 'i-heroicons-calendar-days' },
]

const tab = computed(() => {
  const t = route.query.tab as string
  return ['mapa', 'lista', 'agenda'].includes(t) ? t : 'mapa'
})

const cambiarTab = (t: string) => {
  router.replace({ query: { ...route.query, tab: t === 'mapa' ? undefined : t } })
}

const puedeImportar = computed(() => !!profile.value)

// ─── Selección de pin y sheet ───
const mapRef = ref<any>(null)
const sheetRef = ref<any>(null)
const listaRef = ref<any>(null)
const agendaRef = ref<any>(null)
const selId = ref<string | null>(null)

const pinSeleccionado = computed(() =>
  pinsFiltrados.value.find(p => p.id === selId.value) ?? null,
)

const seleccionarPin = (id: string) => {
  // En modo colocar, el tap es para elegir posición, no para abrir la sheet
  if (modoColocar.value) return
  selId.value = id
}

// ─── Quick add (cargar acá) ───
const quickAddAbierto = ref(false)
const quickAddCoords = ref<{ lat: number; lng: number } | null>(null)

// 'nuevo' = colocar pin para prospecto nuevo; string = id de prospecto sin ubicar
const modoColocar = ref<'nuevo' | string | null>(null)

const cargarAca = async () => {
  try {
    const coords = await mapRef.value?.irAMiUbicacion()
    if (coords) {
      quickAddCoords.value = coords
      quickAddAbierto.value = true
    }
  } catch (err: any) {
    toast.add({ title: err.message, description: 'Tocá el mapa para marcar la casa a mano.', color: 'amber' })
    modoColocar.value = 'nuevo'
  }
}

const onLongPress = (latlng: { lat: number; lng: number }) => {
  if (modoColocar.value) return
  quickAddCoords.value = latlng
  quickAddAbierto.value = true
}

const onPlace = async (latlng: { lat: number; lng: number }) => {
  if (modoColocar.value === 'nuevo') {
    modoColocar.value = null
    quickAddCoords.value = latlng
    quickAddAbierto.value = true
  } else if (modoColocar.value) {
    // Ubicar (o reubicar) un prospecto existente
    const id = modoColocar.value
    modoColocar.value = null
    try {
      await $fetch(`/api/prospectos/${id}`, { method: 'PUT', body: { lat: latlng.lat, lng: latlng.lng } })
      toast.add({ title: 'Ubicación actualizada', color: 'green', icon: 'i-heroicons-map-pin' })
      await cargar(true)
      await contarSinUbicar()
      selId.value = id
    } catch (err: any) {
      toast.add({ title: 'Error al ubicar', description: err.data?.statusMessage || err.message, color: 'red' })
    }
  }
}

const cancelarColocar = () => {
  modoColocar.value = null
}

const onProspectoCreado = async (id: string) => {
  await cargar(true)
  await contarSinUbicar()
  selId.value = id
}

const irAMiUbicacion = async () => {
  try {
    await mapRef.value?.irAMiUbicacion()
  } catch (err: any) {
    toast.add({ title: err.message, color: 'amber' })
  }
}

// ─── Búsqueda de direcciones ───
const onBuscarDireccion = (c: { lat: number; lng: number; label: string }) => {
  selId.value = null
  mapRef.value?.marcarBusqueda(c.lat, c.lng)
}

const onLimpiarBusqueda = () => {
  mapRef.value?.limpiarBusqueda()
}

// ─── Interacciones ───
const interaccionAbierta = ref(false)
const interaccionProspecto = ref<ProspectoRow | null>(null)
const interaccionAtajo = ref<string | null>(null)

const abrirInteraccion = (prospecto: ProspectoRow, atajo: string | null) => {
  interaccionProspecto.value = prospecto
  interaccionAtajo.value = atajo
  interaccionAbierta.value = true
}

const onInteraccionGuardada = async () => {
  await cargar(true)
  sheetRef.value?.recargar()
  agendaRef.value?.refrescar?.()
}

// ─── Conversión a venta ───
const crearVenta = (prospecto: ProspectoRow) => {
  navigateTo(`/ventas/nueva?prospecto=${prospecto.id}`)
}

// ─── Agenda → mapa ───
const verEnMapa = (prospecto: ProspectoRow) => {
  cambiarTab('mapa')
  nextTick(() => {
    if (prospecto.lat != null && prospecto.lng != null) {
      mapRef.value?.centrarEn(prospecto.lat, prospecto.lng)
      selId.value = prospecto.id
    }
  })
}

// ─── Sin ubicar ───
const sinUbicarAbierto = ref(false)
const sinUbicar = ref(0)

const contarSinUbicar = async () => {
  const { count } = await client
    .from('prospectos')
    .select('id', { count: 'exact', head: true })
    .is('lat', null)
  sinUbicar.value = count ?? 0
}

const iniciarColocarExistente = (id: string) => {
  sinUbicarAbierto.value = false
  cambiarTab('mapa')
  modoColocar.value = id
}

// Reubicar un pin existente: cierra la sheet y activa el modo colocar sobre ese id
const iniciarReubicar = (prospecto: ProspectoRow) => {
  selId.value = null
  modoColocar.value = prospecto.id
}

const onSinUbicarCambio = async () => {
  await cargar(true)
  await contarSinUbicar()
}

onMounted(async () => {
  await cargar()
  await contarSinUbicar()
  // Viniendo del import: abrir directamente el panel de "sin ubicar"
  if (route.query.sinubicar) {
    sinUbicarAbierto.value = true
    router.replace({ query: { ...route.query, sinubicar: undefined } })
  }
  // Viniendo de la ficha con "Reubicar en el mapa"
  const reubicarId = route.query.reubicar as string | undefined
  if (reubicarId) {
    modoColocar.value = reubicarId
    const pin = pins.value.find(p => p.id === reubicarId)
    if (pin) {
      nextTick(() => mapRef.value?.centrarEn(pin.lat, pin.lng))
    }
    router.replace({ query: { ...route.query, reubicar: undefined } })
  }
})

useHead({ title: 'Mapa de Clientes — AMSI SRL' })
</script>
