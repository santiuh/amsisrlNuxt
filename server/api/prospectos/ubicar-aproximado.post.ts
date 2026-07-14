import { serverSupabaseClient } from '#supabase/server'

// Coloca los prospectos sin ubicar (accesibles bajo RLS) en el CENTRO de su
// localidad, marcados como ubicacion_aproximada=true. Útil para calles que no
// existen en los mapas (pueblos chicos). El vendedor ajusta la posición exacta
// después. Un jitter chico los dispersa para que no se apilen en un solo punto.
export default defineEventHandler(async (event) => {
  await requireProfile(event)
  const client = await serverSupabaseClient(event)

  // Sin ubicar y con localidad conocida (accesibles bajo RLS)
  const { data: pendientes, error } = await client
    .from('prospectos')
    .select('id, dir_localidad')
    .is('lat', null)
    .not('dir_localidad', 'is', null)
    .limit(5000)

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }
  if (!pendientes || pendientes.length === 0) {
    return { ubicados: 0, sin_localidad_conocida: 0 }
  }

  const ahora = new Date().toISOString()
  let ubicados = 0
  let sinLocalidad = 0

  // Radio de dispersión ~±700 m alrededor del centro del pueblo
  const JITTER = 0.006

  const updates = pendientes
    .map((p) => {
      const datos = datosLocalidad(normalizarLocalidad(p.dir_localidad))
      if (!datos) {
        sinLocalidad++
        return null
      }
      const lat = datos.lat + (Math.random() - 0.5) * 2 * JITTER
      const lng = datos.lng + (Math.random() - 0.5) * 2 * JITTER
      return { id: p.id, lat, lng }
    })
    .filter((u): u is { id: string; lat: number; lng: number } => u !== null)

  // Actualizar en tandas paralelas controladas
  const CHUNK = 25
  for (let i = 0; i < updates.length; i += CHUNK) {
    const tanda = updates.slice(i, i + CHUNK)
    const resultados = await Promise.all(
      tanda.map(u =>
        client
          .from('prospectos')
          .update({ lat: u.lat, lng: u.lng, ubicacion_aproximada: true, updated_at: ahora })
          .eq('id', u.id)
          .then(({ error: e }) => !e),
      ),
    )
    ubicados += resultados.filter(Boolean).length
  }

  return { ubicados, sin_localidad_conocida: sinLocalidad }
})
