<template>
  <div
    class="inline-flex rounded-xl bg-gray-100 p-0.5 dark:bg-white/[0.05]"
    :class="disabled ? 'opacity-50 cursor-not-allowed' : ''"
  >
    <!-- Botón "Todas" -->
    <button
      v-if="showTodas"
      type="button"
      class="px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold transition-all duration-150 rounded-[10px]"
      :class="[
        modelValue === ''
          ? 'bg-white text-gray-800 shadow-soft dark:bg-white/10 dark:text-white'
          : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200',
        disabled ? 'pointer-events-none' : 'cursor-pointer',
      ]"
      :disabled="disabled"
      @click="$emit('update:modelValue', '')"
    >
      <UIcon name="i-heroicons-building-office-2" class="w-3.5 h-3.5" />
      Todas
    </button>

    <!-- Botones de empresa -->
    <button
      v-for="opt in computedOptions"
      :key="opt.value"
      type="button"
      class="px-3 py-1.5 flex items-center justify-center transition-all duration-150 rounded-[10px]"
      :class="[
        modelValue === opt.value
          ? 'bg-white text-gray-800 shadow-soft dark:bg-white/10 dark:text-white'
          : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200',
        disabled ? 'pointer-events-none' : 'cursor-pointer',
      ]"
      :disabled="disabled"
      @click="$emit('update:modelValue', opt.value)"
    >
      <img
        v-if="opt.value === 'express'"
        src="/img/logo-express.png"
        :alt="opt.label"
        class="h-5 object-contain"
      />
      <template v-else-if="opt.value === 'ultra'">
        <img src="/img/logo-ultra.png" :alt="opt.label" class="h-5 object-contain dark:hidden" />
        <img src="/img/logo-ultra-white.png" :alt="opt.label" class="h-5 object-contain hidden dark:block" />
      </template>
      <span v-else class="text-xs font-semibold">{{ opt.label }}</span>
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
