<template>
  <div class="max-w-3xl mx-auto space-y-4">
    <div class="flex items-center gap-2">
      <UButton size="xs" color="gray" variant="ghost" icon="i-heroicons-arrow-left" label="Volver al mapa" to="/mapa" />
    </div>

    <UCard :ui="{ body: { padding: 'px-4 py-4 sm:p-5' } }">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100">
            Importar prospectos
          </h2>
          <span v-if="paso > 1" class="text-[12px] text-gray-400">Paso {{ paso }} de 3</span>
        </div>
      </template>

      <!-- ═══ Paso 1: Archivo ═══ -->
      <template v-if="paso === 1">
        <div class="space-y-4">
          <div
            class="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl p-6 text-center hover:border-cyan-400 dark:hover:border-cyan-500/60 transition-colors cursor-pointer"
            @click="fileInput?.click()"
            @dragover.prevent
            @drop.prevent="onDrop"
          >
            <UIcon name="i-heroicons-document-arrow-up" class="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
            <p class="text-[14px] font-semibold text-gray-700 dark:text-gray-200">
              Subí un archivo CSV
            </p>
            <p class="text-[12px] text-gray-400 dark:text-slate-500 mt-1">
              Desde Excel: "Guardar como → CSV". Se detecta solo el separador (, o ;).
            </p>
            <input
              ref="fileInput"
              type="file"
              accept=".csv,text/csv"
              class="hidden"
              @change="onFileChange"
            >
          </div>

          <p v-if="parseError" class="text-[13px] text-rose-500">{{ parseError }}</p>

          <!-- Desde ventas (solo staff) -->
          <div v-if="esStaff" class="rounded-2xl ring-1 ring-gray-200/70 dark:ring-white/[0.06] p-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-table-cells" class="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
              <div class="flex-1">
                <p class="text-[14px] font-semibold text-gray-700 dark:text-gray-200">
                  Generar desde ventas existentes
                </p>
                <p class="text-[12px] text-gray-400 dark:text-slate-500 mt-0.5">
                  Crea un prospecto por cada venta cargada que todavía no tenga uno, con el estado que corresponde:
                  concretada → <span class="font-semibold">Contratado</span>, rechazada → <span class="font-semibold">Perdido</span> (para reintentar),
                  próxima zona → <span class="font-semibold">Reconectar</span>, en curso → <span class="font-semibold">Ofrecido</span>.
                  Quedan "sin ubicar" para geocodificar después.
                </p>
                <UButton
                  size="xs"
                  color="emerald"
                  variant="soft"
                  class="mt-2"
                  icon="i-heroicons-sparkles"
                  :label="generandoDesdeVentas ? 'Generando…' : 'Generar desde todas las ventas'"
                  :loading="generandoDesdeVentas"
                  @click="generarDesdeVentas"
                />
                <template v-if="resultadoDesdeVentas">
                  <p class="text-[12px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                    {{ resultadoDesdeVentas }}
                  </p>
                  <UButton
                    size="xs"
                    color="cyan"
                    class="mt-2"
                    icon="i-heroicons-map"
                    label="Siguiente: ubicarlos en el mapa"
                    to="/mapa?sinubicar=1"
                  />
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ═══ Paso 2: Mapeo de columnas ═══ -->
      <template v-else-if="paso === 2">
        <div class="space-y-3">
          <p class="text-[13px] text-gray-500 dark:text-slate-400">
            <span class="font-semibold text-gray-700 dark:text-gray-200">{{ filas.length }}</span> filas leídas de
            <span class="font-medium">{{ nombreArchivo }}</span>.
            Indicá qué columna del archivo corresponde a cada dato:
          </p>

          <div class="grid sm:grid-cols-2 gap-x-4 gap-y-2">
            <div v-for="campo in CAMPOS_DESTINO" :key="campo.key" class="flex items-center gap-2">
              <label class="w-28 shrink-0 text-[12px] font-medium text-gray-500 dark:text-slate-400">
                {{ campo.label }}<span v-if="campo.key === 'dir_calle'" class="text-cyan-500">*</span>
              </label>
              <USelect
                v-model="mapeo[campo.key]"
                :options="opcionesColumna"
                size="sm"
                class="flex-1"
              />
            </div>
          </div>

          <p class="text-[11px] text-gray-400 dark:text-slate-500">
            * Recomendado para poder geocodificar. Una fila necesita al menos nombre, teléfono o calle.
          </p>

          <div class="flex gap-2 pt-2">
            <UButton color="gray" variant="ghost" label="Atrás" @click="paso = 1" />
            <UButton color="cyan" label="Vista previa" icon="i-heroicons-eye" @click="irAPreview" />
          </div>
        </div>
      </template>

      <!-- ═══ Paso 3: Preview + ejecutar ═══ -->
      <template v-else>
        <div class="space-y-3">
          <!-- Resumen de validación -->
          <div class="flex flex-wrap gap-2 text-[12px]">
            <span class="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 font-semibold">
              {{ filasValidas.length }} filas listas
            </span>
            <span v-if="filasVacias > 0" class="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 font-semibold">
              {{ filasVacias }} vacías (se omiten)
            </span>
            <span v-if="duplicadosArchivo > 0" class="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 font-semibold">
              {{ duplicadosArchivo }} teléfonos repetidos en el archivo
            </span>
            <span v-if="conCoords > 0" class="px-2 py-1 rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300 font-semibold">
              {{ conCoords }} con coordenadas
            </span>
          </div>

          <!-- Vendedor destino (staff) -->
          <div v-if="esStaff" class="flex items-center gap-2">
            <label class="text-[12px] font-medium text-gray-500 dark:text-slate-400 shrink-0">Asignar a</label>
            <USelect v-model="vendedorDestino" :options="opcionesVendedor" size="sm" class="flex-1" />
          </div>

          <!-- Tabla preview -->
          <div class="overflow-x-auto rounded-xl ring-1 ring-gray-200/70 dark:ring-white/[0.06]">
            <table class="w-full text-[12px]">
              <thead>
                <tr class="bg-gray-50 dark:bg-white/[0.03] text-left text-gray-500 dark:text-slate-400">
                  <th class="px-2.5 py-2 font-semibold">Nombre</th>
                  <th class="px-2.5 py-2 font-semibold">Teléfono</th>
                  <th class="px-2.5 py-2 font-semibold">Dirección</th>
                  <th class="px-2.5 py-2 font-semibold">Localidad</th>
                  <th class="px-2.5 py-2 font-semibold">Coords</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-white/[0.04]">
                <tr v-for="(f, i) in filasValidas.slice(0, 20)" :key="i" class="text-gray-700 dark:text-gray-300">
                  <td class="px-2.5 py-1.5 truncate max-w-[140px]">{{ f.nombre || '—' }}</td>
                  <td class="px-2.5 py-1.5">{{ f.telefono || '—' }}</td>
                  <td class="px-2.5 py-1.5 truncate max-w-[180px]">{{ f.dir_calle || '—' }}</td>
                  <td class="px-2.5 py-1.5">{{ f.dir_localidad || '—' }}</td>
                  <td class="px-2.5 py-1.5">{{ f.lat != null ? '✓' : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="filasValidas.length > 20" class="text-[11px] text-gray-400 text-center">
            … y {{ filasValidas.length - 20 }} filas más
          </p>

          <!-- Progreso / resultado -->
          <div v-if="importando" class="space-y-1.5">
            <div class="h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all"
                :style="{ width: `${progresoPct}%` }"
              />
            </div>
            <p class="text-[12px] text-gray-500 dark:text-slate-400 text-center">
              Importando… {{ procesadas }} / {{ filasValidas.length }}
            </p>
          </div>

          <div v-if="resultado" class="rounded-xl bg-gray-50 dark:bg-white/[0.03] p-3 space-y-1 text-[13px]">
            <p class="font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ {{ resultado.insertados }} prospectos importados
            </p>
            <p v-if="resultado.duplicados.length > 0" class="text-amber-600 dark:text-amber-400">
              {{ resultado.duplicados.length }} duplicados omitidos
            </p>
            <p v-if="resultado.errores.length > 0" class="text-rose-600 dark:text-rose-400">
              {{ resultado.errores.length }} filas con error
            </p>
            <div class="flex flex-wrap gap-2 pt-2">
              <UButton
                v-if="resultado.duplicados.length + resultado.errores.length > 0"
                size="xs"
                color="gray"
                variant="outline"
                icon="i-heroicons-arrow-down-tray"
                label="Descargar rechazos"
                @click="descargarRechazos"
              />
              <UButton size="xs" color="cyan" icon="i-heroicons-map" label="Ver en el mapa" to="/mapa?sinubicar=1" />
            </div>
          </div>

          <div v-if="!resultado" class="flex gap-2 pt-1">
            <UButton color="gray" variant="ghost" label="Atrás" :disabled="importando" @click="paso = 2" />
            <UButton
              color="cyan"
              :label="importando ? 'Importando…' : `Importar ${filasValidas.length} prospectos`"
              icon="i-heroicons-arrow-up-tray"
              :loading="importando"
              :disabled="filasValidas.length === 0"
              @click="ejecutarImport"
            />
          </div>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['admin'] })

