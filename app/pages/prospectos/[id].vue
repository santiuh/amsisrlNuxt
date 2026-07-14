<template>
  <div class="max-w-3xl mx-auto space-y-4">
    <!-- Volver -->
    <div class="flex items-center gap-2">
      <UButton
        size="xs"
        color="gray"
        variant="ghost"
        icon="i-heroicons-arrow-left"
        label="Volver al mapa"
        to="/mapa"
      />
    </div>

    <div v-if="cargando" class="py-10 flex justify-center">
      <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-gray-400" />
    </div>

    <!-- ══ Sin acceso: tarjeta limitada ══ -->
    <UCard v-else-if="!prospecto">
      <div class="text-center py-4">
        <UIcon name="i-heroicons-lock-closed" class="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
        <h2 class="text-[15px] font-bold text-gray-800 dark:text-gray-100">
          Prospecto de otro vendedor
        </h2>
        <template v-if="pinLimitado">
          <p class="text-[13px] text-gray-500 dark:text-slate-400 mt-2">
            Trabajado por <span class="font-semibold">{{ pinLimitado.vendedor_nombre || 'otro vendedor' }}</span>
            <template v-if="pinLimitado.localidad"> en {{ pinLimitado.localidad }}</template>
          </p>
          <span
            class="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset"
            :class="prospectoEstadoPill(pinLimitado.estado)"
          >
            {{ prospectoEstadoLabel(pinLimitado.estado) }}
          </span>
          <p v-if="pinLimitado.fecha_ultima_interaccion" class="text-[12px] text-gray-400 dark:text-slate-500 mt-2">
            Última visita: {{ fechaCorta(pinLimitado.fecha_ultima_interaccion) }}
          </p>
        </template>
        <p v-else class="text-[13px] text-gray-500 dark:text-slate-400 mt-2">
          No tenés acceso a los datos de este prospecto.
        </p>
      </div>
    </UCard>

    <!-- ══ Ficha completa ══ -->
    <template v-else>
      <UCard :ui="{ body: { padding: 'px-4 py-4 sm:p-5' } }">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {{ prospecto.nombre || 'Sin nombre' }}
              </h1>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset"
                :class="prospectoEstadoPill(prospecto.estado)"
              >
                {{ prospectoEstadoLabel(prospecto.estado) }}
              </span>
            </div>
            <p v-if="direccion" class="mt-1 text-[13px] text-gray-500 dark:text-slate-400 flex items-start gap-1">
              <UIcon name="i-heroicons-map-pin" class="w-4 h-4 shrink-0 mt-0.5" />
              <span>{{ direccion }}<template v-if="prospecto.dir_aclaracion"> · {{ prospecto.dir_aclaracion }}</template></span>
            </p>
          </div>
          <div class="shrink-0 flex items-center gap-1">
            <UButton
              size="xs"
              color="gray"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              aria-label="Editar"
              @click="editarAbierto = true"
            />
            <UButton
              v-if="esAdmin"
              size="xs"
              color="red"
              variant="ghost"
              icon="i-heroicons-trash"
              aria-label="Eliminar"
              @click="confirmarEliminar"
            />
          </div>
        </div>

        <!-- Datos -->
        <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
          <div>
            <dt class="text-[11px] uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">Teléfono</dt>
            <dd class="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{{ prospecto.telefono || '—' }}</dd>
          </div>
          <div>
            <dt class="text-[11px] uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">Canal</dt>
            <dd class="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{{ canalLabel(prospecto.canal) }}</dd>
          </div>
          <div>
            <dt class="text-[11px] uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">Vendedor</dt>
            <dd class="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{{ vendedorNombre || '—' }}</dd>
          </div>
          <div>
            <dt class="text-[11px] uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">Última interacción</dt>
            <dd class="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{{ fechaCorta(prospecto.fecha_ultima_interaccion) || 'Nunca' }}</dd>
          </div>
          <div v-if="prospecto.proxima_visita">
            <dt class="text-[11px] uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">Próxima visita</dt>
            <dd
              class="font-semibold mt-0.5"
              :class="proximaVencida ? 'text-rose-600 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-400'"
            >
              {{ fechaCorta(prospecto.proxima_visita) }}{{ proximaVencida ? ' (vencida)' : '' }}
            </dd>
          </div>
          <div v-if="prospecto.estado === 'perdido' && prospecto.motivo_perdida">
            <dt class="text-[11px] uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">Motivo de pérdida</dt>
            <dd class="font-medium text-rose-600 dark:text-rose-300 mt-0.5">{{ prospecto.motivo_perdida }}</dd>
          </div>
          <div>
            <dt class="text-[11px] uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">Origen</dt>
            <dd class="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{{ ORIGEN_LABELS[prospecto.origen] ?? prospecto.origen }}</dd>
          </div>
          <div v-if="!prospecto.lat">
            <dt class="text-[11px] uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">Ubicación</dt>
            <dd class="font-medium text-amber-600 dark:text-amber-400 mt-0.5">Sin ubicar en el mapa</dd>
          </div>
          <div v-else-if="prospecto.ubicacion_aproximada">
            <dt class="text-[11px] uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">Ubicación</dt>
            <dd class="font-medium text-amber-600 dark:text-amber-400 mt-0.5">Aproximada (centro del pueblo)</dd>
          </div>
        </dl>

        <p v-if="prospecto.notas" class="mt-3 text-[13px] text-gray-600 dark:text-slate-300 whitespace-pre-line bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2">
          {{ prospecto.notas }}
        </p>

        <!-- Acciones -->
        <div class="mt-4 flex flex-wrap gap-2">
          <UButton
            size="sm"
            color="cyan"
            icon="i-heroicons-plus-circle"
            label="Registrar interacción"
            @click="interaccionAbierta = true"
          />
          <UButton
            v-if="prospecto.telefono"
            size="sm"
            color="gray"
            variant="outline"
            icon="i-heroicons-phone"
            label="Llamar"
            :to="`tel:${prospecto.telefono}`"
            external
          />
          <UButton
            v-if="whatsappUrl"
            size="sm"
            color="emerald"
            variant="soft"
            icon="i-heroicons-chat-bubble-left-ellipsis"
            label="WhatsApp"
            :to="whatsappUrl"
            external
            target="_blank"
          />
          <UButton
            v-if="prospecto.estado !== 'contratado'"
            size="sm"
            color="emerald"
            icon="i-heroicons-banknotes"
            label="Crear venta"
            @click="navigateTo(`/ventas/nueva?prospecto=${prospecto.id}`)"
          />
          <UButton
            v-else-if="prospecto.venta_id"
            size="sm"
            color="emerald"
            variant="soft"
            icon="i-heroicons-check-badge"
            label="Ver venta"
            :to="`/ventas/${prospecto.venta_id}`"
          />
          <UButton
            v-if="prospecto.lat != null"
            size="sm"
            color="gray"
            variant="ghost"
            icon="i-heroicons-map"
            label="Ver en mapa"
            to="/mapa"
          />
          <UButton
            size="sm"
            color="gray"
            variant="outline"
            icon="i-heroicons-cursor-arrow-rays"
            :label="prospecto.lat != null ? 'Reubicar en el mapa' : 'Ubicar en el mapa'"
            :to="`/mapa?reubicar=${prospecto.id}`"
          />
        </div>
      </UCard>

      <!-- Mini mapa -->
      <UCard v-if="prospecto.lat != null" :ui="{ body: { padding: 'p-0' } }">
        <div class="h-52 rounded-lg overflow-hidden relative z-0">
          <ProspectoMap :puntos="[pinPropio]" :seleccionado="prospecto.id" miniatura />
        </div>
      </UCard>

      <!-- Historial -->
      <UCard :ui="{ body: { padding: 'px-4 py-4 sm:p-5' } }">
        <ProspectoHistorial ref="historialRef" :prospecto-id="prospecto.id" />
      </UCard>
    </template>

    <!-- Modales -->
    <ProspectoForm v-model="editarAbierto" :prospecto="prospecto" @saved="recargar" />
    <ProspectoInteraccionForm
      v-model="interaccionAbierta"
      :prospecto="prospecto"
      :atajo="null"
      @saved="onInteraccionGuardada"
    />
  </div>
