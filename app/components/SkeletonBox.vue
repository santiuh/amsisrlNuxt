<template>
  <component
    :is="tag"
    class="sk-box"
    :class="[shapeClass, toneClass]"
    :style="styleVars"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
type Variant = 'text' | 'rect' | 'circle' | 'pill'
type Tone = 'neutral' | 'cyan' | 'purple' | 'violet' | 'emerald' | 'amber' | 'green' | 'red' | 'sky'

const props = withDefaults(defineProps<{
  variant?: Variant
  width?: string | number
  height?: string | number
  rounded?: string
  tone?: Tone
  tag?: string
}>(), {
  variant: 'rect',
  tone: 'neutral',
  tag: 'div',
})

const shapeClass = computed(() => {
  switch (props.variant) {
    case 'text': return 'rounded-md'
    case 'circle': return 'rounded-full aspect-square'
    case 'pill': return 'rounded-full'
    default: return props.rounded ?? 'rounded-xl'
  }
})

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'sk-tone-neutral',
  cyan: 'sk-tone-cyan',
  purple: 'sk-tone-purple',
  violet: 'sk-tone-violet',
  emerald: 'sk-tone-emerald',
  amber: 'sk-tone-amber',
  green: 'sk-tone-green',
  red: 'sk-tone-red',
  sky: 'sk-tone-sky',
}

const toneClass = computed(() => TONE_CLASSES[props.tone])

const norm = (v?: string | number) => {
  if (v === undefined || v === null) return undefined
  if (typeof v === 'number') return `${v}px`
  // Strings puramente numéricos también se convierten a px (los props vienen como string desde el template)
  if (/^\d+(\.\d+)?$/.test(v)) return `${v}px`
  return v
}

const styleVars = computed(() => ({
  width: norm(props.width),
  height: norm(props.height) ?? (props.variant === 'text' ? '0.875rem' : undefined),
}))
</script>

<style>
/* Estilos globales (no-scoped) para que :is(.dark) ancestor matchee correctamente.
   Las clases sk-* tienen prefijo único para evitar colisiones. */
.sk-box {
  position: relative;
  overflow: hidden;
  background-color: var(--sk-base);
  isolation: isolate;
}

.sk-box::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    transparent 20%,
    var(--sk-shine) 50%,
    transparent 80%
  );
  background-size: 220% 100%;
  background-repeat: no-repeat;
  animation: sk-shimmer 1.6s ease-in-out infinite;
  pointer-events: none;
}

@keyframes sk-shimmer {
  0%   { background-position: 220% 0; }
  100% { background-position: -120% 0; }
}

/* Light mode (default) */
.sk-tone-neutral  { --sk-base: rgb(226 232 240);     --sk-shine: rgb(255 255 255 / 0.95); }
.sk-tone-cyan     { --sk-base: rgb(165 243 252);     --sk-shine: rgb(207 250 254); }
.sk-tone-purple   { --sk-base: rgb(233 213 255);     --sk-shine: rgb(243 232 255); }
.sk-tone-violet   { --sk-base: rgb(221 214 254);     --sk-shine: rgb(237 233 254); }
.sk-tone-emerald  { --sk-base: rgb(167 243 208);     --sk-shine: rgb(209 250 229); }
.sk-tone-amber    { --sk-base: rgb(253 230 138);     --sk-shine: rgb(254 243 199); }
.sk-tone-green    { --sk-base: rgb(187 247 208);     --sk-shine: rgb(220 252 231); }
.sk-tone-red      { --sk-base: rgb(254 202 202);     --sk-shine: rgb(254 226 226); }
.sk-tone-sky      { --sk-base: rgb(186 230 253);     --sk-shine: rgb(224 242 254); }

/* Dark mode — más sutil para no agredir la vista sobre fondos oscuros */
.dark .sk-tone-neutral  { --sk-base: rgb(148 163 184 / 0.12); --sk-shine: rgb(148 163 184 / 0.22); }
.dark .sk-tone-cyan     { --sk-base: rgb(6 182 212 / 0.18);   --sk-shine: rgb(34 211 238 / 0.32); }
.dark .sk-tone-purple   { --sk-base: rgb(168 85 247 / 0.18);  --sk-shine: rgb(192 132 252 / 0.32); }
.dark .sk-tone-violet   { --sk-base: rgb(139 92 246 / 0.18);  --sk-shine: rgb(167 139 250 / 0.32); }
.dark .sk-tone-emerald  { --sk-base: rgb(16 185 129 / 0.18);  --sk-shine: rgb(52 211 153 / 0.32); }
.dark .sk-tone-amber    { --sk-base: rgb(245 158 11 / 0.18);  --sk-shine: rgb(252 211 77 / 0.32); }
.dark .sk-tone-green    { --sk-base: rgb(34 197 94 / 0.18);   --sk-shine: rgb(74 222 128 / 0.32); }
.dark .sk-tone-red      { --sk-base: rgb(239 68 68 / 0.18);   --sk-shine: rgb(248 113 113 / 0.32); }
.dark .sk-tone-sky      { --sk-base: rgb(14 165 233 / 0.18);  --sk-shine: rgb(56 189 248 / 0.32); }

@media (prefers-reduced-motion: reduce) {
  .sk-box::after { animation: none; opacity: 0; }
  .sk-box { animation: sk-pulse 2.2s ease-in-out infinite; }
  @keyframes sk-pulse {
    0%, 100% { opacity: 0.85; }
    50% { opacity: 0.55; }
  }
}
</style>
