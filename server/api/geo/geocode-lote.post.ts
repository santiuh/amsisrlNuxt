import { serverSupabaseClient } from '#supabase/server'

// Geocodificación masiva de prospectos "sin ubicar" usando la consulta BULK de
// georef-ar (cientos de direcciones por request — sin el límite de 1/seg de
// Nominatim). Nominatim queda solo como fallback del endpoint individual.
//
// Procesa una tanda de prospectos pendientes (bajo RLS del usuario) y devuelve
// { procesados, ubicados, sin_resultado }. El cliente pagina con `offset`:
// los ubicados salen del conjunto pendiente, los "sin resultado" quedan, así que
// el offset del siguiente llamado es offset + (procesados - ubicados).

const TANDA = 200          // prospectos por request a este endpoint (modo georef)
const TANDA_NOMINATIM = 8  // consultas Nominatim por request (1.1 s c/u, cuidando el timeout serverless)
const CHUNK_GEOREF = 100   // direcciones por POST bulk a georef
const CHUNK_CACHE = 100    // claves por .in() al cache
const CHUNK_UPDATE = 10    // updates de coords en paralelo

const dormir = (ms: number) => new Promise(r => setTimeout(r, ms))

// Fase 2 (modo 'nominatim'): para los que georef no encontró. Busca en OSM con
// query estructurada + validación por distancia, a 1 req/1.1s.
async function buscarNominatim(calle: string, localidad: string): Promise<{ lat: number; lng: number } | null> {
  const datos = datosLocalidad(localidad)
  const headers = { 'User-Agent': 'AMSI-CRM/1.0 (crm interno; contacto: admin)' }
  const intentos = [
    new URLSearchParams({ street: calle, city: localidad, state: datos?.prov ?? 'Santa Fe' }),
    new URLSearchParams({ q: [calle, localidad, datos?.prov ?? '', 'Argentina'].filter(Boolean).join(', ') }),
  ]
  for (let i = 0; i < intentos.length; i++) {
    const params = intentos[i]
    params.set('format', 'json')
    params.set('limit', '3')
    params.set('countrycodes', 'ar')
    try {
      const res: any = await $fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        timeout: 8000,
        headers,
      })
      for (const c of Array.isArray(res) ? res : []) {
        if (c?.lat == null || c?.lon == null) continue
        const lat = Number(c.lat)
        const lng = Number(c.lon)
        if (dentroDeLocalidad(lat, lng, datos)) return { lat, lng }
      }
    } catch {
      // timeout/red: probar el siguiente intento
    }
    if (i < intentos.length - 1) await dormir(1100)
  }
  return null
}

