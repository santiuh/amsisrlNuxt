import type { VentaFilterState } from '~/components/VentaFilters.vue'

export interface VentasSortState {
  column: string
  direction: 'asc' | 'desc'
}

const PAGE_SIZE_DEFAULT = 25
const EXPORT_LIMIT = 10000

const SORT_COLUMN_MAP: Record<string, string> = {
  fecha_carga: 'fecha_carga',
  estado: 'estado',
  empresa: 'empresa',
  cliente: 'cliente',
  dni_cuil: 'dni_cuil',
  telefono: 'telefono',
  localidad: 'dir_localidad',
  paquete: 'paquete_nombre',
  precio: 'precio',
  fecha_coordinacion: 'fecha_coordinacion',
  fecha_concretado: 'fecha_concretado',
  vendedor: 'vendedor_id',
}

function escapeIlike(input: string): string {
  return input.replace(/[\\%_,()]/g, (c) => `\\${c}`)
}

function endOfDayIso(yyyyMmDd: string): string {
  return `${yyyyMmDd}T23:59:59.999`
}

export function useVentasList() {
  const client = useSupabaseClient()

  const filters = reactive<VentaFilterState>({
    search: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
    fechaConcretadoDesde: '',
    fechaConcretadoHasta: '',
    vendedor: '',
    localidad: '',
    empresa: '',
  })

  const page = ref(1)
  const pageSize = ref(PAGE_SIZE_DEFAULT)
  const sort = ref<VentasSortState>({ column: 'fecha_carga', direction: 'desc' })

  const ventas = ref<any[]>([])
  const lecturas = ref<Record<string, string>>({})
  const total = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const exporting = ref(false)

  const totalPages = computed(() =>
    pageSize.value > 0 ? Math.max(1, Math.ceil(total.value / pageSize.value)) : 1,
  )

  function buildQuery(forCount: boolean) {
    let q = client
      .from('ventas')
      .select(
        '*, profiles:vendedor_id(nombre, avatar_config)',
        forCount ? { count: 'exact' } : {},
      )

    if (filters.estado) q = q.eq('estado', filters.estado)
    if (filters.empresa) q = q.eq('empresa', filters.empresa)
    if (filters.vendedor) q = q.eq('vendedor_id', filters.vendedor)
    if (filters.localidad) q = q.eq('dir_localidad', filters.localidad)
    if (filters.fechaDesde) q = q.gte('fecha_carga', filters.fechaDesde)
    if (filters.fechaHasta) q = q.lte('fecha_carga', endOfDayIso(filters.fechaHasta))
    if (filters.fechaConcretadoDesde) q = q.gte('fecha_concretado', filters.fechaConcretadoDesde)
    if (filters.fechaConcretadoHasta) q = q.lte('fecha_concretado', endOfDayIso(filters.fechaConcretadoHasta))

    const term = filters.search.trim()
    if (term) {
      const safe = escapeIlike(term)
      q = q.or(`cliente.ilike.%${safe}%,dni_cuil.ilike.%${safe}%`)
    }

    const sortCol = SORT_COLUMN_MAP[sort.value.column] ?? 'fecha_carga'
    q = q.order(sortCol, { ascending: sort.value.direction === 'asc' })
    if (sortCol !== 'fecha_carga') {
      q = q.order('fecha_carga', { ascending: false })
    }

    return q
  }

  async function fetchPage() {
    loading.value = true
    error.value = null
    try {
      const from = (page.value - 1) * pageSize.value
      const to = from + pageSize.value - 1

      const { data, error: queryError, count } = await buildQuery(true).range(from, to)

      if (queryError) throw queryError

      ventas.value = data ?? []
      total.value = count ?? 0

      const ids = ventas.value.map((v) => v.id).filter(Boolean)
      if (ids.length === 0) {
        lecturas.value = {}
      } else {
        const { data: lecturasData } = await client
          .from('venta_lecturas')
          .select('venta_id, ultima_lectura')
          .in('venta_id', ids)
        lecturas.value = Object.fromEntries(
          (lecturasData ?? []).map((l: any) => [l.venta_id, l.ultima_lectura]),
        )
      }
    } catch (e: any) {
      error.value = e?.message ?? 'Error cargando ventas'
      ventas.value = []
      total.value = 0
      lecturas.value = {}
    } finally {
      loading.value = false
    }
  }

  async function fetchExport(): Promise<{ rows: any[]; truncated: boolean }> {
    exporting.value = true
    try {
      const { data, error: queryError } = await buildQuery(false).limit(EXPORT_LIMIT)
      if (queryError) throw queryError
      const rows = data ?? []
      return { rows, truncated: rows.length >= EXPORT_LIMIT }
    } finally {
      exporting.value = false
    }
  }

  let initialized = false
  let searchTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => filters.search,
    () => {
      if (!initialized) return
      if (searchTimer) clearTimeout(searchTimer)
      searchTimer = setTimeout(() => {
        page.value = 1
        fetchPage()
      }, 300)
    },
  )

  watch(
    () => [
      filters.estado,
      filters.empresa,
      filters.vendedor,
      filters.localidad,
      filters.fechaDesde,
      filters.fechaHasta,
      filters.fechaConcretadoDesde,
      filters.fechaConcretadoHasta,
    ],
    () => {
      if (!initialized) return
      page.value = 1
      fetchPage()
    },
  )

  watch(
    () => [sort.value.column, sort.value.direction, pageSize.value],
    () => {
      if (!initialized) return
      page.value = 1
      fetchPage()
    },
  )

  watch(page, () => {
    if (!initialized) return
    fetchPage()
  })

  async function init() {
    await fetchPage()
    initialized = true
  }

  return {
    filters,
    page,
    pageSize,
    sort,
    ventas,
    lecturas,
    total,
    totalPages,
    loading,
    error,
    exporting,
    init,
    fetchPage,
    fetchExport,
    EXPORT_LIMIT,
  }
}
