export interface AvatarConfig {
  skin: { name: string; base: string; shadow: string }
  hairColor: { name: string; value: string }
  eyeColor: { name: string; value: string }
  clothesColor: { name: string; value: string }
  hairStyle: string
  sex: string
  bgColor?: { name: string; value: string }
  eyeStyle?: string
  mouthStyle?: string
  glasses?: string
  earrings?: string
  hat?: string
  facialHair?: string
}

export const SKIN_COLORS = [
  { name: 'Porcelana', base: '#FFDBAC', shadow: '#E0C096' },
  { name: 'Marfil', base: '#F1C27D', shadow: '#D5A96A' },
  { name: 'Cálido', base: '#E0AC69', shadow: '#C59458' },
  { name: 'Oliva', base: '#C68642', shadow: '#A66F35' },
  { name: 'Marrón', base: '#8D5524', shadow: '#6C401A' },
  { name: 'Oscuro', base: '#3D2210', shadow: '#241308' },
]

export const HAIR_COLORS = [
  { name: 'Negro', value: '#211814' },
  { name: 'Castaño Oscuro', value: '#4A3123' },
  { name: 'Castaño', value: '#714B31' },
  { name: 'Rubio', value: '#E4B877' },
  { name: 'Rubio Claro', value: '#F5D6A0' },
  { name: 'Pelirrojo', value: '#A4392D' },
  { name: 'Gris', value: '#A0A0A0' },
  { name: 'Rosa', value: '#F6A2B6' },
  { name: 'Azul', value: '#5D89BA' },
]

export const EYE_COLORS = [
  { name: 'Marrón Oscuro', value: '#4E342E' },
  { name: 'Marrón Claro', value: '#8D6E63' },
  { name: 'Azul', value: '#1976D2' },
  { name: 'Celeste', value: '#64B5F6' },
  { name: 'Verde', value: '#388E3C' },
  { name: 'Miel', value: '#AFB42B' },
  { name: 'Gris', value: '#757575' },
]

export const CLOTHES_COLORS = [
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Rojo', value: '#EF4444' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Amarillo', value: '#F59E0B' },
  { name: 'Púrpura', value: '#8B5CF6' },
  { name: 'Gris Oscuro', value: '#374151' },
]

export const BG_COLORS = [
  { name: 'Celeste', value: '#DBEAFE' },
  { name: 'Lavanda', value: '#EDE9FE' },
  { name: 'Rosa', value: '#FCE7F3' },
  { name: 'Menta', value: '#D1FAE5' },
  { name: 'Durazno', value: '#FEF3C7' },
  { name: 'Cielo', value: '#E0F2FE' },
  { name: 'Gris', value: '#F3F4F6' },
  { name: 'Blanco', value: '#FFFFFF' },
]

export const HAIR_STYLES = [
  { id: 'calvo', name: 'Calvo' },
  { id: 'corto', name: 'Corto' },
  { id: 'largo', name: 'Largo' },
  { id: 'rulos', name: 'Rulos' },
  { id: 'mono', name: 'Moño' },
  { id: 'puntas', name: 'Puntas' },
  { id: 'flequillo', name: 'Flequillo' },
  { id: 'coleta', name: 'Coleta' },
  { id: 'ondulado', name: 'Ondulado' },
  { id: 'afro', name: 'Afro' },
  { id: 'rapado', name: 'Rapado' },
]

export const SEX_OPTIONS = [
  { id: 'femenino', name: 'Femenino' },
  { id: 'masculino', name: 'Masculino' },
]

export const EYE_STYLES = [
  { id: 'normal', name: 'Normal' },
  { id: 'grandes', name: 'Grandes' },
  { id: 'almendra', name: 'Almendra' },
  { id: 'somnolientos', name: 'Somnolientos' },
  { id: 'guino', name: 'Guiño' },
]

export const MOUTH_STYLES = [
  { id: 'sonrisa', name: 'Sonrisa' },
  { id: 'neutral', name: 'Neutral' },
  { id: 'abierta', name: 'Abierta' },
  { id: 'triste', name: 'Triste' },
  { id: 'lengua', name: 'Lengua' },
]

export const GLASSES_STYLES = [
  { id: 'ninguno', name: 'Ninguno' },
  { id: 'redondos', name: 'Redondos' },
  { id: 'cuadrados', name: 'Cuadrados' },
  { id: 'sol', name: 'De Sol' },
]

export const EARRING_STYLES = [
  { id: 'ninguno', name: 'Ninguno' },
  { id: 'puntos', name: 'Puntos' },
  { id: 'aros', name: 'Aros' },
  { id: 'colgantes', name: 'Colgantes' },
]

export const HAT_STYLES = [
  { id: 'ninguno', name: 'Ninguno' },
  { id: 'gorra', name: 'Gorra' },
  { id: 'beanie', name: 'Gorro Lana' },
  { id: 'sombrero', name: 'Sombrero' },
]

export const FACIAL_HAIR_STYLES = [
  { id: 'ninguno', name: 'Ninguno' },
  { id: 'barba_corta', name: 'Barba Corta' },
  { id: 'barba_larga', name: 'Barba Larga' },
  { id: 'bigote', name: 'Bigote' },
  { id: 'candado', name: 'Candado' },
  { id: 'chiva', name: 'Chiva' },
]

export const getAvatarHash = (str: string) =>
  Math.abs(str.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0))

export const generateAvatarFromSeed = (seed: string): AvatarConfig => {
  const hash = getAvatarHash(seed ? seed.toLowerCase() : 'default')
  const hairStyleIds = HAIR_STYLES.map(h => h.id)
  const sexIds = SEX_OPTIONS.map(s => s.id)
  const sex = sexIds[(hash >> 5) % sexIds.length]
  return {
    skin: SKIN_COLORS[hash % SKIN_COLORS.length],
    hairColor: HAIR_COLORS[(hash >> 1) % HAIR_COLORS.length],
    eyeColor: EYE_COLORS[(hash >> 2) % EYE_COLORS.length],
    clothesColor: CLOTHES_COLORS[(hash >> 3) % CLOTHES_COLORS.length],
    hairStyle: hairStyleIds[(hash >> 4) % hairStyleIds.length],
    sex,
    bgColor: BG_COLORS[(hash >> 6) % BG_COLORS.length],
    eyeStyle: EYE_STYLES[(hash >> 7) % EYE_STYLES.length].id,
    mouthStyle: MOUTH_STYLES[(hash >> 8) % MOUTH_STYLES.length].id,
    glasses: GLASSES_STYLES[(hash >> 9) % GLASSES_STYLES.length].id,
    earrings: EARRING_STYLES[(hash >> 10) % EARRING_STYLES.length].id,
    hat: HAT_STYLES[(hash >> 11) % HAT_STYLES.length].id,
    facialHair: sex === 'masculino' ? FACIAL_HAIR_STYLES[(hash >> 12) % FACIAL_HAIR_STYLES.length].id : 'ninguno',
  }
}
