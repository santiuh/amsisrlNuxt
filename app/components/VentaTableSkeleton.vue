<template>
  <div class="overflow-hidden">
    <!-- Filtros row (reproduce el VentaFilters compacto) -->
    <div v-if="showFilters" class="flex flex-wrap items-center gap-2 px-2 py-3">
      <SkeletonBox variant="rect" width="220" height="36" rounded="rounded-lg" />
      <SkeletonBox variant="rect" width="160" height="36" rounded="rounded-lg" />
      <SkeletonBox variant="rect" width="140" height="36" rounded="rounded-lg" />
      <SkeletonBox variant="rect" width="100" height="36" rounded="rounded-lg" class="ml-auto" />
    </div>

    <!-- Tabla -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50/60 dark:bg-white/[0.02]">
          <tr>
            <th v-for="col in columns" :key="col.key" class="px-4 py-3 text-left" :style="{ width: col.width }">
              <SkeletonBox variant="text" :width="col.headerWidth" height="11" />
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-white/[0.05]">
          <tr v-for="i in rows" :key="i">
            <td class="px-4 py-3 whitespace-nowrap">
              <SkeletonBox variant="text" width="62" height="12" />
            </td>
            <td class="px-4 py-3">
              <SkeletonBox variant="pill" :tone="PILL_TONES[i % PILL_TONES.length]" width="64" height="20" />
            </td>
            <td class="px-4 py-3">
              <SkeletonBox variant="text" :width="CLIENT_WIDTHS[i % CLIENT_WIDTHS.length]" height="13" />
            </td>
            <td v-if="showVendedor" class="px-4 py-3">
              <div class="flex items-center gap-2">
                <SkeletonBox variant="circle" width="24" height="24" />
                <SkeletonBox variant="text" :width="VENDEDOR_WIDTHS[i % VENDEDOR_WIDTHS.length]" height="12" />
              </div>
            </td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <SkeletonBox variant="text" width="78" height="13" class="ml-auto" />
            </td>
            <td class="px-4 py-3">
              <SkeletonBox variant="pill" :tone="ESTADO_TONES[i % ESTADO_TONES.length]" width="88" height="22" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
type Tone = 'purple' | 'violet' | 'emerald' | 'amber' | 'cyan' | 'neutral'

const props = withDefaults(defineProps<{
  rows?: number
  showVendedor?: boolean
  showFilters?: boolean
}>(), {
  rows: 6,
  showVendedor: true,
  showFilters: false,
})

const PILL_TONES: Tone[] = ['purple', 'violet', 'emerald']
const ESTADO_TONES: Tone[] = ['emerald', 'cyan', 'amber', 'neutral', 'violet', 'purple']

const CLIENT_WIDTHS = ['70%', '54%', '78%', '60%', '48%', '66%']
const VENDEDOR_WIDTHS = ['80%', '60%', '70%', '85%', '55%']

const columns = computed(() => {
  const cols: Array<{ key: string; width?: string; headerWidth: string }> = [
    { key: 'fecha', width: '90px', headerWidth: '42px' },
    { key: 'empresa', width: '110px', headerWidth: '52px' },
    { key: 'cliente', headerWidth: '60px' },
  ]
  if (props.showVendedor) cols.push({ key: 'vendedor', width: '180px', headerWidth: '64px' })
  cols.push({ key: 'precio', width: '120px', headerWidth: '46px' })
  cols.push({ key: 'estado', width: '120px', headerWidth: '52px' })
  return cols
})
</script>
