import { serverSupabaseClient } from '#supabase/server'

// Geocodifica una dirección argentina: cache → georef-ar (API oficial) → Nominatim.
// Guarda también los "no encontrados" en cache para no reintentar.
// El pacing (1 req/seg) lo maneja el cliente al geocodificar en lote.

interface GeoResult {
  lat: number | null
  lng: number | null
  provider: string | null
}

// Consulta por departamento + validación por distancia al centroide de la
// localidad esperada (ver server/utils/geo.ts para el porqué).
async function geocodeGeoref(calle: string, localidad: string): Promise<GeoResult | null> {
  try {
    const datos = datosLocalidad(localidad)
    const params = new URLSearchParams({ direccion: calle, max: '3' })
    if (datos) {
      params.set('departamento', datos.dep)
      params.set('provincia', datos.prov)
    } else if (localidad) {
      params.set('localidad_censal', localidad)
    }
    const res: any = await $fetch(`https://apis.datos.gob.ar/georef/api/direcciones?${params.toString()}`, {
      timeout: 8000,
    })
    for (const c of res?.direcciones ?? []) {
      const u = c?.ubicacion
      if (u?.lat == null || u?.lon == null) continue
      const lat = Number(u.lat)
      const lng = Number(u.lon)
      if (dentroDeLocalidad(lat, lng, datos)) {
        return { lat, lng, provider: 'georef' }
      }
    }
    return null
  } catch {
    return null
  }
}

// Búsqueda estructurada primero (street/city/state), texto libre de fallback;
// candidatos validados por distancia igual que georef.
async function geocodeNominatim(calle: string, localidad: string): Promise<GeoResult | null> {
  const datos = datosLocalidad(localidad)
  const headers = { 'User-Agent': 'AMSI-CRM/1.0 (crm interno; contacto: admin)' }

  const buscar = async (params: URLSearchParams): Promise<GeoResult | null> => {
    try {
      params.set('format', 'json')
      params.set('limit', '3')
      params.set('countrycodes', 'ar')
      const res: any = await $fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        timeout: 8000,
        headers,
      })
      for (const c of Array.isArray(res) ? res : []) {
        if (c?.lat == null || c?.lon == null) continue
        const lat = Number(c.lat)
        const lng = Number(c.lon)
        if (dentroDeLocalidad(lat, lng, datos)) {
          return { lat, lng, provider: 'nominatim' }
        }
      }
      return null
    } catch {
      return null
    }
  }

  const estructurada = await buscar(new URLSearchParams({
    street: calle,
    city: localidad,
    state: datos?.prov ?? 'Santa Fe',
  }))
  if (estructurada) return estructurada

  return buscar(new URLSearchParams({
    q: [calle, localidad, datos?.prov ?? '', 'Argentina'].filter(Boolean).join(', '),
  }))
}

export default defineEventHandler(async (event) => {
  await requireProfile(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const calle = limpiarCalle(body.calle)
  const localidad = normalizarLocalidad(body.localidad)
  const provincia = String(body.provincia ?? '').trim()

  if (!calle) {
    throw createError({ statusCode: 400, statusMessage: 'Falta la calle' })
  }

  const clave = claveGeocode(calle, localidad, provincia)

  // 1) Cache. Un miss marcado 'georef_miss' (del endpoint masivo) todavía no
  //    probó Nominatim: en ese caso seguimos al fallback en vez de devolverlo.
  const { data: cached } = await client
    .from('geocode_cache')
    .select('lat, lng, provider')
    .eq('direccion', clave)
    .maybeSingle()

  if (cached && !(cached.lat == null && cached.provider === 'georef_miss')) {
    return {
      found: cached.lat != null,
      lat: cached.lat,
      lng: cached.lng,
      provider: cached.provider,
      cached: true,
    }
  }

  // 2) georef-ar (salvo que el cache ya sepa que georef no la encuentra) → 3) Nominatim
  let result = cached?.provider === 'georef_miss'
    ? null
    : await geocodeGeoref(calle, localidad)
  if (!result) {
    result = await geocodeNominatim(calle, localidad)
  }

  const final: GeoResult = result ?? { lat: null, lng: null, provider: null }

  // Guardar en cache (incluso "no encontrado"); best-effort
  const { error: cacheError } = await client
    .from('geocode_cache')
    .upsert({ direccion: clave, lat: final.lat, lng: final.lng, provider: final.provider })
  if (cacheError) {
    console.error('[geocode_cache] upsert failed', cacheError)
  }

  return {
    found: final.lat != null,
    lat: final.lat,
    lng: final.lng,
    provider: final.provider,
    cached: false,
  }
})