const toast = useToast()
const profile = useCurrentProfile()
const client = useSupabaseClient()

const esStaff = computed(() => ['admin', 'oficinista'].includes(profile.value?.rol ?? ''))

const paso = ref(1)
const fileInput = ref<HTMLInputElement | null>(null)
const nombreArchivo = ref('')
const encabezados = ref<string[]>([])
const filas = ref<Record<string, any>[]>([])
const parseError = ref('')

// ─── Paso 1: parseo ───
const parsearArchivo = async (file: File) => {
  parseError.value = ''
  const Papa = (await import('papaparse')).default
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (res: any) => {
      if (!res.data?.length) {
        parseError.value = 'El archivo está vacío o no se pudo leer.'
        return
      }
      nombreArchivo.value = file.name
      encabezados.value = res.meta.fields ?? []
      filas.value = res.data
      autodetectarMapeo()
      paso.value = 2
    },
    error: () => {
      parseError.value = 'No se pudo leer el archivo. ¿Es un CSV válido?'
    },
  })
}

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) parsearArchivo(file)
}

const onDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files?.[0]
  if (file) parsearArchivo(file)
}

// ─── Desde ventas (staff) ───
const generandoDesdeVentas = ref(false)
const resultadoDesdeVentas = ref('')

const generarDesdeVentas = async () => {
  generandoDesdeVentas.value = true
  try {
    const res: any = await $fetch('/api/prospectos/desde-ventas', {
      method: 'POST',
      body: { todas: true },
    })
    const detalle = res.por_estado
      ? ' (' + Object.entries(res.por_estado).map(([e, n]) => `${n} ${prospectoEstadoLabel(e).toLowerCase()}`).join(', ') + ')'
      : ''
    resultadoDesdeVentas.value = `${res.creados} prospectos creados${detalle}, ${res.omitidos} ya existían.`
    toast.add({ title: 'Listo', description: resultadoDesdeVentas.value, color: 'green' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || err.message, color: 'red' })
  } finally {
    generandoDesdeVentas.value = false
  }
}

