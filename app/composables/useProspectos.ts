import type { ProspectoRow } from '~/utils/prospectoUI'

const PAGE_SIZE = 25
const EXPORT_LIMIT = 5000

function escapeIlike(input: string): string {
  return input.replace(/[\\%_,()]/g, c => `\\${c}`)
}

function hoyISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Lista paginada de prospectos con filas completas (solo las accesibles bajo RLS:
// propias / grupo / staff). Comparte el estado de filtros con useProspectosMapa.
export function useProspectos() {
  const client = useSupabaseClient()
  const user = useSupabaseUser()
  const { filtros } = useProspectosMapa()

  const rows = ref<Array<ProspectoRow & { vendedor?: { nombre: string | null } | null }>>([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const exporting = ref(false)

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

  function buildQuery(forCount: boolean) {
    let q = client
      .from('prospectos')
      .select('*, vendedor:vendedor_id(nombre)', forCount ? { count: 'exact' } : {})

    const f = filtros.value
    if (f.estados.length > 0) q = q.in('estado', f.estados)
    if (f.canales.length > 0) q = q.in('canal', f.canales)
    if (f.soloMios && user.value?.id) q = q.eq('vendedor_id', user.value.id)
    if (f.vendedorId) q = q.eq('vendedor_id', f.vendedorId)
    if (f.localidad) q = q.eq('dir_localidad', f.localidad)
    if (f.sinVisitarDias != null) {
      const limite = new Date(Date.now() - f.sinVisitarDias * 86_400_000).toISOString()
      q = q.or(`fecha_ultima_interaccion.is.null,fecha_ultima_interaccion.lt.${limite}`)
    }
    if (f.soloAgendaVencida) {
      q = q.not('proxima_visita', 'is', null).lte('proxima_visita', hoyISO())
    }

    const term = f.busqueda.trim()
    if (term) {
      const safe = escapeIlike(term)
      q = q.or(`nombre.ilike.%${safe}%,telefono.ilike.%${safe}%,dir_calle.ilike.%${safe}%,dir_localidad.ilike.%${safe}%`)
    }

    return q.order('updated_at', { ascending: false })
  }

  async function fetchPage() {
    loading.value = true
    error.value = null
    try {
      const from = (page.value - 1) * PAGE_SIZE
      const { data, error: queryError, count } = await buildQuery(true).range(from, from + PAGE_SIZE - 1)
      if (queryError) throw queryError
      rows.value = (data ?? []) as any[]
      total.value = count ?? 0
    } catch (e: any) {
      error.value = e?.message ?? 'Error cargando prospectos'
      rows.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  async function fetchExport(): Promise<{ rows: any[]; truncated: boolean }> {
    exporting.value = true
    try {
      const { data, error: queryError } = await buildQuery(false).limit(EXPORT_LIMIT)
      if (queryError) throw queryError
      const result = data ?? []
      return { rows: result, truncated: result.length >= EXPORT_LIMIT }
    } finally {
      exporting.value = false
    }
  }

  let initialized = false
  let searchTimer: ReturnType<typeof setTimeout> | null = null

  watch(() => filtros.value.busqueda, () => {
    if (!initialized) return
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      page.value = 1
      fetchPage()
    }, 300)
  })

  watch(
    () => [
      filtros.value.estados.join(','),
      filtros.value.canales.join(','),
      filtros.value.vendedorId,
      filtros.value.localidad,
      filtros.value.sinVisitarDias,
      filtros.value.soloAgendaVencida,
      filtros.value.soloMios,
    ],
    () => {
      if (!initialized) return
      page.value = 1
      fetchPage()
    },
  )

  watch(page, () => {
    if (initialized) fetchPage()
  })

  async function init() {
    await fetchPage()
    initialized = true
  }

  return {
    rows,
    total,
    totalPages,
    page,
    loading,
    error,
    exporting,
    init,
    fetchPage,
    fetchExport,
  }
}
