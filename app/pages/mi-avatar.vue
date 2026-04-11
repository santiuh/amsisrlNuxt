<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex flex-col md:flex-row gap-8">
      <!-- PANEL IZQUIERDO: PREVIEW -->
      <div class="md:w-1/3 flex-shrink-0">
        <UCard class="sticky top-6">
          <div class="flex flex-col items-center text-center gap-4 py-6">
            <!-- Avatar grande -->
            <div class="w-48 h-48 rounded-full border-4 border-white dark:border-gray-800 shadow-lg relative bg-white dark:bg-gray-800">
              <UserAvatar :config="config" class="w-full h-full rounded-full" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ profile?.nombre }}</h2>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize mt-1">{{ rolLabel }}</p>
            </div>
          </div>
          <template #footer>
            <div class="flex flex-col gap-3">
              <UButton
                icon="i-heroicons-check"
                color="primary"
                label="Guardar Avatar"
                size="lg"
                block
                :loading="saving"
                @click="guardar"
              />
              <UButton
                icon="i-heroicons-arrow-path"
                color="gray"
                variant="ghost"
                label="Generar aleatorio"
                block
                @click="randomize"
              />
            </div>
          </template>
        </UCard>
      </div>

      <!-- PANEL DERECHO: CONTROLES -->
      <div class="md:w-2/3">
        <UCard>
          <div class="space-y-8 divide-y divide-gray-100 dark:divide-gray-800">

            <!-- Sección: Apariencia -->
            <div class="pt-2">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-primary-500" />
                Apariencia
              </h3>
              <div class="space-y-6">
                <!-- Sexo -->
                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Sexo</label>
                  <div class="flex gap-2">
                    <button
                      v-for="opt in SEX_OPTIONS"
                      :key="opt.id"
                      class="flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border"
                      :class="config.sex === opt.id
                        ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-500 text-primary-700 dark:text-primary-400 shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
                      @click="config.sex = opt.id"
                    >
                      {{ opt.name }}
                    </button>
                  </div>
                </div>

                <!-- Estilo de Pelo -->
                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Estilo de Pelo</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="style in HAIR_STYLES"
                      :key="style.id"
                      class="min-w-[30%] flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border"
                      :class="config.hairStyle === style.id
                        ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-500 text-primary-700 dark:text-primary-400 shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
                      @click="config.hairStyle = style.id"
                    >
                      {{ style.name }}
                    </button>
                  </div>
                </div>

                <!-- Estilo de Ojos -->
                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Estilo de Ojos</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="style in EYE_STYLES"
                      :key="style.id"
                      class="min-w-[30%] flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border"
                      :class="config.eyeStyle === style.id
                        ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-500 text-primary-700 dark:text-primary-400 shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
                      @click="config.eyeStyle = style.id"
                    >
                      {{ style.name }}
                    </button>
                  </div>
                </div>

                <!-- Estilo de Boca -->
                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Boca</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="style in MOUTH_STYLES"
                      :key="style.id"
                      class="min-w-[30%] flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border"
                      :class="config.mouthStyle === style.id
                        ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-500 text-primary-700 dark:text-primary-400 shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
                      @click="config.mouthStyle = style.id"
                    >
                      {{ style.name }}
                    </button>
                  </div>
                </div>

                <!-- Barba / Bigote (solo masculino) -->
                <div v-if="config.sex === 'masculino'">
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Barba / Bigote</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="style in FACIAL_HAIR_STYLES"
                      :key="style.id"
                      class="min-w-[30%] flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border"
                      :class="config.facialHair === style.id
                        ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-500 text-primary-700 dark:text-primary-400 shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
                      @click="config.facialHair = style.id"
                    >
                      {{ style.name }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sección: Accesorios -->
            <div class="pt-8 mt-8">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2 cursor-pointer select-none" @click="onAccesoriosClick">
                <UIcon name="i-heroicons-gift" class="w-5 h-5 text-primary-500" />
                Accesorios
              </h3>
              <div class="space-y-6">
                <!-- Anteojos -->
                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Anteojos</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="style in GLASSES_STYLES"
                      :key="style.id"
                      class="min-w-[30%] flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border"
                      :class="config.glasses === style.id
                        ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-500 text-primary-700 dark:text-primary-400 shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
                      @click="config.glasses = style.id"
                    >
                      {{ style.name }}
                    </button>
                  </div>
                </div>

                <!-- Aros -->
                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Aros</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="style in EARRING_STYLES"
                      :key="style.id"
                      class="min-w-[30%] flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border"
                      :class="config.earrings === style.id
                        ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-500 text-primary-700 dark:text-primary-400 shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
                      @click="config.earrings = style.id"
                    >
                      {{ style.name }}
                    </button>
                  </div>
                </div>

                <!-- Sombrero -->
                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Sombrero</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="style in HAT_STYLES"
                      :key="style.id"
                      class="min-w-[30%] flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border"
                      :class="config.hat === style.id
                        ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-500 text-primary-700 dark:text-primary-400 shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
                      @click="config.hat = style.id"
                    >
                      {{ style.name }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sección: Colores -->
            <div class="pt-8 mt-8">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <UIcon name="i-heroicons-swatch" class="w-5 h-5 text-primary-500" />
                Colores
              </h3>
              <div class="space-y-6">
                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Tono de Piel</label>
                  <div class="flex flex-wrap gap-3">
                    <button
                      v-for="skin in SKIN_COLORS"
                      :key="skin.name"
                      :title="skin.name"
                      class="relative w-10 h-10 rounded-full focus:outline-none transition-all duration-200 shadow-sm border border-black/10 dark:border-white/10"
                      :class="config.skin.name === skin.name ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900 scale-110' : 'hover:scale-110'"
                      :style="{ backgroundColor: skin.base }"
                      @click="config.skin = skin"
                    >
                      <UIcon
                        v-if="config.skin.name === skin.name"
                        name="i-heroicons-check"
                        class="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                      />
                    </button>
                  </div>
                </div>

                <div v-if="config.hairStyle !== 'calvo'">
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Color de Pelo</label>
                  <div class="flex flex-wrap gap-3">
                    <button
                      v-for="color in HAIR_COLORS"
                      :key="color.name"
                      :title="color.name"
                      class="relative w-10 h-10 rounded-full focus:outline-none transition-all duration-200 shadow-sm border border-black/10 dark:border-white/10"
                      :class="config.hairColor.name === color.name ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900 scale-110' : 'hover:scale-110'"
                      :style="{ backgroundColor: color.value }"
                      @click="config.hairColor = color"
                    >
                      <UIcon
                        v-if="config.hairColor.name === color.name"
                        name="i-heroicons-check"
                        class="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Color de Ojos</label>
                  <div class="flex flex-wrap gap-3">
                    <button
                      v-for="color in EYE_COLORS"
                      :key="color.name"
                      :title="color.name"
                      class="relative w-10 h-10 rounded-full focus:outline-none transition-all duration-200 shadow-sm border border-black/10 dark:border-white/10"
                      :class="config.eyeColor.name === color.name ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900 scale-110' : 'hover:scale-110'"
                      :style="{ backgroundColor: color.value }"
                      @click="config.eyeColor = color"
                    >
                      <UIcon
                        v-if="config.eyeColor.name === color.name"
                        name="i-heroicons-check"
                        class="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Color de Ropa</label>
                  <div class="flex flex-wrap gap-3">
                    <button
                      v-for="color in CLOTHES_COLORS"
                      :key="color.name"
                      :title="color.name"
                      class="relative w-10 h-10 rounded-full focus:outline-none transition-all duration-200 shadow-sm border border-black/10 dark:border-white/10"
                      :class="config.clothesColor.name === color.name ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900 scale-110' : 'hover:scale-110'"
                      :style="{ backgroundColor: color.value }"
                      @click="config.clothesColor = color"
                    >
                      <UIcon
                        v-if="config.clothesColor.name === color.name"
                        name="i-heroicons-check"
                        class="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Color de Fondo</label>
                  <div class="flex flex-wrap gap-3">
                    <button
                      v-for="color in BG_COLORS"
                      :key="color.name"
                      :title="color.name"
                      class="relative w-10 h-10 rounded-full focus:outline-none transition-all duration-200 shadow-sm border border-black/10 dark:border-white/10"
                      :class="config.bgColor?.name === color.name ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900 scale-110' : 'hover:scale-110'"
                      :style="{ backgroundColor: color.value }"
                      @click="config.bgColor = color"
                    >
                      <UIcon
                        v-if="config.bgColor?.name === color.name"
                        name="i-heroicons-check"
                        class="absolute inset-0 m-auto w-5 h-5 text-gray-600 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </UCard>
      </div>
    </div>

    <ArcadeEasterEgg v-model="showArcade" />
  </div>
</template>

<script setup lang="ts">
import {
  type AvatarConfig,
  SKIN_COLORS,
  HAIR_COLORS,
  EYE_COLORS,
  CLOTHES_COLORS,
  BG_COLORS,
  HAIR_STYLES,
  SEX_OPTIONS,
  EYE_STYLES,
  MOUTH_STYLES,
  GLASSES_STYLES,
  EARRING_STYLES,
  HAT_STYLES,
  FACIAL_HAIR_STYLES,
  generateAvatarFromSeed,
} from '~/utils/avatar'

const profile = useCurrentProfile()
const toast = useToast()
const saving = ref(false)

// Easter egg: 6 clicks en "Accesorios" abre el arcade
const easterEggClicks = ref(0)
const showArcade = ref(false)
let easterEggTimer: ReturnType<typeof setTimeout> | null = null

const onAccesoriosClick = () => {
  easterEggClicks.value++
  if (easterEggTimer) clearTimeout(easterEggTimer)
  easterEggTimer = setTimeout(() => { easterEggClicks.value = 0 }, 2000)
  if (easterEggClicks.value >= 6) {
    easterEggClicks.value = 0
    showArcade.value = true
  }
}

const rolLabel = computed(() => {
  const labels: Record<string, string> = {
    vendedor: 'Vendedor',
    oficinista: 'Oficinista',
    lider: 'Líder',
    admin: 'Administrador',
  }
  return labels[profile.value?.rol ?? 'vendedor']
})

const initialConfig = (): AvatarConfig => {
  if (profile.value?.avatar_config) return { ...profile.value.avatar_config }
  return generateAvatarFromSeed(profile.value?.nombre || 'default')
}

const config = reactive<AvatarConfig>(initialConfig())

const randomize = () => {
  const randIdx = (arr: any[]) => Math.floor(Math.random() * arr.length)
  config.sex = SEX_OPTIONS[randIdx(SEX_OPTIONS)].id
  config.skin = SKIN_COLORS[randIdx(SKIN_COLORS)]
  config.hairColor = HAIR_COLORS[randIdx(HAIR_COLORS)]
  config.eyeColor = EYE_COLORS[randIdx(EYE_COLORS)]
  config.clothesColor = CLOTHES_COLORS[randIdx(CLOTHES_COLORS)]
  config.hairStyle = HAIR_STYLES[randIdx(HAIR_STYLES)].id
  config.bgColor = BG_COLORS[randIdx(BG_COLORS)]
  config.eyeStyle = EYE_STYLES[randIdx(EYE_STYLES)].id
  config.mouthStyle = MOUTH_STYLES[randIdx(MOUTH_STYLES)].id
  config.glasses = GLASSES_STYLES[randIdx(GLASSES_STYLES)].id
  config.earrings = EARRING_STYLES[randIdx(EARRING_STYLES)].id
  config.hat = HAT_STYLES[randIdx(HAT_STYLES)].id
  config.facialHair = config.sex === 'masculino' ? FACIAL_HAIR_STYLES[randIdx(FACIAL_HAIR_STYLES)].id : 'ninguno'
}

const guardar = async () => {
  saving.value = true
  try {
    await $fetch('/api/profile/avatar', {
      method: 'PUT',
      body: { config },
    })
    if (profile.value) {
      profile.value.avatar_config = { ...config }
    }
    toast.add({ title: 'Avatar guardado', color: 'green' })
  } catch {
    toast.add({ title: 'Error al guardar el avatar', color: 'red' })
  } finally {
    saving.value = false
  }
}
</script>
