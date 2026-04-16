import type { AvatarConfig } from '~/utils/avatar'

export type ActivityPreset = 'hoy' | '7dias' | '30dias' | 'ciclo' | 'custom'

export interface ActivityEvent {
  id: string
  oficinista_id: string | null
  venta_id: string | null
  action_type: 'estado_change' | 'coordinacion_set' | 'nro_cliente_set' | 'comentario'
  from_estado: string | null
  to_estado: string | null
  fecha_coordinacion_set: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface OficinistaRef {
  id: string
  nombre: string
  rol: 'oficinista' | 'admin'
  avatar_config: AvatarConfig | null
}

export interface OficinistaSummary {
  id: string | null
  nombre: string
  rol: 'oficinista' | 'admin' | 'eliminado'
  avatar_config: AvatarConfig | null
  acciones: number
  turnosCoordinados: number
  ventasConcretadas: number
  cargaActual: number
  ultimaActividad: string | null
}

export interface VentaContext {
  cliente: string
  dir_localidad: string | null
  paquete_nombre: string
  estado: string
  empresa: string
}

export interface FeedItem {
  id: string
  created_at: string
  oficinistaNombre: string
  oficinistaAvatar: AvatarConfig | null
  action_type: ActivityEvent['action_type']
  from_estado: string | null
  to_estado: string | null
  fecha_coordinacion_set: string | null
  metadata: Record<string, any>
  venta: VentaContext | null
}

export interface DaySession {
  oficinistaId: string
  nombre: string
  avatar_config: AvatarConfig | null
  date: string // YYYY-MM-DD
  firstAction: string // ISO
  lastAction: string // ISO
  actionCount: number
  durationMinutes: number
}

export interface TodayStat {
  id: string
  acciones: number
  firstAction: string | null
  lastAction: string | null
}

const OFICINISTA_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6']

export function useOficinistaActivity() {
  const client = useSupabaseClient()

  const preset = ref<ActivityPreset>('7dias')
  const customFrom = ref<string>('') // YYYY-MM-DD
  const customTo = ref<string>('')
  const oficinistaId = ref<string | null>(null)

  const events = ref<ActivityEvent[]>([])
  const oficinistas = ref<OficinistaRef[]>([])
  const ventasAbiertas = ref<Array<{ id: string; estado: string }>>([])
  const ventasContext = ref<Record<string, VentaContext>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  const startOfDay = (d: Date) => {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x
  }
  const endOfDay = (d: Date) => {
    const x = new Date(d)
    x.setHours(23, 59, 59, 999)
    return x
  }

  const presetToRange = async (p: ActivityPreset): Promise<{ from: string; to: string }> => {
    const now = new Date()
    const to = endOfDay(now).toISOString()
    if (p === 'hoy') {
      return { from: startOfDay(now).toISOString(), to }
    }
    if (p === '7dias') {
      const from = new Date(now)
      from.setDate(from.getDate() - 6)
      return { from: startOfDay(from).toISOString(), to }
    }
    if (p === '30dias') {
      const from = new Date(now)
      from.setDate(from.getDate() - 29)
      return { from: startOfDay(from).toISOString(), to }
    }
    if (p === 'ciclo') {
      // Ciclo activo más antiguo de cualquier empresa
      const { data } = await client
        .from('ciclos_comision')
        .select('fecha_inicio')
        .eq('estado', 'activo')
        .order('fecha_inicio', { ascending: true })
        .limit(1)
      const ciclo = data?.[0]
      if (ciclo?.fecha_inicio) {
        return { from: new Date(ciclo.fecha_inicio).toISOString(), to }
      }
      // Fallback: últimos 30 días
      const from = new Date(now)
      from.setDate(from.getDate() - 29)
      return { from: startOfDay(from).toISOString(), to }
    }
    // custom
    const f = customFrom.value ? new Date(`${customFrom.value}T00:00:00`) : startOfDay(now)
    const t = customTo.value ? new Date(`${customTo.value}T23:59:59.999`) : endOfDay(now)
    return { from: f.toISOString(), to: t.toISOString() }
  }

  const fetchData = async () => {
    loading.value = true
    error.value = null
    try {
      const { from, to } = await presetToRange(preset.value)
      const query: Record<string, string> = { from, to }
      if (oficinistaId.value) query.oficinista_id = oficinistaId.value
      const res = await $fetch<{
        events: ActivityEvent[]
        oficinistas: OficinistaRef[]
        ventasAbiertas: Array<{ id: string; estado: string }>
        ventasContext: Record<string, VentaContext>
      }>('/api/dashboard/oficinista-activity', { query })
      events.value = res.events
      oficinistas.value = res.oficinistas
      ventasAbiertas.value = res.ventasAbiertas
      ventasContext.value = res.ventasContext ?? {}
    } catch (err: any) {
      error.value = err?.data?.statusMessage ?? err?.message ?? 'Error al cargar actividad'
      events.value = []
    } finally {
      loading.value = false
    }
  }

  // Refetch en cambios
  watch([preset, customFrom, customTo, oficinistaId], () => {
    // En custom, solo refetch si ambas fechas están completas
    if (preset.value === 'custom' && (!customFrom.value || !customTo.value)) return
    fetchData()
  }, { immediate: false })

  // ─── Derivados ────────────────────────────────────────────────────────

  /**
   * Resumen por oficinista en el rango cargado.
   * Incluye oficinistas con 0 actividad para que admin vea quién no trabajó.
   * Si hay eventos con oficinista_id null (perfil eliminado), se agrupan bajo una fila virtual.
   */
  const summary = computed<OficinistaSummary[]>(() => {
    // Último evento por venta → para calcular cargaActual
    const latestByVenta = new Map<string, ActivityEvent>()
    for (const ev of events.value) {
      if (!ev.venta_id) continue
      const prev = latestByVenta.get(ev.venta_id)
      if (!prev || new Date(ev.created_at) > new Date(prev.created_at)) {
        latestByVenta.set(ev.venta_id, ev)
      }
    }
    const ventasAbiertasIds = new Set(ventasAbiertas.value.map(v => v.id))

    const map = new Map<string, OficinistaSummary>()
    // Seed con todo el personal (oficinistas + admins)
    for (const o of oficinistas.value) {
      map.set(o.id, {
        id: o.id,
        nombre: o.nombre,
        rol: o.rol,
        avatar_config: o.avatar_config,
        acciones: 0,
        turnosCoordinados: 0,
        ventasConcretadas: 0,
        cargaActual: 0,
        ultimaActividad: null,
      })
    }
    // Acumular eventos
    for (const ev of events.value) {
      const key = ev.oficinista_id ?? '__deleted__'
      let row = map.get(key)
      if (!row) {
        row = {
          id: ev.oficinista_id,
          nombre: 'Usuario eliminado',
          rol: 'eliminado',
          avatar_config: null,
          acciones: 0,
          turnosCoordinados: 0,
          ventasConcretadas: 0,
          cargaActual: 0,
          ultimaActividad: null,
        }
        map.set(key, row)
      }
      row.acciones++
      if (
        (ev.action_type === 'estado_change' && ev.to_estado === 'coordinado') ||
        ev.action_type === 'coordinacion_set'
      ) {
        row.turnosCoordinados++
      }
      if (ev.action_type === 'estado_change' && ev.to_estado === 'concretado') {
        row.ventasConcretadas++
      }
      if (!row.ultimaActividad || new Date(ev.created_at) > new Date(row.ultimaActividad)) {
        row.ultimaActividad = ev.created_at
      }
    }
    // Carga actual: ventas abiertas cuyo último evento es de esa oficinista
    for (const [ventaId, latestEv] of latestByVenta) {
      if (!ventasAbiertasIds.has(ventaId)) continue
      const key = latestEv.oficinista_id ?? '__deleted__'
      const row = map.get(key)
      if (row) row.cargaActual++
    }
    return Array.from(map.values()).sort((a, b) => b.acciones - a.acciones)
  })

  /**
   * Heatmap 7×24 (día de semana × hora del día) contando eventos.
   * Si se pasa un oficinistaId, filtra por ella; si no, suma todas.
   */
  const heatmap = (filterId: string | null) => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
    for (const ev of events.value) {
      if (filterId && ev.oficinista_id !== filterId) continue
      const d = new Date(ev.created_at)
      grid[d.getDay()][d.getHours()]++
    }
    let max = 0
    for (const row of grid) for (const n of row) if (n > max) max = n
    return { grid, max }
  }