</template>

<script setup lang="ts">
import type { ProspectoPin, ProspectoRow } from '~/utils/prospectoUI'
import { normalizePhone } from '~/utils/whatsapp'

definePageMeta({ middleware: ['admin'] })

const route = useRoute()
const client = useSupabaseClient()
const toast = useToast()
const profile = useCurrentProfile()

const id = route.params.id as string

const prospecto = ref<(ProspectoRow & { vendedor?: { nombre: string | null } | null }) | null>(null)
const pinLimitado = ref<ProspectoPin | null>(null)
const cargando = ref(true)
const editarAbierto = ref(false)
const interaccionAbierta = ref(false)
const historialRef = ref<any>(null)

const ORIGEN_LABELS: Record<string, string> = {
  manual: 'Carga manual',
  importado: 'Importado',
  venta: 'Desde venta',
}

const esAdmin = computed(() => profile.value?.rol === 'admin')

const recargar = async () => {
  const { data } = await client
    .from('prospectos')
    .select('*, vendedor:vendedor_id(nombre)')
    .eq('id', id)
    .maybeSingle()
  prospecto.value = data as any

  // Sin acceso a la fila completa: buscar datos limitados en la capa del mapa
  if (!data) {
    const { data: pines } = await client.rpc('prospectos_mapa')
    pinLimitado.value = ((pines ?? []) as ProspectoPin[]).find(p => p.id === id) ?? null
  }
}

