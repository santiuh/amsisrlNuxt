<template>
  <div class="rounded-2xl bg-white shadow-card ring-1 ring-gray-100 p-5 dark:bg-white/[0.03] dark:ring-white/[0.06]">
    <div class="flex items-center justify-between gap-3 mb-4">
      <SkeletonBox variant="text" width="58%" height="14" />
      <div class="inline-flex items-center rounded-full bg-gray-100/70 dark:bg-white/[0.06] p-0.5 ring-1 ring-inset ring-gray-200/60 dark:ring-white/[0.08] gap-0.5">
        <SkeletonBox variant="pill" tone="neutral" width="68" height="22" />
        <SkeletonBox variant="pill" tone="neutral" width="80" height="22" />
      </div>
    </div>

    <!-- Chart area: SVG con líneas onduladas que se ven como un line chart -->
    <div class="relative h-48 md:h-56">
      <!-- Eje Y stub (líneas horizontales) -->
      <div class="absolute inset-0 flex flex-col justify-between py-2">
        <div v-for="n in 5" :key="`grid-${n}`" class="h-px w-full bg-gray-100/80 dark:bg-white/[0.05]" />
      </div>

      <!-- SVG curve overlay -->
      <svg
        class="relative w-full h-full sk-chart-svg"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sk-line-1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" class="sk-stop-purple-soft" />
            <stop offset="50%" class="sk-stop-purple-strong" />
            <stop offset="100%" class="sk-stop-purple-soft" />
            <animate attributeName="x1" values="-1;1;-1" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="x2" values="0;2;0" dur="2.2s" repeatCount="indefinite" />
          </linearGradient>
          <linearGradient id="sk-line-2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" class="sk-stop-violet-soft" />
            <stop offset="50%" class="sk-stop-violet-strong" />
            <stop offset="100%" class="sk-stop-violet-soft" />
            <animate attributeName="x1" values="-1;1;-1" dur="2.6s" repeatCount="indefinite" />
            <animate attributeName="x2" values="0;2;0" dur="2.6s" repeatCount="indefinite" />
          </linearGradient>
          <linearGradient id="sk-line-3" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" class="sk-stop-emerald-soft" />
            <stop offset="50%" class="sk-stop-emerald-strong" />
            <stop offset="100%" class="sk-stop-emerald-soft" />
            <animate attributeName="x1" values="-1;1;-1" dur="3s" repeatCount="indefinite" />
            <animate attributeName="x2" values="0;2;0" dur="3s" repeatCount="indefinite" />
          </linearGradient>
        </defs>

        <path
          d="M0,140 C50,120 90,90 140,100 S230,150 280,120 S360,70 400,90"
          fill="none"
          stroke="url(#sk-line-1)"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <path
          d="M0,160 C60,150 100,130 150,140 S240,170 290,150 S370,110 400,130"
          fill="none"
          stroke="url(#sk-line-2)"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <path
          d="M0,170 C50,160 100,150 150,165 S230,180 280,170 S370,150 400,160"
          fill="none"
          stroke="url(#sk-line-3)"
          stroke-width="2.5"
          stroke-linecap="round"
        />
      </svg>

      <!-- Eje X ticks -->
      <div class="absolute -bottom-1 left-0 right-0 flex justify-between px-2">
        <SkeletonBox v-for="i in 5" :key="`xt-${i}`" variant="text" width="32" height="9" />
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-6 flex items-center justify-center gap-4">
      <div v-for="(t, i) in LEGEND_TONES" :key="i" class="inline-flex items-center gap-1.5">
        <SkeletonBox variant="circle" :tone="t" width="8" height="8" />
        <SkeletonBox variant="text" :tone="t" width="48" height="11" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const LEGEND_TONES = ['purple', 'violet', 'emerald'] as const
</script>

<style>
.sk-stop-purple-soft   { stop-color: rgb(168 85 247 / 0.25); }
.sk-stop-purple-strong { stop-color: rgb(168 85 247 / 0.55); }
.sk-stop-violet-soft   { stop-color: rgb(139 92 246 / 0.25); }
.sk-stop-violet-strong { stop-color: rgb(139 92 246 / 0.55); }
.sk-stop-emerald-soft  { stop-color: rgb(16 185 129 / 0.25); }
.sk-stop-emerald-strong{ stop-color: rgb(16 185 129 / 0.55); }

.dark .sk-stop-purple-soft   { stop-color: rgb(192 132 252 / 0.4); }
.dark .sk-stop-purple-strong { stop-color: rgb(192 132 252 / 0.85); }
.dark .sk-stop-violet-soft   { stop-color: rgb(167 139 250 / 0.4); }
.dark .sk-stop-violet-strong { stop-color: rgb(167 139 250 / 0.85); }
.dark .sk-stop-emerald-soft  { stop-color: rgb(52 211 153 / 0.4); }
.dark .sk-stop-emerald-strong{ stop-color: rgb(52 211 153 / 0.85); }
</style>
