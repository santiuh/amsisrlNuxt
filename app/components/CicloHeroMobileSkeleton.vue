<template>
  <div
    class="relative overflow-hidden rounded-2xl ring-1 bg-white shadow-card ring-cyan-100 dark:bg-cyan-500/[0.05] dark:ring-cyan-500/15"
  >
    <!-- Orbs cyan (vista mes) -->
    <div
      class="pointer-events-none absolute -top-20 -left-16 h-52 w-52 rounded-full blur-3xl opacity-30 dark:opacity-40 bg-gradient-to-br from-cyan-300 via-sky-200 to-transparent dark:from-cyan-500/40 dark:via-sky-500/20"
    />
    <div
      class="pointer-events-none absolute -bottom-24 -right-10 h-56 w-56 rounded-full blur-3xl opacity-20 dark:opacity-30 bg-gradient-to-tr from-sky-400 to-cyan-300 dark:from-sky-500/30 dark:to-cyan-500/20"
    />

    <div class="relative p-4">
      <!-- Toggle mes/ciclo -->
      <div class="mb-4 flex items-center gap-1 p-1 rounded-full bg-gray-100/70 dark:bg-white/[0.04] w-fit ring-1 ring-inset ring-gray-200/40 dark:ring-white/[0.04]">
        <SkeletonBox variant="pill" tone="neutral" width="38" height="20" />
        <SkeletonBox variant="pill" tone="neutral" width="38" height="20" />
      </div>

      <!-- Header -->
      <div class="flex items-center justify-between gap-3 mb-3">
        <SkeletonBox variant="text" tone="neutral" width="170" height="11" />
        <SkeletonBox variant="pill" tone="neutral" width="86" height="18" />
      </div>

      <!-- Big number -->
      <SkeletonBox variant="rect" tone="neutral" width="70%" height="44" rounded="rounded-lg" />
      <SkeletonBox variant="text" tone="neutral" width="170" height="11" class="mt-3" />

      <!-- Chips -->
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <SkeletonBox variant="pill" tone="neutral" width="118" height="30" />
        <SkeletonBox variant="pill" tone="amber" width="118" height="30" />
      </div>

      <!-- Desglose por empresa -->
      <div class="mt-4 pt-3 border-t border-cyan-100/60 dark:border-cyan-400/15 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <SkeletonBox variant="text" tone="neutral" width="64" height="10" />
        <SkeletonBox variant="text" tone="purple" width="72" height="11" />
        <SkeletonBox variant="text" tone="green" width="72" height="11" />
        <SkeletonBox variant="text" tone="red" width="72" height="11" />
        <SkeletonBox variant="text" tone="sky" width="72" height="11" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
