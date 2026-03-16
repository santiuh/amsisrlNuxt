<template>
  <svg
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    :class="className"
  >
    <!-- FONDO SUAVE -->
    <rect width="200" height="200" :fill="resolvedConfig.clothesColor.value" opacity="0.08" rx="12" />

    <!-- 1. PELO TRASERO (solo pelo largo) -->
    <rect
      v-if="resolvedConfig.hairStyle === 'largo'"
      x="40" y="70" width="120" height="120" rx="30"
      :fill="resolvedConfig.hairColor.value"
    />

    <!-- 2. ROPA / CUERPO -->
    <path d="M 30 200 C 30 140 170 140 170 200 Z" :fill="resolvedConfig.clothesColor.value" />
    <path d="M 75 155 Q 100 180 125 155 Z" fill="rgba(0,0,0,0.1)" />

    <!-- 3. CUELLO -->
    <rect x="85" y="130" width="30" height="40" :fill="resolvedConfig.skin.base" />
    <rect x="85" y="130" width="30" height="15" :fill="resolvedConfig.skin.shadow" />

    <!-- 4. OREJAS -->
    <circle cx="45" cy="115" r="14" :fill="resolvedConfig.skin.base" />
    <circle cx="45" cy="115" r="8" :fill="resolvedConfig.skin.shadow" opacity="0.4" />
    <circle cx="155" cy="115" r="14" :fill="resolvedConfig.skin.base" />
    <circle cx="155" cy="115" r="8" :fill="resolvedConfig.skin.shadow" opacity="0.4" />

    <!-- 5. CABEZA -->
    <rect x="50" y="50" width="100" height="110" rx="45" :fill="resolvedConfig.skin.base" />

    <!-- 6. DETALLES FACIALES -->
    <!-- Cejas -->
    <template v-if="resolvedConfig.sex === 'masculino'">
      <path d="M 62 85 Q 75 80 88 85" :stroke="resolvedConfig.hairColor.value" stroke-width="5" stroke-linecap="round" fill="none" />
      <path d="M 112 85 Q 125 80 138 85" :stroke="resolvedConfig.hairColor.value" stroke-width="5" stroke-linecap="round" fill="none" />
    </template>
    <template v-else>
      <path d="M 65 87 Q 75 82 85 87" :stroke="resolvedConfig.hairColor.value" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M 115 87 Q 125 82 135 87" :stroke="resolvedConfig.hairColor.value" stroke-width="3" stroke-linecap="round" fill="none" />
    </template>

    <!-- Ojos (blanco + iris + pupila + brillo) -->
    <circle cx="75" cy="105" r="10" fill="white" />
    <circle cx="125" cy="105" r="10" fill="white" />
    <circle cx="75" cy="105" r="5" :fill="resolvedConfig.eyeColor.value" />
    <circle cx="125" cy="105" r="5" :fill="resolvedConfig.eyeColor.value" />
    <circle cx="75" cy="105" r="2.5" fill="#111" />
    <circle cx="125" cy="105" r="2.5" fill="#111" />
    <circle cx="73" cy="103" r="1" fill="white" />
    <circle cx="123" cy="103" r="1" fill="white" />

    <!-- Pestañas (femenino) -->
    <g v-if="resolvedConfig.sex === 'femenino'" stroke="#111" stroke-width="2" stroke-linecap="round" fill="none">
      <path d="M 65 100 Q 75 92 85 100" />
      <path d="M 63 103 L 58 98" />
      <path d="M 115 100 Q 125 92 135 100" />
      <path d="M 137 103 L 142 98" />
    </g>

    <!-- Rubor / Mejillas (femenino) -->
    <g v-if="resolvedConfig.sex === 'femenino'" fill="#FF6B81" opacity="0.3">
      <circle cx="65" cy="118" r="7" />
      <circle cx="135" cy="118" r="7" />
    </g>

    <!-- Nariz -->
    <path d="M 100 115 L 95 125 L 100 125" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.15" />

    <!-- Boca -->
    <path d="M 85 138 Q 100 152 115 138" stroke="#333" stroke-width="3" stroke-linecap="round" fill="none" />

    <!-- 7. PELO FRONTAL -->
    <g :fill="resolvedConfig.hairColor.value">
      <!-- Corto -->
      <path v-if="resolvedConfig.hairStyle === 'corto'" d="M 48 85 C 48 40 152 40 152 85 Q 125 65 100 65 Q 75 65 48 85 Z" />

      <!-- Largo -->
      <path v-if="resolvedConfig.hairStyle === 'largo'" d="M 45 85 C 45 30 155 30 155 85 Q 125 60 100 60 Q 75 60 45 85 Z" />

      <!-- Rulos -->
      <g v-if="resolvedConfig.hairStyle === 'rulos'">
        <circle cx="60" cy="55" r="25" />
        <circle cx="100" cy="45" r="30" />
        <circle cx="140" cy="55" r="25" />
        <circle cx="45" cy="75" r="20" />
        <circle cx="155" cy="75" r="20" />
        <circle cx="80" cy="75" r="15" />
        <circle cx="120" cy="75" r="15" />
      </g>

      <!-- Moño -->
      <g v-if="resolvedConfig.hairStyle === 'mono'">
        <path d="M 48 85 C 48 40 152 40 152 85 Q 125 65 100 65 Q 75 65 48 85 Z" />
        <circle cx="100" cy="25" r="25" />
      </g>

      <!-- Puntas -->
      <g v-if="resolvedConfig.hairStyle === 'puntas'">
        <path d="M 48 85 C 48 50 152 50 152 85 Z" />
        <path d="M 45 70 L 55 35 L 75 60 L 95 25 L 115 60 L 135 35 L 155 70 Z" />
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type AvatarConfig, generateAvatarFromSeed } from '~/utils/avatar'

export type { AvatarConfig }

const props = withDefaults(defineProps<{
  config?: AvatarConfig | null
  seed?: string
  className?: string
}>(), {
  config: null,
  seed: '',
  className: 'w-full h-full drop-shadow-sm'
})

const resolvedConfig = computed<AvatarConfig>(() => {
  if (props.config) return props.config
  return generateAvatarFromSeed(props.seed || 'default')
})
</script>