onMounted(async () => {
  await recargar()
  cargando.value = false
})

const onInteraccionGuardada = async () => {
  await recargar()
  historialRef.value?.refrescar()
}

const direccion = computed(() => prospecto.value ? direccionCompleta(prospecto.value) : '')
const vendedorNombre = computed(() => prospecto.value?.vendedor?.nombre ?? null)

const whatsappUrl = computed(() => {
  const tel = normalizePhone(prospecto.value?.telefono)
  if (!tel) return ''
  const nombre = prospecto.value?.nombre || ''
  const texto = encodeURIComponent(`Hola${nombre ? ` ${nombre}` : ''}, ¿cómo estás? Te escribo por el servicio de internet que estuvimos conversando.`)
  return `https://wa.me/${tel}?text=${texto}`
})

const hoyISO = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()

const proximaVencida = computed(() =>
  !!prospecto.value?.proxima_visita && prospecto.value.proxima_visita <= hoyISO,
)

const pinPropio = computed<ProspectoPin>(() => ({
  id: prospecto.value!.id,
  lat: prospecto.value!.lat!,
  lng: prospecto.value!.lng!,
  estado: prospecto.value!.estado,
  fecha_ultima_interaccion: prospecto.value!.fecha_ultima_interaccion,
  proxima_visita: prospecto.value!.proxima_visita,
  vendedor_id: prospecto.value!.vendedor_id,
  vendedor_nombre: vendedorNombre.value,
  localidad: prospecto.value!.dir_localidad,
  acceso_completo: true,
}))

const fechaCorta = (iso: string | null | undefined): string => {
  if (!iso) return ''
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const confirmarEliminar = async () => {
  if (!prospecto.value) return
  // eslint-disable-next-line no-alert
  if (!window.confirm('¿Eliminar este prospecto? Se borra también su historial.')) return
  try {
    await $fetch(`/api/prospectos/${prospecto.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Prospecto eliminado', color: 'green' })
    await navigateTo('/mapa')
  } catch (err: any) {
    toast.add({ title: 'Error al eliminar', description: err.data?.statusMessage || err.message, color: 'red' })
  }
}

useHead({ title: 'Prospecto — AMSI SRL' })
</script>
