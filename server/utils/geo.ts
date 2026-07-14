// Normalización de direcciones para geocodificar con georef-ar.
// Las localidades vienen abreviadas en los datos cargados por vendedores
// ("C. Bermudez", "F. L. Beltran", "Baigorria"...) y georef exige el nombre
// censal. Alias verificados contra /api/localidades el 2026-07-12.

const sinAcentos = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')

const LOCALIDAD_ALIAS: Record<string, string> = {
  'baigorria': 'Granadero Baigorria',
  'gdro baigorria': 'Granadero Baigorria',
  'granadero baigorria': 'Granadero Baigorria',
  'bermudez': 'Capitán Bermúdez',
  'c bermudez': 'Capitán Bermúdez',
  'c. bermudez': 'Capitán Bermúdez',
  'cap bermudez': 'Capitán Bermúdez',
  'capitan bermudez': 'Capitán Bermúdez',
  'beltran': 'Fray Luis Beltrán',
  'f l beltran': 'Fray Luis Beltrán',
  'f. l. beltran': 'Fray Luis Beltrán',
  'fl beltran': 'Fray Luis Beltrán',
  'fray luis beltran': 'Fray Luis Beltrán',
  'pto gral san martin': 'Puerto General San Martín',
  'pto gral. san martin': 'Puerto General San Martín',
  'puerto gral san martin': 'Puerto General San Martín',
  'puerto general san martin': 'Puerto General San Martín',
  'perez': 'Pérez',
  'san nicolas': 'San Nicolás de los Arroyos',
  'monjes': 'Monje',
  'timbues': 'Timbúes',
}

/** Traduce abreviaturas comunes al nombre censal que espera georef. */
export function normalizarLocalidad(localidad: string | null | undefined): string {
  const raw = String(localidad ?? '').trim()
  if (!raw) return ''
  const key = sinAcentos(raw.toLowerCase()).replace(/\s+/g, ' ')
  return LOCALIDAD_ALIAS[key] ?? raw
}

/** Limpia la calle para georef: corta depto/piso/casa y aclaraciones al final. */
export function limpiarCalle(calle: string | null | undefined): string {
  return String(calle ?? '')
    .replace(/\b(dto|dpto|depto|departamento|casa|piso|pb|torre|monoblock|mono|local)\b[\s.:°º]*.*$/i, '')
    .replace(/[.,;]+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Clave de cache: dirección normalizada en minúsculas. */
export function claveGeocode(calle: string, localidad: string, provincia = ''): string {
  return [calle, localidad, provincia, 'argentina']
    .filter(Boolean)
    .join(', ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Geografía de las localidades de trabajo ─────────────────────────────
// georef NO georeferencia bien filtrando por localidad_censal (INDEC asigna
// las cuadras a localidades censales que no coinciden con el nombre coloquial,
// ej. "Villa Elvira" dentro de Capitán Bermúdez). La estrategia probada:
// consultar por DEPARTAMENTO y validar los candidatos por distancia al
// centroide de la localidad esperada. Centroides de georef /localidades
// (verificados 2026-07-12).

export interface DatosLocalidad {
  dep: string
  prov: string
  lat: number
  lng: number
}

const LOCALIDAD_GEO: Record<string, DatosLocalidad> = {
  'granadero baigorria': { dep: 'Rosario', prov: 'Santa Fe', lat: -32.8618, lng: -60.7063 },
  'capitan bermudez': { dep: 'San Lorenzo', prov: 'Santa Fe', lat: -32.8265, lng: -60.7162 },
  'fray luis beltran': { dep: 'San Lorenzo', prov: 'Santa Fe', lat: -32.7815, lng: -60.7310 },
  'san lorenzo': { dep: 'San Lorenzo', prov: 'Santa Fe', lat: -32.7473, lng: -60.7357 },
  'roldan': { dep: 'San Lorenzo', prov: 'Santa Fe', lat: -32.8981, lng: -60.9096 },
  'puerto general san martin': { dep: 'San Lorenzo', prov: 'Santa Fe', lat: -32.7160, lng: -60.7314 },
  'timbues': { dep: 'San Lorenzo', prov: 'Santa Fe', lat: -32.6678, lng: -60.7936 },
  'perez': { dep: 'Rosario', prov: 'Santa Fe', lat: -32.9989, lng: -60.7699 },
  'rosario': { dep: 'Rosario', prov: 'Santa Fe', lat: -32.9472, lng: -60.6332 },
  'barrancas': { dep: 'San Jerónimo', prov: 'Santa Fe', lat: -32.2346, lng: -60.9835 },
  'maciel': { dep: 'San Jerónimo', prov: 'Santa Fe', lat: -32.4568, lng: -60.8925 },
  'monje': { dep: 'San Jerónimo', prov: 'Santa Fe', lat: -32.3604, lng: -60.9428 },
  'andino': { dep: 'Iriondo', prov: 'Santa Fe', lat: -32.6699, lng: -60.8754 },
  'san nicolas de los arroyos': { dep: 'San Nicolás', prov: 'Buenos Aires', lat: -33.3384, lng: -60.2215 },
}

/** Datos geográficos de una localidad (ya normalizada con normalizarLocalidad). */
export function datosLocalidad(localidadNormalizada: string): DatosLocalidad | null {
  const key = sinAcentos(localidadNormalizada.toLowerCase()).replace(/\s+/g, ' ').trim()
  return LOCALIDAD_GEO[key] ?? null
}

// Umbral de validación: ~15 km del centroide (en grados², lng escalada por cos ≈ 0.84)
const UMBRAL_DEG2 = (15 / 111) ** 2

/** ¿El candidato cae razonablemente cerca de la localidad esperada? */
export function dentroDeLocalidad(lat: number, lng: number, datos: DatosLocalidad | null): boolean {
  if (!datos) return true
  const dLat = lat - datos.lat
  const dLng = (lng - datos.lng) * 0.84
  return dLat * dLat + dLng * dLng < UMBRAL_DEG2
}
