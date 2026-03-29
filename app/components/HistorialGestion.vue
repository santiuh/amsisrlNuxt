<template>
  <div class="space-y-3">
    <!-- Título con estilo de sección -->
    <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-primary-400">
      <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
      Historial
    </div>

    <!-- Entradas del log -->
    <div
      v-if="entries.length > 0"
      class="max-h-64 overflow-y-auto rounded-lg border divide-y"
      :class="conflictoStyle
        ? 'border-orange-200 dark:border-orange-900/60 divide-orange-100 dark:divide-orange-900/40 bg-orange-50 dark:bg-orange-950/40'
        : 'border-gray-200 dark:border-gray-700 divide-gray-100 dark:divide-gray-800 bg-gray-50 dark:bg-gray-900/70'"
    >
      <div
        v-for="(entry, i) in entries"
        :key="i"
        class="px-3 py-2.5 text-sm"
      >
        <div class="flex items-center gap-2 mb-0.5 flex-wrap">
          <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatFechaHora(entry.fecha_hora) }}</span>
          <div class="flex items-center gap-1.5">
            <UserAvatar
              :config="avatarMap?.[entry.autor] ?? null"
              :seed="entry.autor"
              class="w-4 h-4 rounded-full overflow-hidden shrink-0"
            />
            <span class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ entry.autor }}</span>
          </div>
          <UBadge
            v-if="entry.tipo === 'estado'"
            :color="conflictoStyle ? 'orange' : 'teal'"
            variant="subtle"
            size="xs"
            label="Cambio de estado"
          />
        </div>
        <p
          class="text-gray-800 dark:text-gray-100"
          :class="{ 'italic text-gray-500 dark:text-gray-400 text-xs': entry.tipo === 'estado' }"
        >
          {{ entry.texto }}
        </p>
      </div>
    </div>
    <p v-else class="text-xs text-gray-400 dark:text-gray-500 italic">Sin actividad registrada.</p>

    <!-- Agregar mensaje -->
    <div class="space-y-2 pt-1">
      <UTextarea
        :model-value="modelValue"
        placeholder="Escribí tu mensaje..."
        :rows="2"
        class="w-full"
        @update:model-value="$emit('update:modelValue', $event)"
      />
      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-circle"
        color="red"
        variant="soft"
        :title="error"
      />
      <div class="flex justify-end">
        <UButton
          label="Enviar"
          icon="i-heroicons-paper-airplane"
          size="sm"
          :loading="loading"
          :disabled="!modelValue?.trim()"
          @click="$emit('submit')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  entries: any[]
  avatarMap?: Record<string, any>
  modelValue?: string
  loading?: boolean
  error?: string
  conflictoStyle?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()
</script>
