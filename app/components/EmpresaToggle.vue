<template>
  <div
    class="inline-flex rounded-xl p-0.5 transition-all duration-500"
    :class="[
      themed
        ? 'relative overflow-hidden bg-gray-100/80 ring-1 ring-gray-200/70 dark:bg-white/[0.04] dark:ring-white/10'
        : 'bg-gray-100 dark:bg-white/[0.05]',
      disabled ? 'opacity-50 cursor-not-allowed' : '',
    ]"
  >
    <!-- Fondo de gradiente por empresa (cross-fade al cambiar de empresa) -->
    <template v-if="themed">
      <template v-for="emp in empresaKeys" :key="emp">
        <!-- Wash diagonal a todo el ancho -->
        <div
          class="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out"
          :class="[THEME[emp].wash, modelValue === emp ? 'opacity-100' : 'opacity-0']"
        />
        <!-- Orbs difuminados para dar profundidad de mesh -->
        <div
          class="pointer-events-none absolute -top-9 -left-7 h-24 w-24 rounded-full blur-2xl transition-opacity duration-500 ease-out"
          :class="[THEME[emp].orb, modelValue === emp ? 'opacity-70 dark:opacity-60' : 'opacity-0']"
        />
        <div
          class="pointer-events-none absolute -bottom-12 -right-8 h-28 w-28 rounded-full blur-2xl transition-opacity duration-500 ease-out"
          :class="[THEME[emp].orb2, modelValue === emp ? 'opacity-50 dark:opacity-40' : 'opacity-0']"
        />
      </template>
    </template>

    <!-- Botón "Todas" -->
    <button
      v-if="showTodas"
      type="button"
      class="relative z-10 px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 rounded-[10px]"
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
      class="relative z-10 px-3 py-1.5 flex items-center justify-center transition-all duration-200 rounded-[10px]"
      :class="[
        modelValue === opt.value
          ? (themed
            ? THEME[opt.value]?.pill ?? 'bg-white text-gray-800 shadow-soft dark:bg-white/10 dark:text-white'
            : 'bg-white text-gray-800 shadow-soft dark:bg-white/10 dark:text-white')
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
      <img
        v-else-if="opt.value === 'chipped'"
        src="/img/logo-chipped.png"
        :alt="opt.label"
        class="h-5 object-contain"
      />
      <img
        v-else-if="opt.value === 'fibertec'"
        src="/img/logo-fibertec.png"
        :alt="opt.label"
        class="h-5 object-contain"
      />
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
  themed?: boolean
}>(), {
  showTodas: false,
  disabled: false,
  themed: false,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

const computedOptions = computed<EmpresaOption[]>(() => {
  if (props.options) return props.options
  return [
    { label: 'Express', value: 'express' },
    { label: 'Ultra', value: 'ultra' },
    { label: 'Chipped', value: 'chipped' },
    { label: 'Fibertec', value: 'fibertec' },
  ]
})

// Identidad de gradiente por empresa, alineada con las cards del dashboard (CicloCard.vue).
// Clases literales para que Tailwind las genere al escanear este archivo.
const THEME: Record<string, { orb: string; orb2: string; wash: string; pill: string }> = {
  express: {
    orb: 'bg-gradient-to-br from-purple-300 via-fuchsia-200 to-transparent dark:from-purple-500/40 dark:via-fuchsia-500/20 dark:to-transparent',
    orb2: 'bg-gradient-to-tr from-purple-400 to-pink-300 dark:from-purple-500/30 dark:to-pink-500/20',
    wash: 'bg-gradient-to-r from-purple-200/60 via-fuchsia-100/30 to-purple-200/50 dark:from-purple-500/15 dark:via-fuchsia-500/[0.06] dark:to-purple-500/10',
    pill: 'bg-gradient-to-br from-white to-purple-50 text-purple-900 ring-1 ring-purple-200 shadow-soft dark:from-white/[0.12] dark:to-purple-500/10 dark:text-white dark:ring-purple-400/30',
  },
  ultra: {
    orb: 'bg-gradient-to-br from-green-300 via-emerald-200 to-transparent dark:from-green-500/40 dark:via-emerald-500/20 dark:to-transparent',
    orb2: 'bg-gradient-to-tr from-green-400 to-teal-300 dark:from-green-500/30 dark:to-teal-500/20',
    wash: 'bg-gradient-to-r from-green-200/60 via-emerald-100/30 to-green-200/50 dark:from-green-500/15 dark:via-emerald-500/[0.06] dark:to-green-500/10',
    pill: 'bg-gradient-to-br from-white to-green-50 text-green-900 ring-1 ring-green-200 shadow-soft dark:from-white/[0.12] dark:to-green-500/10 dark:text-white dark:ring-green-400/30',
  },
  chipped: {
    orb: 'bg-gradient-to-br from-red-300 via-rose-200 to-transparent dark:from-red-500/40 dark:via-rose-500/20 dark:to-transparent',
    orb2: 'bg-gradient-to-tr from-red-400 to-orange-300 dark:from-red-500/30 dark:to-orange-500/20',
    wash: 'bg-gradient-to-r from-red-200/60 via-rose-100/30 to-red-200/50 dark:from-red-500/15 dark:via-rose-500/[0.06] dark:to-red-500/10',
    pill: 'bg-gradient-to-br from-white to-red-50 text-red-900 ring-1 ring-red-200 shadow-soft dark:from-white/[0.12] dark:to-red-500/10 dark:text-white dark:ring-red-400/30',
  },
  fibertec: {
    orb: 'bg-gradient-to-br from-sky-300 via-cyan-200 to-transparent dark:from-sky-500/40 dark:via-cyan-500/20 dark:to-transparent',
    orb2: 'bg-gradient-to-tr from-sky-400 to-blue-300 dark:from-sky-500/30 dark:to-blue-500/20',
    wash: 'bg-gradient-to-r from-sky-200/60 via-cyan-100/30 to-sky-200/50 dark:from-sky-500/15 dark:via-cyan-500/[0.06] dark:to-sky-500/10',
    pill: 'bg-gradient-to-br from-white to-sky-50 text-sky-900 ring-1 ring-sky-200 shadow-soft dark:from-white/[0.12] dark:to-sky-500/10 dark:text-white dark:ring-sky-400/30',
  },
}

const empresaKeys = Object.keys(THEME)
</script>
