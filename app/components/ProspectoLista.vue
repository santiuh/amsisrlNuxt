<template>
  <div class="h-full flex flex-col">
    <div class="shrink-0 flex items-center justify-between gap-2 mb-2">
      <p class="text-[12px] text-gray-500 dark:text-slate-400">
        {{ total }} prospecto{{ total === 1 ? '' : 's' }}
        <span class="hidden sm:inline text-gray-400 dark:text-slate-500">(solo se listan los que podés ver completos)</span>
      </p>
      <UButton
        size="xs"
        color="gray"
        variant="outline"
        icon="i-heroicons-arrow-down-tray"
        :label="exporting ? 'Exportando…' : 'Exportar CSV'"
        :loading="exporting"
        @click="exportar"
      />
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto space-y-2 pb-24 md:pb-4">
      <div v-if="loading" class="py-8 flex justify-center">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
      </div>

      <p v-else-if="error" class="py-8 text-center text-[13px] text-rose-500">{{ error }}</p>

      <div v-else-if="rows.length === 0" class="py-10 text-center">
        <UIcon name="i-heroicons-map-pin" class="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
        <p class="text-[13px] text-gray-400 dark:text-slate-500">No hay prospectos con estos filtros</p>
      </div>

      <!-- Cards (mobile) / filas (desktop) -->
      <template v-else>
        <NuxtLink
          v-for="p in rows"
          :key="p.id"
          :to="`/prospectos/${p.id}`"
          class="block bg-white dark:bg-[#0f172a] rounded-xl ring-1 ring-gray-200/70 dark:ring-white/[0.06] px-3.5 py-3 hover:ring-cyan-300 dark:hover:ring-cyan-500/40 transition-all"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
                {{ p.nombre || 'Sin nombre' }}
              </p>
              <p class="text-[12px] text-gray-500 dark:text-slate-400 truncate mt-0.5">
                {{ direccionCompleta(p) || '—' }}
              </p>
            </div>
            <span
              class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset"
              :class="prospectoEstadoPill(p.estado)"
            >
              {{ prospectoEstadoLabel(p.estado) }}
            </span>
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 dark:text-slate-500">
            <span v-if="p.telefono" class="inline-flex items-center gap-1">
              <UIcon name="i-heroicons-phone" class="w-3 h-3" />{{ p.telefono }}
            </span>
            <span class="inline-flex items-center gap-1">
              <UIcon :name="CANAL_ICONS[p.canal] ?? 'i-heroicons-question-mark-circle'" class="w-3 h-3" />{{ canalLabel(p.canal) }}
            </span>
            <span v-if="p.vendedor?.nombre" class="inline-flex items-center gap-1">
              <UIcon name="i-heroicons-user" class="w-3 h-3" />{{ p.vendedor.nombre }}
            </span>
            <span v-if="p.fecha_ultima_interaccion" class="inline-flex items-center gap-1">
              <UIcon name="i-heroicons-clock" class="w-3 h-3" />{{ fechaCorta(p.fecha_ultima_interaccion) }}
            </span>
            <span
              v-if="p.proxima_visita"
              class="inline-flex items-center gap-1 font-semibold"
              :class="p.proxima_visita <= hoy ? 'text-rose-500 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-400'"
            >
              <UIcon name="i-heroicons-calendar-days" class="w-3 h-3" />{{ fechaCorta(p.proxima_visita) }}
            </span>
            <span v-if="!p.lat" class="inline-flex items-center gap-1 text-amber-500">
              <UIcon name="i-heroicons-map-pin" class="w-3 h-3" />Sin ubicar
            </span>
          </div>
        </NuxtLink>

        <!-- Paginación -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 pt-2">
          <UButton
            size="xs"
            color="gray"
            variant="ghost"
            icon="i-heroicons-chevron-left"
            :disabled="page <= 1"
            @click="page--"
          />
          <span class="text-[12px] text-gray-500 dark:text-slate-400">{{ page }} / {{ totalPages }}</span>
          <UButton
            size="xs"
            color="gray"
            variant="ghost"
            icon="i-heroicons-chevron-right"
            :disabled="page >= totalPages"
            @click="page++"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const toast = useToast()
const { rows, total, totalPages, page, loading, error, exporting, init, fetchExport } = useProspectos()

onMounted(init)

const hoy = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()

const fechaCorta = (iso: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const exportar = async () => {
  try {
    const { rows: data, truncated } = await fetchExport()
    if (data.length === 0) {
      toast.add({ title: 'No hay prospectos para exportar', color: 'amber' })
      return
    }
    const filas = data.map((p: any) => ({
      nombre: p.nombre ?? '',
      telefono: p.telefono ?? '',
      estado: prospectoEstadoLabel(p.estado),
      motivo_perdida: p.motivo_perdida ?? '',
      canal: canalLabel(p.canal),
      calle: p.dir_calle ?? '',
      entre_calles: p.dir_entre_calles ?? '',
      localidad: p.dir_localidad ?? '',
      aclaracion: p.dir_aclaracion ?? '',
      lat: p.lat ?? '',
      lng: p.lng ?? '',
      notas: p.notas ?? '',
      vendedor: p.vendedor?.nombre ?? '',
      ultima_interaccion: p.fecha_ultima_interaccion ?? '',
      proxima_visita: p.proxima_visita ?? '',
      origen: p.origen,
      creado: p.created_at,
    }))
    exportCsv(filas, `prospectos-${hoy}.csv`)
    if (truncated) {
      toast.add({ title: 'Export truncado', description: 'Se exportaron las primeras 5000 filas. Ajustá los filtros.', color: 'amber' })
    }
  } catch (err: any) {
    toast.add({ title: 'Error al exportar', description: err.message, color: 'red' })
  }
}

defineExpose({ refrescar: () => init() })
</script>
