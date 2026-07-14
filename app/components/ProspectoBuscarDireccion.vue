<template>
  <div class="w-full max-w-sm">
    <div class="relative">
      <div class="flex items-center gap-1.5 bg-white dark:bg-[#0f172a] rounded-xl shadow-lg ring-1 ring-gray-200/70 dark:ring-white/10 px-2.5 py-1.5">
        <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 shrink-0" />
        <input
          v-model="texto"
          type="text"
          placeholder="Buscar dirección en el mapa…"
          class="flex-1 min-w-0 bg-transparent text-[13px] text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
          @keydown.enter="buscar"
          @keydown.esc="cerrar"
          @focus="abierto = resultados.length > 0"
        >
        <UIcon v-if="cargando" name="i-heroicons-arrow-path" class="w-4 h-4 text-gray-400 animate-spin shrink-0" />
        <button
          v-else-if="texto"
          type="button"
          class="p-0.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
          aria-label="Limpiar"
          @click="limpiar"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <!-- Resultados -->
      <div
        v-if="abierto && (resultados.length > 0 || sinResultados)"
        class="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#0f172a] rounded-xl shadow-xl ring-1 ring-gray-200/70 dark:ring-white/10 overflow-hidden max-h-64 overflow-y-auto"
      >
        <p v-if="sinResultados" class="px-3 py-2.5 text-[12px] text-gray-400">
          No se encontró esa dirección. Probá agregando la localidad.
        </p>
        <button
          v-for="(r, i) in resultados"
          :key="i"
          type="button"
          class="w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors border-b border-gray-100 dark:border-white/[0.04] last:border-0"
          @click="elegir(r)"
        >
          <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span class="text-[12px] text-gray-700 dark:text-gray-200 leading-snug">{{ r.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Candidato {
  label: string
  lat: number
  lng: number
  fuente: string
}

const emit = defineEmits<{
  (e: 'seleccionar', c: Candidato): void
  (e: 'limpiar'): void
}>()

const toast = useToast()
const texto = ref('')
const resultados = ref<Candidato[]>([])
const cargando = ref(false)
const abierto = ref(false)
const sinResultados = ref(false)

const buscar = async () => {
  const q = texto.value.trim()
  if (q.length < 3) {
    toast.add({ title: 'Escribí al menos 3 caracteres', color: 'amber' })
    return
  }
  cargando.value = true
  sinResultados.value = false
  try {
    const res: any = await $fetch('/api/geo/buscar', { method: 'POST', body: { texto: q } })
    resultados.value = res.candidatos ?? []
    sinResultados.value = resultados.value.length === 0
    abierto.value = true
  } catch (err: any) {
    toast.add({ title: 'Error al buscar', description: err.data?.statusMessage || err.message, color: 'red' })
  } finally {
    cargando.value = false
  }
}

const elegir = (c: Candidato) => {
  emit('seleccionar', c)
  abierto.value = false
}

const limpiar = () => {
  texto.value = ''
  resultados.value = []
  abierto.value = false
  sinResultados.value = false
  emit('limpiar')
}

const cerrar = () => {
  abierto.value = false
}
</script>
