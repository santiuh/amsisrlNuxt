// Búsqueda interactiva de direcciones para el mapa. Devuelve varios candidatos
// (georef + Nominatim en paralelo) con etiqueta para que el usuario elija.
// Uso puntual (una búsqueda por vez), no masivo → sin cache ni rate limit.

interface Candidato {
  label: string
  lat: number
  lng: number
  fuente: 'georef' | 'osm'
}

async function buscarGeoref(texto: string): Promise<Candidato[]> {
  try {
    const params = new URLSearchParams({ direccion: texto, max: '5', campos: 'estandar' })
    const res: any = await $fetch(`https://apis.datos.gob.ar/georef/api/direcciones?${params.toString()}`, {
      timeout: 8000,
    })
    return (res?.direcciones ?? [])
      .filter((d: any) => d?.ubicacion?.lat != null && d?.ubicacion?.lon != null)
      .map((d: any): Candidato => ({
        label: d.nomenclatura ?? texto,
        lat: Number(d.ubicacion.lat),
        lng: Number(d.ubicacion.lon),
        fuente: 'georef',
      }))
  } catch {
    return []
  }
}

async function buscarOsm(texto: string): Promise<Candidato[]> {
  try {
    const params = new URLSearchParams({
      q: /santa fe|buenos aires|argentina/i.test(texto) ? texto : `${texto}, Santa Fe, Argentina`,
      format: 'json',
      limit: '5',
      countrycodes: 'ar',
      addressdetails: '1',
    })
    const res: any = await $fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      timeout: 8000,
      headers: { 'User-Agent': 'AMSI-CRM/1.0 (crm interno; contacto: admin)' },
    })
    return (Array.isArray(res) ? res : [])
      .filter((r: any) => r?.lat != null && r?.lon != null)
      .map((r: any): Candidato => ({
        label: String(r.display_name ?? texto),
        lat: Number(r.lat),
        lng: Number(r.lon),
        fuente: 'osm',
      }))
  } catch {
    return []
  }
}

export default defineEventHandler(async (event) => {
  await requireProfile(event)
  const body = await readBody(event)

  const texto = String(body.texto ?? '').trim()
  if (texto.length < 3) {
    throw createError({ statusCode: 400, statusMessage: 'Escribí al menos 3 caracteres' })
  }

  // Limpieza suave: si el usuario incluyó localidad conocida, normalizarla ayuda
  const consultaGeoref = limpiarCalle(texto) || texto
  const [georef, osm] = await Promise.all([
    buscarGeoref(consultaGeoref),
    buscarOsm(normalizarTextoBusqueda(texto)),
  ])

  // Merge dedupe por cercanía (~50 m); georef primero (más preciso en calle+altura)
  const candidatos: Candidato[] = []
  for (const c of [...georef, ...osm]) {
    const dup = candidatos.some(
      x => Math.abs(x.lat - c.lat) < 0.0005 && Math.abs(x.lng - c.lng) < 0.0005,
    )
    if (!dup) candidatos.push(c)
  }

  return { candidatos: candidatos.slice(0, 8) }
})

// Traduce localidades abreviadas dentro del texto libre (ej. "C. Bermudez")
function normalizarTextoBusqueda(texto: string): string {
  const partes = texto.split(',')
  if (partes.length >= 2) {
    const ultima = partes[partes.length - 1].trim()
    const normalizada = normalizarLocalidad(ultima)
    if (normalizada !== ultima) {
      partes[partes.length - 1] = ` ${normalizada}`
      return partes.join(',')
    }
  }
  return texto
}
