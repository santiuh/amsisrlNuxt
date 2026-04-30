<template>
  <div class="space-y-3">
    <UTable :rows="visibleRows" :columns="columns">
      <template #vendedor-data="{ row }">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600">
            <UserAvatar :config="row.avatar_config" :seed="row.nombre" class="w-full h-full" />
          </div>
          <span :title="row.nombre">{{ row.nombre }}</span>
        </div>
      </template>
    </UTable>

    <div
      v-if="rows.length > pageSize"
      class="flex items-center justify-between gap-3 px-1 pt-1"
    >
      <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {{ rangeStart }}–{{ rangeEnd }} de {{ rows.length }}
      </span>
      <UPagination
        v-model="page"
        :page-count="pageSize"
        :total="rows.length"
        :max="5"
        size="xs"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  rows: any[]
  columns: { key: string; label: string }[]
  pageSize?: number
}>(), {
  pageSize: 10,
})

const page = ref(1)

watch(() => props.rows.length, () => {
  page.value = 1
})

const visibleRows = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return props.rows.slice(start, start + props.pageSize)
})

const rangeStart = computed(() =>
  props.rows.length === 0 ? 0 : (page.value - 1) * props.pageSize + 1,
)
const rangeEnd = computed(() =>
  Math.min(page.value * props.pageSize, props.rows.length),
)
</script>
