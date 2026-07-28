import { mesKeyArgentina } from '~/utils/dates'

// Tipos
export interface CicloComision {
  id: string
  fecha_inicio: string
  fecha_cierre_prevista: string
  fecha_cierre_real: string | null
  estado: 'activo' | 'cerrado'
  created_by: string
  created_at: string
}

export interface CicloPago {
  id: string
  ciclo_id: string
  vendedor_id: string
  rol_snapshot: string
  grupo_id_snapshot: string | null
  cantidad_ventas: number
  monto_total_ventas: number
  porcentaje_aplicado: number
  monto_comision: number
  monto_liderazgo: number
  monto_total: number
  pagado: boolean
  fecha_pago: string | null
  pagado_por: string | null
  created_at: string
  profiles?: { nombre: string; rol: string }
}

export interface EstimacionVendedor {
  vendedor_id: string
  nombre: string
  rol: string
  grupo_id: string | null
  cantidad_ventas: number
  monto_total_ventas: number
  porcentaje_aplicado: number
  monto_comision: number
  monto_liderazgo: number
  monto_total: number
}

interface VentaConcretada {
  id: string
  vendedor_id: string
  precio: number
  precio_concretado: number | null
  fecha_concretado: string
}

interface ProfileBasico {
  id: string
  nombre: string
  rol: string
  grupo_id: string | null
}

interface GrupoBasico {
  id: string
  lider_id: string
}

interface ConfigComisiones {
  pct_grupo: number
  pct_lider: number
}

/**
 * Calcula las estimaciones de comisiones en tiempo real
 * a partir de las ventas concretadas dentro de un ciclo activo.
 */
export function calcularEstimaciones(
  ventas: VentaConcretada[],
  profiles: ProfileBasico[],
  grupos: GrupoBasico[],
  config: ConfigComisiones,
): EstimacionVendedor[] {
  const estimaciones: EstimacionVendedor[] = []

  // Filtrar solo profiles que cobran comisiones (admin incluido: si vende, cobra)
  const comisionables = profiles.filter(p =>
    ['vendedor', 'oficinista', 'lider', 'admin'].includes(p.rol),
  )

  for (const perfil of comisionables) {
    // Ventas concretadas propias (ya filtradas por fecha del ciclo)
    const ventasPropias = ventas.filter(v => v.vendedor_id === perfil.id)
    const cantidad = ventasPropias.length
    const montoTotal = ventasPropias.reduce((sum, v) => sum + Number(v.precio_concretado ?? v.precio), 0)

    // Un admin sin ventas en el período no genera fila (igual que admin_cerrar_ciclo)
    if (perfil.rol === 'admin' && cantidad === 0) continue

    // Determinar porcentaje
    let pct: number
    if (perfil.rol === 'oficinista' || perfil.rol === 'admin') {
      pct = 100
    } else if (perfil.rol === 'vendedor' && !perfil.grupo_id) {
      pct = 100
    } else {
      // Vendedor con grupo o líder
      pct = config.pct_grupo
    }

    const comision = Math.round(montoTotal * pct) / 100

    // Calcular bonus de liderazgo si es líder
    let liderazgo = 0
    if (perfil.rol === 'lider') {
      const grupo = grupos.find(g => g.lider_id === perfil.id)
      if (grupo) {
        // Vendedores del grupo
        const miembrosIds = profiles
          .filter(p => p.grupo_id === grupo.id && p.rol === 'vendedor')
          .map(p => p.id)
        const ventasEquipo = ventas.filter(v => miembrosIds.includes(v.vendedor_id))
        const montoEquipo = ventasEquipo.reduce((sum, v) => sum + Number(v.precio_concretado ?? v.precio), 0)
        liderazgo = Math.round(montoEquipo * config.pct_lider) / 100
      }
    }

    estimaciones.push({
      vendedor_id: perfil.id,
      nombre: perfil.nombre,
      rol: perfil.rol,
      grupo_id: perfil.grupo_id,
      cantidad_ventas: cantidad,
      monto_total_ventas: montoTotal,
      porcentaje_aplicado: pct,
      monto_comision: comision,
      monto_liderazgo: liderazgo,
      monto_total: comision + liderazgo,
    })
  }

  // Ordenar por monto total descendente
  return estimaciones.sort((a, b) => b.monto_total - a.monto_total)
}

