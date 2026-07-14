import type { ProspectoPin } from '~/utils/prospectoUI'

export interface FiltrosMapa {
  estados: string[]        // vacío = todos
  vendedorId: string       // '' = todos
  localidad: string        // '' = todas
  sinVisitarDias: number | null
  soloAgendaVencida: boolean
  soloMios: boolean
  // Solo aplican a la vista lista (la capa del mapa no expone canal ni datos de contacto)
  canales: string[]
  busqueda: string
}

const FILTROS_INICIALES: FiltrosMapa = {
  estados: [],
  vendedorId: '',
  localidad: '',
  sinVisitarDias: null,
  soloAgendaVencida: false,
  soloMios: false,
  canales: [],
  busqueda: '',
}

// Capa del mapa: pines de TODOS los prospectos con coordenadas, vía RPC
// prospectos_mapa() (solo columnas seguras + flag acceso_completo).
// Se cachea en useState para no recargar en cada navegación.
export function useProspectosMapa() {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  const pins = useState<ProspectoPin[]>('prospectos-mapa-pins', () => [])
  const cargado = useState<boolean>('prospectos-mapa-cargado', () => false)
  const cargando = useState<boolean>('prospectos-mapa-cargando', () => false)
  const error = useState<string | null>('prospectos-mapa-error', () => null)
  const filtros = useState<FiltrosMapa>('prospectos-mapa-filtros', () => ({ ...FILTROS_INICIALES }))

  const cargar = async (force = false) => {
    if (cargado.value && !force) return
    if (cargando.value) return
    cargando.value = true
    error.value = null
    // PostgREST corta las RPC en 1000 filas por defecto: paginamos con .range()
    // hasta traer todos los prospectos con coordenadas.
    const PAGE = 1000
    const todos: ProspectoPin[] = []
    let desde = 0
    try {
      while (true) {
        const { data, error: err } = await client
          .rpc('prospectos_mapa')
          .order('id', { ascending: true })
          .range(desde, desde + PAGE - 1)
        if (err) throw err
        const lote = (data ?? []) as ProspectoPin[]
        todos.push(...lote)
        if (lote.length < PAGE) break
        desde += PAGE
      }
      pins.value = todos
      cargado.value = true
    } catch (err: any) {
      error.value = err?.message ?? 'Error al cargar el mapa'
    } finally {
      cargando.value = false
    }
  }

  const hoyISO = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // Filtros excepto estado (los contadores por estado se calculan sobre esto)
  const pasaFiltrosBase = (p: ProspectoPin): boolean => {
    const f = filtros.value
    if (f.soloMios && p.vendedor_id !== user.value?.id) return false
    if (f.vendedorId && p.vendedor_id !== f.vendedorId) return false
    if (f.localidad && (p.localidad ?? '') !== f.localidad) return false
    if (f.sinVisitarDias != null) {
      // "sin visitar hace X días": nunca visitado también cuenta
      const limite = Date.now() - f.sinVisitarDias * 86_400_000
      if (p.fecha_ultima_interaccion && new Date(p.fecha_ultima_interaccion).getTime() > limite) return false
    }
    if (f.soloAgendaVencida) {
      if (!p.proxima_visita || p.proxima_visita > hoyISO()) return false
    }
    return true
  }

  const pinsFiltrados = computed(() =>
    pins.value.filter(p =>
      pasaFiltrosBase(p)
      && (filtros.value.estados.length === 0 || filtros.value.estados.includes(p.estado)),
    ),
  )

  const contadores = computed(() => {
    const c: Record<string, number> = {}
    for (const p of pins.value) {
      if (pasaFiltrosBase(p)) c[p.estado] = (c[p.estado] ?? 0) + 1
    }
    return c
  })

  const localidades = computed(() =>
    [...new Set(pins.value.map(p => p.localidad).filter((l): l is string => !!l))].sort(),
  )

  const vendedores = computed(() => {
    const m = new Map<string, string>()
    for (const p of pins.value) {
      if (p.vendedor_id && !m.has(p.vendedor_id)) m.set(p.vendedor_id, p.vendedor_nombre ?? '—')
    }
    return [...m.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  })

  const hayFiltrosActivos = computed(() => {
    const f = filtros.value
    return f.estados.length > 0 || !!f.vendedorId || !!f.localidad
      || f.sinVisitarDias != null || f.soloAgendaVencida || f.soloMios
      || f.canales.length > 0 || !!f.busqueda.trim()
  })

  const limpiarFiltros = () => {
    filtros.value = { ...FILTROS_INICIALES }
  }

  return {
    pins,
    pinsFiltrados,
    contadores,
    localidades,
    vendedores,
    filtros,
    cargando,
    error,
    cargar,
    hayFiltrosActivos,
    limpiarFiltros,
  }
}
