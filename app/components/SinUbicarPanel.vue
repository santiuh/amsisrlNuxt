<template>
  <UModal v-model="abierto" :ui="{ width: 'sm:max-w-lg' }">
    <div class="p-4 sm:p-5">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-[15px] font-bold text-gray-900 dark:text-white">
          Prospectos sin ubicar
        </h3>
        <button
          type="button"
          class="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Cerrar"
          @click="abierto = false"
        >
          <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
        </button>
      </div>
      <p class="text-[12px] text-gray-500 dark:text-slate-400 mb-3">
        Intentá geocodificar por dirección, o tocá "Colocar" para marcarlos a mano en el mapa.
      </p>

      <div class="flex flex-wrap items-center gap-2 mb-2">
        <UButton
          size="xs"
          color="cyan"
          variant="soft"
          icon="i-heroicons-globe-americas"
          :label="geocodificandoTodos ? 'Geocodificando…' : 'Geocodificar todos'"
          :loading="geocodificandoTodos"
          :disabled="items.length === 0 || ubicandoAprox"
          @click="geocodificarTodos"
        />
        <UButton
          v-if="geocodificandoTodos"
          size="xs"
          color="gray"
          variant="ghost"
          label="Cancelar"
          @click="cancelarGeocode = true"
        />
        <span v-if="progresoTexto" class="text-[12px] font-medium text-gray-500 dark:text-slate-400">
          {{ progresoTexto }}
        </span>
      </div>

      <!-- Ubicación aproximada para lo que no se pudo geocodificar -->
      <div class="mb-3 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-500/[0.07] ring-1 ring-amber-200/60 dark:ring-amber-500/20">
        <p class="text-[11px] text-amber-800 dark:text-amber-200/90 mb-1.5 leading-snug">
          Las direcciones que ningún mapa encuentra (calles de pueblos chicos) podés
          colocarlas en el <span class="font-semibold">centro del pueblo</span> como
          ubicación aproximada (pin punteado), y ajustarlas cuando el vendedor pase.
        </p>
        <UButton
          size="xs"
          color="amber"
          variant="soft"
          icon="i-heroicons-map-pin"
          :label="ubicandoAprox ? 'Ubicando…' : 'Ubicar el resto aprox. en su localidad'"
          :loading="ubicandoAprox"
          :disabled="items.length === 0 || geocodificandoTodos"
          @click="ubicarAproximado"
        />
      </div>

      <div class="max-h-[50dvh] overflow-y-auto space-y-1.5">
        <div v-if="cargando" class="py-6 flex justify-center">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
        </div>

        <p v-else-if="items.length === 0" class="py-6 text-center text-[13px] text-gray-400">
          ¡Todos los prospectos visibles están ubicados! 🎉
        </p>

        <div
          v-for="p in items"
          :key="p.id"
          class="flex items-center gap-2 px-3 py-2 rounded-xl ring-1 ring-gray-200/70 dark:ring-white/[0.06]"
        >
          <div class="min-w-0 flex-1">
            <p class="text-[13px] font-semibold text-gray-800 dark:text-gray-100 truncate">
              {{ p.nombre || 'Sin nombre' }}
            </p>
            <p class="text-[11px] text-gray-500 dark:text-slate-400 truncate">
              {{ direccionCompleta(p) || 'Sin dirección' }}
            </p>
          </div>
          <span
            v-if="resultados[p.id]"
            class="shrink-0 text-[11px] font-semibold"
            :class="resultados[p.id] === 'ok' ? 'text-emerald-500' : 'text-amber-500'"
          >
            {{ resultados[p.id] === 'ok' ? 'Ubicado ✓' : 'No encontrado' }}
          </span>
          <UButton
            v-if="!resultados[p.id] && p.dir_calle"
            size="2xs"
            color="cyan"
            variant="ghost"
            icon="i-heroicons-globe-americas"
            :loading="geocodificando === p.id"
            aria-label="Geocodificar"
            @click="geocodificar(p)"
          />
          <UButton
            size="2xs"
            color="gray"
            variant="outline"
            label="Colocar"
            icon="i-heroicons-cursor-arrow-rays"
            @click="emit('colocar', p.id)"
          />
        </div>
      </div>
    </div>
  </UModal>
</template>

<script setup lang="ts">
import type { ProspectoRow } from '~/utils/prospectoUI'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'colocar', id: string): void
  (e: 'cambio'): void
}>()

const client = useSupabaseClient()
const toast = useToast()

const abierto = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const items = ref<ProspectoRow[]>([])
const cargando = ref(false)
const geocodificando = ref<string | null>(null)
const geocodificandoTodos = ref(false)
const ubicandoAprox = ref(false)
const cancelarGeocode = ref(false)
const progresoTexto = ref('')
const resultados = reactive<Record<string, 'ok' | 'no'>>({})

