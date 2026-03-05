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
  fecha_carga: string
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

  // Filtrar solo profiles que cobran comisiones
  const comisionables = profiles.filter(p =>
    ['vendedor', 'oficinista', 'lider'].includes(p.rol),
  )

  for (const perfil of comisionables) {
    // Ventas concretadas propias (ya filtradas por fecha del ciclo)
    const ventasPropias = ventas.filter(v => v.vendedor_id === perfil.id)
    const cantidad = ventasPropias.length
    const montoTotal = ventasPropias.reduce((sum, v) => sum + Number(v.precio), 0)

    // Determinar porcentaje
    let pct: number
    if (perfil.rol === 'oficinista') {
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
        const montoEquipo = ventasEquipo.reduce((sum, v) => sum + Number(v.precio), 0)
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
