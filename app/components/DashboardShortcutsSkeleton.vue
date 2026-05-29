<template>
  <div class="space-y-3 md:space-y-4">
    <!-- Primary actions (desktop) -->
    <div class="hidden md:grid grid-cols-2 gap-4">
      <div
        v-for="i in 2"
        :key="`p-${i}`"
        class="flex items-center gap-4 p-5 rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06]"
      >
        <SkeletonBox variant="rect" :tone="i === 1 ? 'cyan' : 'neutral'" width="48" height="48" rounded="rounded-xl" />
        <div class="flex-1 min-w-0 space-y-2">
          <SkeletonBox variant="text" width="55%" height="16" />
          <SkeletonBox variant="text" width="78%" height="11" />
        </div>
        <SkeletonBox variant="rect" width="16" height="16" rounded="rounded" />
      </div>
    </div>

    <!-- Secondary actions — mobile -->
    <div
      class="md:hidden grid gap-2"
      :class="mobileGridClass"
    >
      <div
        v-for="i in mobileCount"
        :key="`mob-${i}`"
        class="flex flex-col items-center text-center gap-2 py-3 px-2 rounded-2xl bg-white ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06]"
      >
        <SkeletonBox variant="rect" :tone="TILE_TONES[(i - 1) % TILE_TONES.length]" width="44" height="44" rounded="rounded-2xl" />
        <SkeletonBox variant="text" width="78%" height="11" />
      </div>
    </div>

    <!-- Secondary actions — desktop -->
    <div
      class="hidden md:grid gap-3"
      :class="desktopGridClass"
    >
      <div
        v-for="i in count"
        :key="`d-${i}`"
        class="flex flex-col gap-3 p-4 rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06]"
      >
        <SkeletonBox variant="rect" :tone="TILE_TONES[(i - 1) % TILE_TONES.length]" width="40" height="40" rounded="rounded-xl" />
        <div class="space-y-2">
          <SkeletonBox variant="text" width="65%" height="14" />
          <SkeletonBox variant="text" width="90%" height="11" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Tone = 'cyan' | 'emerald' | 'violet' | 'amber' | 'purple' | 'neutral'

const props = withDefaults(defineProps<{
  role?: 'admin' | 'vendedor' | 'lider' | 'oficinista'
}>(), {
  role: 'vendedor',
})

const TILE_TONES: Tone[] = ['emerald', 'violet', 'amber', 'purple', 'neutral']

const count = computed(() => (props.role === 'admin' ? 5 : 3))
const mobileCount = computed(() => (props.role === 'admin' ? 5 : 3))

const desktopGridClass = computed(() =>
  count.value >= 5
    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
)

const mobileGridClass = computed(() =>
  mobileCount.value === 3 ? 'grid-cols-3' : 'grid-cols-2',
)
</script>