export default defineEventHandler(async (event) => {
  await requireProfile(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const offset = Number(body.offset ?? 0) || 0
  // modo 'georef' (default): bulk rápido. modo 'nominatim': fase 2 lenta para
  // los que georef no encontró (cache 'georef_miss').
  const modo: 'georef' | 'nominatim' = body.modo === 'nominatim' ? 'nominatim' : 'georef'
  const tanda = modo === 'nominatim' ? TANDA_NOMINATIM : TANDA

  // Pendientes: sin coords y con calle (sin calle no hay nada que geocodificar)
  const { data: pendientes, error } = await client
    .from('prospectos')
    .select('id, dir_calle, dir_localidad')
    .is('lat', null)
    .not('dir_calle', 'is', null)
    .order('id', { ascending: true })
    .range(offset, offset + tanda - 1)

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }
  if (!pendientes || pendientes.length === 0) {
    return { procesados: 0, ubicados: 0, sin_resultado: 0 }
  }

  const items = pendientes.map((p) => {
    // Limpiar calle (corta "dto 1", "piso 2", etc.) y traducir localidades
    // abreviadas al nombre censal ("C. Bermudez" → "Capitán Bermúdez")
    const calle = limpiarCalle(p.dir_calle)
    const localidad = normalizarLocalidad(p.dir_localidad)
    return {
      id: p.id,
      calle,
      localidad,
      clave: claveGeocode(calle, localidad),
      lat: null as number | null,
      lng: null as number | null,
      origen: null as string | null,
    }
  })
  // Importante: `procesados` debe contar TODAS las filas leídas (incluidas las
  // que quedan sin calle tras limpiar) para que la paginación por offset avance.

  // 1) Cache en bloque (solo filas con calle utilizable)
  const utilizables = items.filter(i => i.calle.length > 0)
  const claves = [...new Set(utilizables.map(i => i.clave))]
  const cache = new Map<string, { lat: number | null; lng: number | null; provider: string | null }>()
  for (let i = 0; i < claves.length; i += CHUNK_CACHE) {
    const { data } = await client
      .from('geocode_cache')
      .select('direccion, lat, lng, provider')
      .in('direccion', claves.slice(i, i + CHUNK_CACHE))
    for (const row of data ?? []) cache.set(row.direccion, row)
  }

  const aConsultar: typeof items = []
  for (const item of utilizables) {
    const hit = cache.get(item.clave)
    if (hit && hit.lat != null) {
      // Hit con coordenadas: aplicar directo
      item.lat = hit.lat
      item.lng = hit.lng
      item.origen = 'cache'
    } else if (hit && modo === 'georef') {
      // Miss cacheado: en modo georef no se reintenta (fase 2 = nominatim)
      item.origen = 'cache'
    } else if (hit && hit.provider !== 'georef_miss') {
      // Ya se intentó también Nominatim ('miss' definitivo): no reintentar
      item.origen = 'cache'
    } else {
      aConsultar.push(item)
    }
  }

  // 2) Consultar el proveedor según el modo.
  const cacheNuevo: Array<{ direccion: string; lat: number | null; lng: number | null; provider: string }> = []

  if (modo === 'nominatim') {
    // Fase 2: secuencial a 1 req/1.1s (rate limit de Nominatim)
    for (let i = 0; i < aConsultar.length; i++) {
      const item = aConsultar[i]
      const resultado = await buscarNominatim(item.calle, item.localidad)
      if (resultado) {
        item.lat = resultado.lat
        item.lng = resultado.lng
        item.origen = 'nominatim'
        cacheNuevo.push({ direccion: item.clave, lat: resultado.lat, lng: resultado.lng, provider: 'nominatim' })
      } else {
        // 'miss' = ya se probó georef Y nominatim: definitivo, solo queda manual
        cacheNuevo.push({ direccion: item.clave, lat: null, lng: null, provider: 'miss' })
      }
      if (i < aConsultar.length - 1) await dormir(1100)
    }
  } else {
  // georef bulk para lo que no estaba en cache.
  //    Se consulta por DEPARTAMENTO (no localidad_censal, ver server/utils/geo.ts)
  //    pidiendo hasta 3 candidatos, y se valida por distancia al centroide.
  for (let i = 0; i < aConsultar.length; i += CHUNK_GEOREF) {
    const chunk = aConsultar.slice(i, i + CHUNK_GEOREF)
    try {
      const res: any = await $fetch('https://apis.datos.gob.ar/georef/api/direcciones', {
        method: 'POST',
        timeout: 20_000,
        body: {
          direcciones: chunk.map((item) => {
            const datos = datosLocalidad(item.localidad)
            return {
              direccion: item.calle,
              ...(datos
                ? { departamento: datos.dep, provincia: datos.prov }
                : item.localidad ? { localidad_censal: item.localidad } : {}),
              max: 3,
            }
          }),
        },
      })
      const resultados: any[] = res?.resultados ?? []
      chunk.forEach((item, j) => {
        const datos = datosLocalidad(item.localidad)
        const candidatos: any[] = resultados[j]?.direcciones ?? []
        let mejor: { lat: number; lng: number } | null = null
        let mejorDist = Infinity
        for (const c of candidatos) {
          const u = c?.ubicacion
          if (u?.lat == null || u?.lon == null) continue
          const lat = Number(u.lat)
          const lng = Number(u.lon)
          if (!dentroDeLocalidad(lat, lng, datos)) continue
          const dist = datos
            ? (lat - datos.lat) ** 2 + ((lng - datos.lng) * 0.84) ** 2
            : 0
          if (dist < mejorDist) {
            mejor = { lat, lng }
            mejorDist = dist
          }
        }
        if (mejor) {
          item.lat = mejor.lat
          item.lng = mejor.lng
          item.origen = 'georef'
          cacheNuevo.push({ direccion: item.clave, lat: mejor.lat, lng: mejor.lng, provider: 'georef' })
        } else {
          cacheNuevo.push({ direccion: item.clave, lat: null, lng: null, provider: 'georef_miss' })
        }
      })
    } catch (err) {
      // Chunk falló (timeout/red): no cachear nada, quedan pendientes para reintentar
      console.error('[geocode-lote] georef bulk falló', err)
    }
  }
  }

  // 3) Guardar cache (best-effort, dedupe por clave)
  if (cacheNuevo.length > 0) {
    const unicos = [...new Map(cacheNuevo.map(c => [c.direccion, c])).values()]
    const { error: cacheError } = await client
      .from('geocode_cache')
      .upsert(unicos, { onConflict: 'direccion' })
    if (cacheError) console.error('[geocode-lote] cache upsert falló', cacheError)
  }

  // 4) Actualizar coordenadas (en paralelo controlado)
  const ubicables = items.filter(i => i.lat != null && i.lng != null)
  const ahora = new Date().toISOString()
  let ubicados = 0
  for (let i = 0; i < ubicables.length; i += CHUNK_UPDATE) {
    const resultados = await Promise.all(
      ubicables.slice(i, i + CHUNK_UPDATE).map(item =>
        client
          .from('prospectos')
          .update({ lat: item.lat, lng: item.lng, updated_at: ahora })
          .eq('id', item.id)
          .then(({ error: e }) => !e),
      ),
    )
    ubicados += resultados.filter(Boolean).length
  }

  return {
    procesados: items.length,
    ubicados,
    sin_resultado: items.length - ubicables.length,
  }
})