const cargarItems = async () => {
  cargando.value = true
  const { data } = await client
    .from('prospectos')
    .select('*')
    .is('lat', null)
    .order('created_at', { ascending: false })
    .limit(300)
  items.value = (data ?? []) as ProspectoRow[]
  cargando.value = false
}

watch(abierto, (v) => {
  if (v) {
    Object.keys(resultados).forEach(k => delete resultados[k])
    cargarItems()
  }
})

// Geocodifica un prospecto y, si hay resultado, guarda las coords
const geocodificarUno = async (p: ProspectoRow): Promise<boolean> => {
  const res: any = await $fetch('/api/geo/geocode', {
    method: 'POST',
    body: { calle: p.dir_calle, localidad: p.dir_localidad ?? '' },
  })
  if (res.found) {
    await $fetch(`/api/prospectos/${p.id}`, {
      method: 'PUT',
      body: { lat: res.lat, lng: res.lng },
    })
    resultados[p.id] = 'ok'
    return true
  }
  resultados[p.id] = 'no'
  return false
}

const geocodificar = async (p: ProspectoRow) => {
  geocodificando.value = p.id
  try {
    const ok = await geocodificarUno(p)
    if (ok) emit('cambio')
    else toast.add({ title: 'Dirección no encontrada', description: 'Ubicalo a mano con "Colocar".', color: 'amber' })
  } catch (err: any) {
    toast.add({ title: 'Error al geocodificar', description: err.data?.statusMessage || err.message, color: 'red' })
  } finally {
    geocodificando.value = null
  }
}

// Coloca todos los pendientes en el centro de su localidad (aproximado)
const ubicarAproximado = async () => {
  ubicandoAprox.value = true
  try {
    const res: any = await $fetch('/api/prospectos/ubicar-aproximado', { method: 'POST' })
    toast.add({
      title: `${res.ubicados} prospectos ubicados (aproximado)`,
      description: res.sin_localidad_conocida > 0
        ? `${res.sin_localidad_conocida} quedaron sin ubicar (localidad desconocida).`
        : 'Aparecen con pin punteado en el centro de su pueblo. Ajustalos con "Reubicar" cuando visites.',
      color: 'green',
      icon: 'i-heroicons-map-pin',
    })
    emit('cambio')
    await cargarItems()
  } catch (err: any) {
    toast.add({ title: 'Error al ubicar', description: err.data?.statusMessage || err.message, color: 'red' })
  } finally {
    ubicandoAprox.value = false
  }
}

// Masivo: el server usa la consulta BULK de georef (cientos de direcciones por
// request), así que procesa TODOS los pendientes (no solo los listados acá)
// en tandas de ~200 en segundos, sin el límite de 1/seg de Nominatim.
const geocodificarTodos = async () => {
  geocodificandoTodos.value = true
  cancelarGeocode.value = false
  progresoTexto.value = 'Arrancando…'
  let ubicados = 0
  let sinResultado = 0
  try {
    // Fase 1: georef masivo (rápido)
    let offset = 0
    while (!cancelarGeocode.value) {
      const res: any = await $fetch('/api/geo/geocode-lote', {
        method: 'POST',
        body: { offset },
      })
      if (!res.procesados) break
      ubicados += res.ubicados
      sinResultado += res.sin_resultado
      // Los ubicados salen del conjunto pendiente; los "sin resultado" quedan
      offset += res.procesados - res.ubicados
      progresoTexto.value = `${ubicados} ubicados · ${sinResultado} pasan a fase 2`
    }

    // Fase 2: Nominatim/OSM para lo que georef no encontró (~2 seg por dirección)
    let ubicadosOsm = 0
    let sinResultadoOsm = 0
    offset = 0
    while (!cancelarGeocode.value) {
      const res: any = await $fetch('/api/geo/geocode-lote', {
        method: 'POST',
        body: { offset, modo: 'nominatim' },
      })
      if (!res.procesados) break
      ubicadosOsm += res.ubicados
      sinResultadoOsm += res.sin_resultado
      offset += res.procesados - res.ubicados
      progresoTexto.value = `Fase 2 (OSM, lenta): ${ubicadosOsm} ubicados · ${sinResultadoOsm} sin resultado — podés cancelar y retomar después`
    }

    ubicados += ubicadosOsm
    toast.add({
      title: 'Geocodificación terminada',
      description: `${ubicados} ubicados en el mapa, ${sinResultadoOsm} sin encontrar (ubicalos a mano con "Colocar").`,
      color: ubicados > 0 ? 'green' : 'amber',
    })
  } catch (err: any) {
    toast.add({ title: 'Error al geocodificar', description: err.data?.statusMessage || err.message, color: 'red' })
  } finally {
    geocodificandoTodos.value = false
    progresoTexto.value = ''
    if (ubicados > 0) emit('cambio')
    await cargarItems()
  }
}
</script>
