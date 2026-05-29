<template>
  <div class="rounded-2xl bg-white shadow-card ring-1 ring-gray-100 p-4 md:p-5 dark:bg-white/[0.03] dark:ring-white/[0.06]">
    <div class="flex items-baseline justify-between gap-3 mb-3 md:mb-4">
      <SkeletonBox variant="text" width="62%" height="14" />
      <SkeletonBox variant="text" width="56" height="12" />
    </div>

    <!-- Barra segmentada -->
    <div class="flex h-5 md:h-6 w-full overflow-hidden rounded-full ring-1 ring-gray-100 dark:ring-white/[0.08]">
      <SkeletonBox tone="emerald" :width="emeraldPct" height="100%" rounded="rounded-none" />
      <SkeletonBox tone="cyan" :width="cyanPct" height="100%" rounded="rounded-none" />
      <SkeletonBox tone="amber" :width="amberPct" height="100%" rounded="rounded-none" />
      <SkeletonBox tone="neutral" :width="restPct" height="100%" rounded="rounded-none" />
    </div>

    <!-- Mobile chips -->
    <div class="md:hidden mt-3 flex gap-1.5 overflow-hidden">
      <SkeletonBox v-for="i in 4" :key="`m-${i}`" variant="pill" width="92" height="26" />
    </div>

    <!-- Desktop legend grid -->
    <div
      class="hidden md:grid mt-4 gap-x-4 gap-y-2"
      style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))"
    >
      <div v-for="i in 6" :key="`leg-${i}`" class="flex items-center gap-2 min-w-0">
        <SkeletonBox variant="circle" width="10" height="10" />
        <SkeletonBox variant="text" width="60%" height="12" />
        <SkeletonBox variant="text" width="20" height="12" class="ml-auto" />
        <SkeletonBox variant="text" width="22" height="10" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  emeraldPct?: string
  cyanPct?: string
  amberPct?: string
  restPct?: string
}>(), {
  emeraldPct: '36%',
  cyanPct: '24%',
  amberPct: '20%',
  restPct: '20%',
})
</script>