  /**
   * Timeline bar chart: un dataset por oficinista, labels = días en el rango.
   */
  const timeline = computed(() => {
    if (events.value.length === 0) return { labels: [] as string[], datasets: [] as any[] }

    // Determinar rango de fechas (min y max de los eventos)
    let minDate: Date | null = null
    let maxDate: Date | null = null
    for (const ev of events.value) {
      const d = new Date(ev.created_at)
      if (!minDate || d < minDate) minDate = d
      if (!maxDate || d > maxDate) maxDate = d
    }
    if (!minDate || !maxDate) return { labels: [] as string[], datasets: [] as any[] }

    // Generar todos los días del rango en orden
    const labels: string[] = []
    const dayKeys: string[] = []
    const cursor = new Date(minDate)
    cursor.setHours(0, 0, 0, 0)
    const end = new Date(maxDate)
    end.setHours(0, 0, 0, 0)
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
      dayKeys.push(key)
      labels.push(cursor.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }))
      cursor.setDate(cursor.getDate() + 1)
    }

    // Agrupar eventos por (oficinista_id, dia)
    const byOficinistaByDay = new Map<string, Map<string, number>>()
    for (const ev of events.value) {
      const key = ev.oficinista_id ?? '__deleted__'
      if (!byOficinistaByDay.has(key)) byOficinistaByDay.set(key, new Map())
      const d = new Date(ev.created_at)
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const inner = byOficinistaByDay.get(key)!
      inner.set(dayKey, (inner.get(dayKey) ?? 0) + 1)
    }

    // Construir datasets
    const datasets: any[] = []
    let colorIdx = 0
    for (const [key, perDay] of byOficinistaByDay) {
      const perfil = key === '__deleted__' ? null : oficinistas.value.find(o => o.id === key)
      const nombre = perfil?.nombre ?? 'Oficinista eliminada'
      const color = OFICINISTA_COLORS[colorIdx % OFICINISTA_COLORS.length]
      colorIdx++
      datasets.push({
        label: nombre,
        data: dayKeys.map(k => perDay.get(k) ?? 0),
        backgroundColor: color,
      })
    }
    return { labels, datasets }
  })

  const inicioHistorial = computed<string | null>(() => {
    if (events.value.length === 0) return null
    let min = events.value[0].created_at
    for (const ev of events.value) if (ev.created_at < min) min = ev.created_at
    return min
  })

  /**
   * Feed de actividad enriquecido con nombre de oficinista y contexto de venta.
   * Ordenado por created_at desc (ya viene así del API).
   */
  const activityFeed = computed<FeedItem[]>(() => {
    const ofiMap = new Map(oficinistas.value.map(o => [o.id, o]))
    return events.value.map(ev => {
      const ofi = ev.oficinista_id ? ofiMap.get(ev.oficinista_id) : null
      return {
        id: ev.id,
        created_at: ev.created_at,
        oficinistaNombre: ofi?.nombre ?? 'Usuario eliminado',
        oficinistaAvatar: ofi?.avatar_config ?? null,
        action_type: ev.action_type,
        from_estado: ev.from_estado,
        to_estado: ev.to_estado,
        fecha_coordinacion_set: ev.fecha_coordinacion_set,
        metadata: ev.metadata,
        venta: ev.venta_id ? (ventasContext.value[ev.venta_id] ?? null) : null,
      }
    })
  })

  /**
   * Sesiones de trabajo: para cada oficinista y cada día, primera/última acción y duración.
   * Incluye oficinistas con 0 acciones en cada día para visibilidad de inactividad.
   */
  const workingSessions = computed<DaySession[]>(() => {
    if (events.value.length === 0) return []

    // Obtener todos los días del rango a partir de los eventos
    const daySet = new Set<string>()
    for (const ev of events.value) {
      const d = new Date(ev.created_at)
      daySet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
    const days = [...daySet].sort().reverse() // más reciente primero

    // Agrupar eventos por (oficinista_id, día)
    const grouped = new Map<string, { first: Date; last: Date; count: number }>()
    for (const ev of events.value) {
      if (!ev.oficinista_id) continue
      const d = new Date(ev.created_at)
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const key = `${ev.oficinista_id}|${dayKey}`
      const existing = grouped.get(key)
      if (!existing) {
        grouped.set(key, { first: d, last: d, count: 1 })
      } else {
        if (d < existing.first) existing.first = d
        if (d > existing.last) existing.last = d
        existing.count++
      }
    }

    const result: DaySession[] = []
    for (const day of days) {
      for (const ofi of oficinistas.value) {
        const key = `${ofi.id}|${day}`
        const data = grouped.get(key)
        result.push({
          oficinistaId: ofi.id,
          nombre: ofi.nombre,
          avatar_config: ofi.avatar_config,
          date: day,
          firstAction: data ? data.first.toISOString() : '',
          lastAction: data ? data.last.toISOString() : '',
          actionCount: data?.count ?? 0,
          durationMinutes: data ? Math.round((data.last.getTime() - data.first.getTime()) / 60000) : 0,
        })
      }
    }
    return result
  })

  /**
   * Estadísticas del día de hoy por oficinista (para columnas extra en la tabla resumen).
   */
  const todayStats = computed<Map<string, TodayStat>>(() => {
    const now = new Date()
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const map = new Map<string, TodayStat>()

    for (const ofi of oficinistas.value) {
      map.set(ofi.id, { id: ofi.id, acciones: 0, firstAction: null, lastAction: null })
    }

    for (const ev of events.value) {
      if (!ev.oficinista_id) continue
      const d = new Date(ev.created_at)
      const evDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (evDay !== todayKey) continue

      let stat = map.get(ev.oficinista_id)
      if (!stat) {
        stat = { id: ev.oficinista_id, acciones: 0, firstAction: null, lastAction: null }
        map.set(ev.oficinista_id, stat)
      }
      stat.acciones++
      if (!stat.firstAction || ev.created_at < stat.firstAction) stat.firstAction = ev.created_at
      if (!stat.lastAction || ev.created_at > stat.lastAction) stat.lastAction = ev.created_at
    }
    return map
  })

  return {
    // state
    preset,
    customFrom,
    customTo,
    oficinistaId,
    events,
    oficinistas,
    loading,
    error,
    // actions
    fetchData,
    // derived
    summary,
    heatmap,
    timeline,
    inicioHistorial,
    activityFeed,
    workingSessions,
    todayStats,
  }
}
