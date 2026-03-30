<template>
  <svg
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    :class="className"
  >
    <!-- FONDO -->
    <rect width="200" height="200" :fill="bgFill" />

    <!-- 1. PELO TRASERO (largo, afro, coleta, ondulado) -->
    <!-- Largo: fluye por los hombros -->
    <path
      v-if="rc.hairStyle === 'largo'"
      d="M 38 80 Q 35 140 55 180 L 145 180 Q 165 140 162 80 Q 155 55 100 48 Q 45 55 38 80 Z"
      :fill="rc.hairColor.value"
    />
    <!-- Afro: gran volumen detrás y laterales -->
    <g v-if="rc.hairStyle === 'afro'">
      <ellipse cx="100" cy="78" rx="78" ry="55" :fill="rc.hairColor.value" />
      <!-- Volumen lateral extra -->
      <ellipse cx="30" cy="90" rx="22" ry="30" :fill="rc.hairColor.value" />
      <ellipse cx="170" cy="90" rx="22" ry="30" :fill="rc.hairColor.value" />
    </g>
    <!-- Coleta: cola trasera -->
    <g v-if="rc.hairStyle === 'coleta'">
      <path
        d="M 105 65 Q 140 70 145 110 Q 148 140 135 160"
        :stroke="rc.hairColor.value" stroke-width="16" stroke-linecap="round" fill="none"
      />
      <circle cx="135" cy="160" r="6" :fill="rc.hairColor.value" />
      <ellipse cx="132" cy="72" rx="6" ry="4" :fill="darkenColor(rc.hairColor.value, 0.3)" />
    </g>
    <!-- Ondulado: volumen trasero -->
    <path
      v-if="rc.hairStyle === 'ondulado'"
      d="M 40 85 Q 35 120 42 155 Q 50 170 60 175 L 140 175 Q 150 170 158 155 Q 165 120 160 85 Q 150 55 100 50 Q 50 55 40 85 Z"
      :fill="rc.hairColor.value"
    />

    <!-- 2. ROPA / CUERPO -->
    <path d="M 30 200 C 30 140 170 140 170 200 Z" :fill="rc.clothesColor.value" />
    <path d="M 75 155 Q 100 178 125 155 Z" fill="rgba(0,0,0,0.08)" />

    <!-- 3. CUELLO -->
    <rect x="85" y="130" width="30" height="40" :fill="rc.skin.base" />
    <rect x="85" y="130" width="30" height="15" :fill="rc.skin.shadow" />

    <!-- 4. OREJAS -->
    <circle cx="45" cy="115" r="14" :fill="rc.skin.base" />
    <circle cx="45" cy="115" r="8" :fill="rc.skin.shadow" opacity="0.4" />
    <circle cx="155" cy="115" r="14" :fill="rc.skin.base" />
    <circle cx="155" cy="115" r="8" :fill="rc.skin.shadow" opacity="0.4" />

    <!-- 5. AROS -->
    <g v-if="earrings === 'puntos'">
      <circle cx="45" cy="124" r="3" fill="#FFD700" />
      <circle cx="155" cy="124" r="3" fill="#FFD700" />
    </g>
    <g v-else-if="earrings === 'aros'">
      <circle cx="45" cy="128" r="7" fill="none" stroke="#FFD700" stroke-width="2" />
      <circle cx="155" cy="128" r="7" fill="none" stroke="#FFD700" stroke-width="2" />
    </g>
    <g v-else-if="earrings === 'colgantes'">
      <line x1="45" y1="124" x2="45" y2="136" stroke="#FFD700" stroke-width="1.5" />
      <circle cx="45" cy="139" r="3" fill="#FFD700" />
      <line x1="155" y1="124" x2="155" y2="136" stroke="#FFD700" stroke-width="1.5" />
      <circle cx="155" cy="139" r="3" fill="#FFD700" />
    </g>

    <!-- 6. CABEZA -->
    <rect x="50" y="50" width="100" height="110" rx="45" :fill="rc.skin.base" />

    <!-- 7. DETALLES FACIALES -->
    <!-- Cejas -->
    <template v-if="rc.sex === 'masculino'">
      <path d="M 62 85 Q 75 80 88 85" :stroke="rc.hairColor.value" stroke-width="5" stroke-linecap="round" fill="none" />
      <path d="M 112 85 Q 125 80 138 85" :stroke="rc.hairColor.value" stroke-width="5" stroke-linecap="round" fill="none" />
    </template>
    <template v-else>
      <path d="M 65 87 Q 75 82 85 87" :stroke="rc.hairColor.value" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M 115 87 Q 125 82 135 87" :stroke="rc.hairColor.value" stroke-width="3" stroke-linecap="round" fill="none" />
    </template>

    <!-- Ojos -->
    <g v-if="eyeStyle === 'normal'">
      <circle cx="75" cy="105" r="10" fill="white" />
      <circle cx="125" cy="105" r="10" fill="white" />
      <circle cx="75" cy="105" r="5" :fill="rc.eyeColor.value" />
      <circle cx="125" cy="105" r="5" :fill="rc.eyeColor.value" />
      <circle cx="75" cy="105" r="2.5" fill="#111" />
      <circle cx="125" cy="105" r="2.5" fill="#111" />
      <circle cx="73" cy="103" r="1" fill="white" />
      <circle cx="123" cy="103" r="1" fill="white" />
    </g>
    <g v-else-if="eyeStyle === 'grandes'">
      <circle cx="75" cy="105" r="13" fill="white" />
      <circle cx="125" cy="105" r="13" fill="white" />
      <circle cx="75" cy="106" r="7" :fill="rc.eyeColor.value" />
      <circle cx="125" cy="106" r="7" :fill="rc.eyeColor.value" />
      <circle cx="75" cy="106" r="3.5" fill="#111" />
      <circle cx="125" cy="106" r="3.5" fill="#111" />
      <circle cx="72" cy="103" r="1.5" fill="white" />
      <circle cx="122" cy="103" r="1.5" fill="white" />
    </g>
    <g v-else-if="eyeStyle === 'almendra'">
      <!-- Forma almendrada con puntas -->
      <path d="M 63 105 Q 69 97 75 96 Q 81 97 87 105 Q 81 111 75 112 Q 69 111 63 105 Z" fill="white" />
      <path d="M 113 105 Q 119 97 125 96 Q 131 97 137 105 Q 131 111 125 112 Q 119 111 113 105 Z" fill="white" />
      <circle cx="75" cy="105" r="5" :fill="rc.eyeColor.value" />
      <circle cx="125" cy="105" r="5" :fill="rc.eyeColor.value" />
      <circle cx="75" cy="105" r="2.5" fill="#111" />
      <circle cx="125" cy="105" r="2.5" fill="#111" />
      <circle cx="73" cy="103" r="1" fill="white" />
      <circle cx="123" cy="103" r="1" fill="white" />
    </g>
    <g v-else-if="eyeStyle === 'somnolientos'">
      <circle cx="75" cy="105" r="10" fill="white" />
      <circle cx="125" cy="105" r="10" fill="white" />
      <circle cx="75" cy="107" r="5" :fill="rc.eyeColor.value" />
      <circle cx="125" cy="107" r="5" :fill="rc.eyeColor.value" />
      <circle cx="75" cy="107" r="2.5" fill="#111" />
      <circle cx="125" cy="107" r="2.5" fill="#111" />
      <circle cx="73" cy="105" r="1" fill="white" />
      <circle cx="123" cy="105" r="1" fill="white" />
      <!-- Párpados caídos -->
      <path d="M 65 100 Q 75 96 85 100 L 85 97 Q 75 92 65 97 Z" :fill="rc.skin.base" />
      <path d="M 115 100 Q 125 96 135 100 L 135 97 Q 125 92 115 97 Z" :fill="rc.skin.base" />
    </g>
    <g v-else-if="eyeStyle === 'guino'">
      <!-- Ojo izquierdo abierto -->
      <circle cx="75" cy="105" r="10" fill="white" />
      <circle cx="75" cy="105" r="5" :fill="rc.eyeColor.value" />
      <circle cx="75" cy="105" r="2.5" fill="#111" />
      <circle cx="73" cy="103" r="1" fill="white" />
      <!-- Ojo derecho cerrado (guiño) -->
      <path d="M 117 105 Q 125 99 133 105" stroke="#333" stroke-width="2.5" stroke-linecap="round" fill="none" />
    </g>

    <!-- Pestañas (femenino) -->
    <g v-if="rc.sex === 'femenino' && eyeStyle !== 'guino'" stroke="#111" stroke-width="2" stroke-linecap="round" fill="none">
      <path d="M 65 100 Q 75 92 85 100" />
      <path d="M 63 103 L 58 98" />
      <path d="M 115 100 Q 125 92 135 100" />
      <path d="M 137 103 L 142 98" />
    </g>
    <g v-else-if="rc.sex === 'femenino' && eyeStyle === 'guino'" stroke="#111" stroke-width="2" stroke-linecap="round" fill="none">
      <path d="M 65 100 Q 75 92 85 100" />
      <path d="M 63 103 L 58 98" />
    </g>

    <!-- Rubor / Mejillas (femenino) -->
    <g v-if="rc.sex === 'femenino'" fill="#FF6B81" opacity="0.3">
      <circle cx="65" cy="118" r="7" />
      <circle cx="135" cy="118" r="7" />
    </g>

    <!-- Nariz -->
    <path d="M 100 115 L 95 125 L 100 125" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.15" />

    <!-- Boca -->
    <g v-if="mouthStyle === 'sonrisa'">
      <path d="M 85 138 Q 100 152 115 138" stroke="#333" stroke-width="3" stroke-linecap="round" fill="none" />
    </g>
    <g v-else-if="mouthStyle === 'neutral'">
      <line x1="88" y1="142" x2="112" y2="142" stroke="#333" stroke-width="3" stroke-linecap="round" />
    </g>
    <g v-else-if="mouthStyle === 'abierta'">
      <!-- Boca abierta: óvalo oscuro con interior rosado -->
      <ellipse cx="100" cy="142" rx="10" ry="7" fill="#2D1B1B" />
      <ellipse cx="100" cy="144" rx="6" ry="3" fill="#C06060" />
    </g>
    <g v-else-if="mouthStyle === 'triste'">
      <path d="M 85 148 Q 100 136 115 148" stroke="#333" stroke-width="3" stroke-linecap="round" fill="none" />
    </g>
    <g v-else-if="mouthStyle === 'lengua'">
      <!-- Sonrisa con lengua asomando -->
      <path d="M 85 138 Q 100 150 115 138" stroke="#333" stroke-width="3" stroke-linecap="round" fill="none" />
      <ellipse cx="100" cy="148" rx="5" ry="4" fill="#E57373" />
    </g>

    <!-- Barba / Bigote (solo masculino) -->
    <g v-if="rc.sex === 'masculino' && facialHair !== 'ninguno'" :fill="rc.hairColor.value">
      <!-- Barba corta -->
      <path
        v-if="facialHair === 'barba_corta'"
        d="M 62 135 Q 62 158 100 163 Q 138 158 138 135 Q 128 148 100 153 Q 72 148 62 135 Z"
        opacity="0.65"
      />
      <!-- Barba larga -->
      <path
        v-if="facialHair === 'barba_larga'"
        d="M 58 130 Q 55 170 100 182 Q 145 170 142 130 Q 135 155 100 165 Q 65 155 58 130 Z"
      />
      <!-- Bigote -->
      <path
        v-if="facialHair === 'bigote'"
        d="M 84 130 Q 88 125 100 128 Q 112 125 116 130 Q 112 134 100 132 Q 88 134 84 130 Z"
      />
      <!-- Candado (bigote + perilla) -->
      <g v-if="facialHair === 'candado'">
        <path d="M 84 130 Q 88 125 100 128 Q 112 125 116 130 Q 112 134 100 132 Q 88 134 84 130 Z" />
        <path d="M 90 145 Q 90 160 100 164 Q 110 160 110 145 Q 105 150 100 150 Q 95 150 90 145 Z" />
      </g>
      <!-- Chiva (perilla chica, solo mentón) -->
      <path
        v-if="facialHair === 'chiva'"
        d="M 93 148 Q 93 158 100 161 Q 107 158 107 148 Q 104 152 100 152 Q 96 152 93 148 Z"
      />
    </g>

    <!-- 8. ANTEOJOS -->
    <g v-if="glasses === 'redondos'">
      <circle cx="75" cy="105" r="14" fill="none" stroke="#333" stroke-width="2.5" />
      <circle cx="125" cy="105" r="14" fill="none" stroke="#333" stroke-width="2.5" />
      <path d="M 89 105 L 111 105" stroke="#333" stroke-width="2.5" />
      <line x1="61" y1="105" x2="48" y2="102" stroke="#333" stroke-width="2" />
      <line x1="139" y1="105" x2="152" y2="102" stroke="#333" stroke-width="2" />
    </g>
    <g v-else-if="glasses === 'cuadrados'">
      <rect x="60" y="95" width="30" height="22" rx="3" fill="none" stroke="#333" stroke-width="2.5" />
      <rect x="110" y="95" width="30" height="22" rx="3" fill="none" stroke="#333" stroke-width="2.5" />
      <path d="M 90 106 L 110 106" stroke="#333" stroke-width="2.5" />
      <line x1="60" y1="106" x2="48" y2="103" stroke="#333" stroke-width="2" />
      <line x1="140" y1="106" x2="152" y2="103" stroke="#333" stroke-width="2" />
    </g>
    <g v-else-if="glasses === 'sol'">
      <circle cx="75" cy="105" r="14" fill="#333" fill-opacity="0.65" stroke="#333" stroke-width="2.5" />
      <circle cx="125" cy="105" r="14" fill="#333" fill-opacity="0.65" stroke="#333" stroke-width="2.5" />
      <path d="M 89 105 L 111 105" stroke="#333" stroke-width="2.5" />
      <line x1="61" y1="105" x2="48" y2="102" stroke="#333" stroke-width="2" />
      <line x1="139" y1="105" x2="152" y2="102" stroke="#333" stroke-width="2" />
    </g>

    <!-- 9. PELO FRONTAL -->
    <g :fill="rc.hairColor.value">
      <!-- Corto -->
      <path v-if="rc.hairStyle === 'corto'" d="M 48 85 C 48 36 152 36 152 85 C 145 76 134 66 120 60 C 112 56 106 54 100 54 C 94 54 88 56 80 60 C 66 66 55 76 48 85 Z" />

      <!-- Largo -->
      <g v-if="rc.hairStyle === 'largo'">
        <path d="M 45 85 C 45 30 155 30 155 85 Q 130 60 100 58 Q 70 60 45 85 Z" />
        <!-- Mechones laterales -->
        <path d="M 42 82 Q 38 110 40 140 Q 42 130 46 110 Z" opacity="0.7" />
        <path d="M 158 82 Q 162 110 160 140 Q 158 130 154 110 Z" opacity="0.7" />
      </g>

      <!-- Rulos mejorados -->
      <g v-if="rc.hairStyle === 'rulos'">
        <!-- Capa trasera (más grandes) -->
        <ellipse cx="58" cy="58" rx="22" ry="20" opacity="0.8" />
        <ellipse cx="100" cy="46" rx="26" ry="22" opacity="0.8" />
        <ellipse cx="142" cy="58" rx="22" ry="20" opacity="0.8" />
        <!-- Capa frontal (más pequeños, superpuestos) -->
        <ellipse cx="48" cy="75" rx="16" ry="14" />
        <ellipse cx="75" cy="55" rx="18" ry="16" />
        <ellipse cx="125" cy="55" rx="18" ry="16" />
        <ellipse cx="152" cy="75" rx="16" ry="14" />
        <ellipse cx="100" cy="48" rx="20" ry="15" />
        <ellipse cx="65" cy="68" rx="12" ry="10" />
        <ellipse cx="135" cy="68" rx="12" ry="10" />
      </g>

      <!-- Moño mejorado -->
      <g v-if="rc.hairStyle === 'mono'">
        <path d="M 48 85 C 48 34 152 34 152 85 C 145 76 134 66 120 58 C 110 53 105 51 100 51 C 95 51 90 53 80 58 C 66 66 55 76 48 85 Z" />
        <!-- Rodete -->
        <ellipse cx="100" cy="32" rx="18" ry="15" />
        <!-- Banda/elástico -->
        <ellipse cx="100" cy="44" rx="12" ry="3" :fill="darkenColor(rc.hairColor.value, 0.3)" />
      </g>

      <!-- Puntas -->
      <g v-if="rc.hairStyle === 'puntas'">
        <!-- Base sólida del pelo -->
        <path d="M 48 85 C 48 36 152 36 152 85 C 145 76 134 66 120 60 C 112 56 106 54 100 54 C 94 54 88 56 80 60 C 66 66 55 76 48 85 Z" />
        <!-- Puntas que salen hacia arriba -->
        <path d="M 60 60 L 68 34 L 78 58 Z" />
        <path d="M 78 54 L 88 28 L 96 52 Z" />
        <path d="M 94 52 L 104 24 L 112 50 Z" />
        <path d="M 110 54 L 120 30 L 128 56 Z" />
        <path d="M 126 58 L 136 36 L 144 62 Z" />
      </g>

      <!-- Flequillo -->
      <g v-if="rc.hairStyle === 'flequillo'">
        <!-- Base del pelo (igual que corto) -->
        <path d="M 48 85 C 48 36 152 36 152 85 C 145 76 134 66 120 60 C 112 56 106 54 100 54 C 94 54 88 56 80 60 C 66 66 55 76 48 85 Z" />
        <!-- Flequillo: franja que cae sobre la frente desde un lado -->
        <path d="M 48 80 C 48 60 60 52 80 50 Q 105 50 115 60 L 108 82 Q 95 70 80 68 Q 60 68 48 80 Z" :fill="darkenColor(rc.hairColor.value, 0.08)" />
      </g>

      <!-- Coleta -->
      <path v-if="rc.hairStyle === 'coleta'" d="M 48 85 C 48 36 152 36 152 85 C 145 76 134 66 120 60 C 112 56 106 54 100 54 C 94 54 88 56 80 60 C 66 66 55 76 48 85 Z" />

      <!-- Ondulado -->
      <g v-if="rc.hairStyle === 'ondulado'">
        <path d="M 45 85 C 45 32 155 32 155 85 Q 130 62 100 60 Q 70 62 45 85 Z" />
        <!-- Ondas laterales -->
        <path d="M 43 82 Q 38 95 42 110 Q 47 100 43 82 Z" />
        <path d="M 157 82 Q 162 95 158 110 Q 153 100 157 82 Z" />
        <path d="M 42 108 Q 36 125 40 140 Q 46 128 42 108 Z" />
        <path d="M 158 108 Q 164 125 160 140 Q 154 128 158 108 Z" />
      </g>

      <!-- Afro -->
      <g v-if="rc.hairStyle === 'afro'">
        <!-- Corona frontal - solo la parte superior, sin cubrir ojos -->
        <path d="M 30 90 Q 30 20 100 15 Q 170 20 170 90 Q 155 70 100 65 Q 45 70 30 90 Z" />
        <!-- Volumen interior para profundidad -->
        <path d="M 38 85 Q 38 28 100 22 Q 162 28 162 85 Q 148 68 100 64 Q 52 68 38 85 Z" :fill="darkenColor(rc.hairColor.value, 0.15)" />
        <!-- Brillo superior -->
        <ellipse cx="85" cy="38" rx="25" ry="12" :fill="lightenColor(rc.hairColor.value, 0.15)" opacity="0.4" />
      </g>

      <!-- Rapado -->
      <g v-if="rc.hairStyle === 'rapado'">
        <!-- Sombra sutil que sigue la forma de la cabeza -->
        <path d="M 55 90 C 55 55 145 55 145 90 C 140 80 125 70 100 68 C 75 70 60 80 55 90 Z" opacity="0.5" />
      </g>
    </g>

    <!-- 10. SOMBRERO (capa superior) -->
    <g v-if="hat === 'gorra'">
      <!-- Cuerpo de la gorra -->
      <path d="M 48 75 Q 48 38 100 35 Q 152 38 152 75 Z" fill="#3B82F6" />
      <!-- Visera -->
      <path d="M 45 75 Q 20 78 18 82 L 18 85 Q 22 83 48 78 Z" fill="#2563EB" />
      <!-- Botón superior -->
      <circle cx="100" cy="35" r="3" fill="#2563EB" />
    </g>
    <g v-else-if="hat === 'beanie'">
      <!-- Gorro -->
      <path d="M 46 80 Q 46 28 100 22 Q 154 28 154 80 Z" fill="#EF4444" />
      <!-- Banda inferior doblada -->
      <path d="M 46 80 Q 46 70 100 65 Q 154 70 154 80 Z" fill="#DC2626" />
      <!-- Pompón -->
      <circle cx="100" cy="22" r="8" fill="#F87171" />
    </g>
    <g v-else-if="hat === 'sombrero'">
      <!-- Copa -->
      <path d="M 52 72 Q 52 28 100 22 Q 148 28 148 72 Z" fill="#92400E" />
      <!-- Ala ancha -->
      <ellipse cx="100" cy="72" rx="78" ry="11" fill="#78350F" />
      <!-- Cinta -->
      <path d="M 52 65 Q 52 60 100 57 Q 148 60 148 65 Z" fill="#451A03" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type AvatarConfig, BG_COLORS, generateAvatarFromSeed } from '~/utils/avatar'