// ─── Paso 2: mapeo ───
const CAMPOS_DESTINO = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'dir_calle', label: 'Calle y número' },
  { key: 'dir_entre_calles', label: 'Entre calles' },
  { key: 'dir_localidad', label: 'Localidad' },
  { key: 'dir_aclaracion', label: 'Aclaración' },
  { key: 'notas', label: 'Notas' },
  { key: 'canal', label: 'Canal' },
  { key: 'estado', label: 'Estado' },
  { key: 'motivo_perdida', label: 'Motivo pérdida' },
  { key: 'lat', label: 'Latitud' },
  { key: 'lng', label: 'Longitud' },
] as const

const mapeo = reactive<Record<string, string>>({})

const opcionesColumna = computed(() => [
  { label: '— No importar —', value: '' },
  ...encabezados.value.map(h => ({ label: h, value: h })),
])

const normalizar = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')

const CANDIDATOS: Record<string, string[]> = {
  nombre: ['nombre', 'cliente', 'name', 'contacto'],
  telefono: ['telefono', 'tel', 'celular', 'phone', 'whatsapp', 'movil'],
  dir_calle: ['calle', 'direccion', 'domicilio', 'address', 'callealtura', 'calleynumero'],
  dir_entre_calles: ['entrecalles', 'entre'],
  dir_localidad: ['localidad', 'ciudad', 'barrio', 'city', 'zona'],
  dir_aclaracion: ['aclaracion', 'piso', 'depto', 'departamento', 'referencia'],
  notas: ['notas', 'nota', 'comentario', 'comentarios', 'observaciones', 'observacion'],
  canal: ['canal'],
  estado: ['estado', 'status'],
  motivo_perdida: ['motivo', 'motivoperdida'],
  lat: ['lat', 'latitud', 'latitude'],
  lng: ['lng', 'lon', 'longitud', 'longitude'],
}

const autodetectarMapeo = () => {
  for (const campo of CAMPOS_DESTINO) mapeo[campo.key] = ''
  for (const header of encabezados.value) {
    const n = normalizar(header)
    for (const [campo, candidatos] of Object.entries(CANDIDATOS)) {
      if (!mapeo[campo] && candidatos.includes(n)) {
        mapeo[campo] = header
        break
      }
    }
  }
}

// ─── Paso 3: preview + ejecutar ───
interface FilaMapeada {
  _fila: number
  nombre: string
  telefono: string
  dir_calle: string
  dir_entre_calles: string
  dir_localidad: string
  dir_aclaracion: string
  notas: string
  canal: string
  estado: string
  motivo_perdida: string
  lat: number | null
  lng: number | null
}

