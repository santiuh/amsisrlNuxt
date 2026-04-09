<template>
  <div
    class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700"
    :class="disabled ? 'opacity-50 cursor-not-allowed' : ''"
  >
    <!-- Botón "Todas" -->
    <button
      v-if="showTodas"
      type="button"
      class="px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium transition-all border-r border-gray-200 dark:border-gray-700 first:rounded-l-lg"
      :class="[
        modelValue === ''
          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
          : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50',
        disabled ? 'pointer-events-none' : 'cursor-pointer',
      ]"
      :disabled="disabled"
      @click="$emit('update:modelValue', '')"
    >
      <UIcon name="i-heroicons-building-office-2" class="w-4 h-4" />
      Todas
    </button>

    <!-- Botones de empresa -->
    <button
      v-for="(opt, idx) in computedOptions"
      :key="opt.value"
      type="button"
      class="px-3 py-1.5 flex items-center justify-center transition-all"
      :class="[
        idx < computedOptions.length - 1 ? 'border-r border-gray-200 dark:border-gray-700' : '',
        !showTodas && idx === 0 ? 'rounded-l-lg' : '',
        idx === computedOptions.length - 1 ? 'rounded-r-lg' : '',
        modelValue === opt.value
          ? opt.value === 'ultra'
            ? 'bg-violet-100 dark:bg-violet-900/30'
            : 'bg-blue-100 dark:bg-blue-900/30'
          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50',
        disabled ? 'pointer-events-none' : 'cursor-pointer',
      ]"
      :disabled="disabled"
      @click="$emit('update:modelValue', opt.value)"
    >
      <!-- Express logo -->
      <img
        v-if="opt.value === 'express'"
        src="/img/logo-express.png"
        :alt="opt.label"
        class="h-6 object-contain"
      />

      <!-- Ultra logo: versión claro/oscuro -->
      <template v-else-if="opt.value === 'ultra'">
        <img
          src="/img/logo-ultra.png"
          :alt="opt.label"
          class="h-6 object-contain dark:hidden"
        />
        <img
          src="/img/logo-ultra-white.png"
          :alt="opt.label"
          class="h-6 object-contain hidden dark:block"
        />
      </template>

      <!-- Fallback texto -->
      <span v-else class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ opt.label }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface EmpresaOption {
  label: string
  value: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  showTodas?: boolean
  options?: EmpresaOption[]
  disabled?: boolean
}>(), {
  showTodas: false,
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

const computedOptions = computed<EmpresaOption[]>(() => {
  if (props.options) return props.options
  return [
    { label: 'Express', value: 'express' },
    { label: 'Ultra', value: 'ultra' },
  ]
})
</script>
