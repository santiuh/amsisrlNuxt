<template>
  <div class="space-y-4 md:space-y-8">
    <!-- CicloCards (desktop) -->
    <div class="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CicloCardSkeleton empresa="express" />
      <CicloCardSkeleton empresa="ultra" />
      <CicloCardSkeleton empresa="chipped" />
      <CicloCardSkeleton empresa="fibertec" />
    </div>

    <!-- Hero mobile -->
    <CicloHeroMobileSkeleton class="md:hidden" />

    <!-- Estado bar de propias -->
    <DashboardEstadoBarSkeleton />

    <!-- Charts desktop / tabbed mobile -->
    <div class="hidden md:grid grid-cols-1 xl:grid-cols-2 gap-4">
      <DashboardLineChartSkeleton />
      <DashboardLineChartSkeleton />
    </div>
    <div class="md:hidden">
      <DashboardLineChartSkeleton />
    </div>

    <!-- Shortcuts -->
    <DashboardShortcutsSkeleton :role="role" />

    <!-- Tabla / lista de ventas propias -->
    <div class="hidden md:block rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
        <SkeletonBox variant="text" width="130" height="14" />
      </div>
      <VentaTableSkeleton :show-vendedor="role !== 'vendedor'" :rows="5" />
    </div>
    <div class="md:hidden space-y-2">
      <div class="flex items-center justify-between gap-2 px-1 mb-2">
        <SkeletonBox variant="text" width="120" height="14" />
        <SkeletonBox variant="text" tone="cyan" width="74" height="12" />
      </div>
      <VentaListMobileSkeleton :count="5" />
    </div>

    <!-- Segunda sección (líder ve equipo, admin ve "Últimas ventas") -->
    <template v-if="role === 'lider' || role === 'admin'">
      <DashboardEstadoBarSkeleton v-if="role === 'lider'" />

      <div class="hidden md:block rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between gap-3">
          <SkeletonBox variant="text" width="160" height="14" />
          <SkeletonBox variant="text" tone="cyan" width="74" height="12" />
        </div>
        <VentaTableSkeleton show-vendedor :rows="4" />
      </div>
      <div class="md:hidden space-y-2">
        <div class="flex items-center justify-between gap-2 px-1 mb-2">
          <SkeletonBox variant="text" width="140" height="14" />
          <SkeletonBox variant="text" tone="cyan" width="74" height="12" />
        </div>
        <VentaListMobileSkeleton :count="4" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  role?: 'admin' | 'vendedor' | 'lider' | 'oficinista'
}>(), {
  role: 'vendedor',
})
</script>