const filasMapeadas = ref<FilaMapeada[]>([])
const vendedorDestino = ref('')
const opcionesVendedor = ref<Array<{ label: string; value: string }>>([])

const irAPreview = async () => {
  filasMapeadas.value = filas.value.map((row, i) => {
    const get = (campo: string) => (mapeo[campo] ? String(row[mapeo[campo]] ?? '').trim() : '')
    const num = (campo: string) => {
      const v = get(campo).replace(',', '.')
      const n = Number(v)
      return v !== '' && !Number.isNaN(n) ? n : null
    }
    return {
      _fila: i + 2, // +2: fila 1 es el encabezado en el archivo original
      nombre: get('nombre'),
      telefono: get('telefono'),
      dir_calle: get('dir_calle'),
      dir_entre_calles: get('dir_entre_calles'),
      dir_localidad: get('dir_localidad'),
      dir_aclaracion: get('dir_aclaracion'),
      notas: get('notas'),
      canal: normalizar(get('canal')).replace(/ /g, '_'),
      estado: normalizar(get('estado')).replace(/ /g, '_'),
      motivo_perdida: get('motivo_perdida'),
      lat: num('lat'),
      lng: num('lng'),
    }
  })

  if (esStaff.value && opcionesVendedor.value.length === 0) {
    const { data } = await client
      .from('profiles')
      .select('id, nombre')
      .in('rol', ['vendedor', 'lider'])
      .order('nombre')
    opcionesVendedor.value = (data ?? []).map((u: any) => ({ label: u.nombre, value: u.id }))
    if (profile.value?.id) {
      opcionesVendedor.value.unshift({ label: `Yo (${profile.value.nombre})`, value: profile.value.id })
    }
    vendedorDestino.value = opcionesVendedor.value[0]?.value ?? ''
  }

  paso.value = 3
}

const filasValidas = computed(() =>
  filasMapeadas.value.filter(f => f.nombre || f.telefono || f.dir_calle),
)
const filasVacias = computed(() => filasMapeadas.value.length - filasValidas.value.length)
const conCoords = computed(() => filasValidas.value.filter(f => f.lat != null && f.lng != null).length)
const duplicadosArchivo = computed(() => {
  const vistos = new Set<string>()
  let dups = 0
  for (const f of filasValidas.value) {
    const t = f.telefono.replace(/\D+/g, '')
    if (t.length < 6) continue
    if (vistos.has(t)) dups++
    else vistos.add(t)
  }
  return dups
})

const importando = ref(false)
const procesadas = ref(0)
const progresoPct = computed(() =>
  filasValidas.value.length === 0 ? 0 : Math.round((procesadas.value / filasValidas.value.length) * 100),
)

interface ResultadoImport {
  insertados: number
  duplicados: Array<{ fila: number; motivo: string }>
  errores: Array<{ fila: number; mensaje: string }>
}
const resultado = ref<ResultadoImport | null>(null)

const LOTE = 200

const ejecutarImport = async () => {
  importando.value = true
  procesadas.value = 0
  const acumulado: ResultadoImport = { insertados: 0, duplicados: [], errores: [] }
  try {
    for (let i = 0; i < filasValidas.value.length; i += LOTE) {
      const lote = filasValidas.value.slice(i, i + LOTE)
      const res: any = await $fetch('/api/prospectos/import', {
        method: 'POST',
        body: {
          rows: lote,
          ...(esStaff.value && vendedorDestino.value ? { vendedor_id: vendedorDestino.value } : {}),
        },
      })
      acumulado.insertados += res.insertados
      acumulado.duplicados.push(...res.duplicados)
      acumulado.errores.push(...res.errores)
      procesadas.value = Math.min(i + LOTE, filasValidas.value.length)
    }
    resultado.value = acumulado
    toast.add({
      title: `${acumulado.insertados} prospectos importados`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (err: any) {
    toast.add({ title: 'Error al importar', description: err.data?.statusMessage || err.message, color: 'red' })
    if (acumulado.insertados > 0) resultado.value = acumulado
  } finally {
    importando.value = false
  }
}

const descargarRechazos = () => {
  if (!resultado.value) return
  const rechazos = [
    ...resultado.value.duplicados.map(d => ({ fila: d.fila, tipo: 'duplicado', detalle: d.motivo })),
    ...resultado.value.errores.map(e => ({ fila: e.fila, tipo: 'error', detalle: e.mensaje })),
  ].sort((a, b) => a.fila - b.fila)
  exportCsv(rechazos, 'rechazos-import.csv')
}

useHead({ title: 'Importar Prospectos — AMSI SRL' })
</script>
