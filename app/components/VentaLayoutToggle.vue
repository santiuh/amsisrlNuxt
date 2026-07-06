<template>
  <UButtonGroup class="hidden lg:inline-flex" size="xs">
    <UButton
      :color="mode === 'compacta' ? 'primary' : 'gray'"
      :variant="mode === 'compacta' ? 'solid' : 'outline'"
      icon="i-heroicons-view-columns"
      label="Compacta"
      @click="mode = 'compacta'"
    />
    <UButton
      :color="mode === 'comoda' ? 'primary' : 'gray'"
      :variant="mode === 'comoda' ? 'solid' : 'outline'"
      icon="i-heroicons-bars-3"
      label="Cómoda"
      @click="mode = 'comoda'"
    />
  </UButtonGroup>
</template>

<script setup lang="ts">
const mode = useVentaFormLayout()
</script>