export type { AvatarConfig }

const props = withDefaults(defineProps<{
  config?: AvatarConfig | null
  seed?: string
  className?: string
}>(), {
  config: null,
  seed: '',
  className: 'drop-shadow-sm'
})

const resolvedConfig = computed<AvatarConfig>(() => {
  if (props.config) return props.config
  return generateAvatarFromSeed(props.seed || 'default')
})

const rc = resolvedConfig

const bgFill = computed(() => {
  return resolvedConfig.value.bgColor?.value || BG_COLORS[0]?.value || '#DBEAFE'
})

const eyeStyle = computed(() => rc.value.eyeStyle || 'normal')
const mouthStyle = computed(() => rc.value.mouthStyle || 'sonrisa')
const glasses = computed(() => rc.value.glasses || 'ninguno')
const earrings = computed(() => rc.value.earrings || 'ninguno')
const hat = computed(() => rc.value.hat || 'ninguno')
const facialHair = computed(() => rc.value.facialHair || 'ninguno')

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, ((num >> 16) & 0xFF) - Math.round(255 * amount))
  const g = Math.max(0, ((num >> 8) & 0xFF) - Math.round(255 * amount))
  const b = Math.max(0, (num & 0xFF) - Math.round(255 * amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, ((num >> 16) & 0xFF) + Math.round(255 * amount))
  const g = Math.min(255, ((num >> 8) & 0xFF) + Math.round(255 * amount))
  const b = Math.min(255, (num & 0xFF) + Math.round(255 * amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
</script>