// ——— Generado por mes (todas las empresas) ———

interface VentaConEmpresa extends VentaConcretada {
  empresa: string
}

export interface GeneradoVendedorMes {
  vendedor_id: string
  nombre: string
  rol: string
  cantidad_ventas: number
  monto_total_ventas: number
  monto_comision: number // comisión + bonus liderazgo, sumado entre empresas
}

export interface MesGenerado {
  key: string // 'YYYY-MM'
  label: string // ej. 'junio 2026'
  cantidad_ventas: number
  monto_total_ventas: number
  monto_comision: number
  vendedores: GeneradoVendedorMes[]
}

const CONFIG_DEFAULT: ConfigComisiones = { pct_grupo: 80, pct_lider: 25 }

/**
 * Agrupa las ventas concretadas por mes calendario y, dentro de cada mes,
 * calcula lo generado por cada vendedor sumando todas las empresas.
 *
 * La comisión se calcula por (mes × empresa) reutilizando `calcularEstimaciones`,
 * para respetar el porcentaje propio de cada empresa, y luego se fusiona por vendedor.
 */
export function calcularGeneradoPorMes(
  ventas: VentaConEmpresa[],
  profiles: ProfileBasico[],
  grupos: GrupoBasico[],
  configPorEmpresa: Record<string, ConfigComisiones>,
): MesGenerado[] {
  // 1. Agrupar ventas por mes calendario (clave 'YYYY-MM')
  const porMes = new Map<string, VentaConEmpresa[]>()
  for (const venta of ventas) {
    if (!venta.fecha_concretado) continue
    const key = mesKeyArgentina(venta.fecha_concretado)
    if (!key) continue
    const lista = porMes.get(key)
    if (lista) lista.push(venta)
    else porMes.set(key, [venta])
  }

  const meses: MesGenerado[] = []

  for (const [key, ventasMes] of porMes) {
    // 2. Dentro del mes, agrupar por empresa y estimar con su config propia
    const porEmpresa = new Map<string, VentaConEmpresa[]>()
    for (const venta of ventasMes) {
      const lista = porEmpresa.get(venta.empresa)
      if (lista) lista.push(venta)
      else porEmpresa.set(venta.empresa, [venta])
    }

    // 3. Fusionar estimaciones por vendedor a través de las empresas
    const merge = new Map<string, GeneradoVendedorMes>()
    for (const [empresa, ventasEmpresa] of porEmpresa) {
      const config = configPorEmpresa[empresa] ?? CONFIG_DEFAULT
      const estimaciones = calcularEstimaciones(ventasEmpresa, profiles, grupos, config)
      for (const e of estimaciones) {
        const acc = merge.get(e.vendedor_id)
        if (acc) {
          acc.cantidad_ventas += e.cantidad_ventas
          acc.monto_total_ventas += e.monto_total_ventas
          acc.monto_comision += e.monto_total
        } else {
          merge.set(e.vendedor_id, {
            vendedor_id: e.vendedor_id,
            nombre: e.nombre,
            rol: e.rol,
            cantidad_ventas: e.cantidad_ventas,
            monto_total_ventas: e.monto_total_ventas,
            monto_comision: e.monto_total,
          })
        }
      }
    }

    // 4. Solo quienes generaron algo (ventas propias o comisión por liderazgo),
    //    ordenados por comisión desc (igual que la estimación por ciclo).
    const vendedores = Array.from(merge.values())
      .filter(v => v.cantidad_ventas > 0 || v.monto_comision > 0)
      .sort((a, b) => b.monto_comision - a.monto_comision)

    // 5. Totales del mes
    const [anio, mes] = key.split('-').map(Number)
    const labelMes = new Date(anio, mes - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    meses.push({
      key,
      label: labelMes.charAt(0).toUpperCase() + labelMes.slice(1),
      cantidad_ventas: vendedores.reduce((s, v) => s + v.cantidad_ventas, 0),
      monto_total_ventas: vendedores.reduce((s, v) => s + v.monto_total_ventas, 0),
      monto_comision: vendedores.reduce((s, v) => s + v.monto_comision, 0),
      vendedores,
    })
  }

  // 6. Meses más recientes primero
  return meses.sort((a, b) => b.key.localeCompare(a.key))
}
