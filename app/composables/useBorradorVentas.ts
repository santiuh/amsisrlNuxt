interface BorradorVenta {
  id: string
  data: Record<string, any>
  creado: string
  actualizado: string
}

const STORAGE_KEY = 'ventas-borradores'

export function useBorradorVentas() {
  const borradores = ref<BorradorVenta[]>([])

  const cargar = () => {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      borradores.value = raw ? JSON.parse(raw) : []
    } catch {
      borradores.value = []
    }
  }

  const persistir = () => {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(borradores.value))
  }

  const guardar = (data: Record<string, any>, id?: string): string => {
    cargar()
    const ahora = new Date().toISOString()

    if (id) {
      const idx = borradores.value.findIndex(b => b.id === id)
      if (idx !== -1) {
        borradores.value[idx]!.data = { ...data }
        borradores.value[idx]!.actualizado = ahora
        persistir()
        return id
      }
    }

    const nuevoId = crypto.randomUUID()
    borradores.value.unshift({
      id: nuevoId,
      data: { ...data },
      creado: ahora,
      actualizado: ahora,
    })
    persistir()
    return nuevoId
  }

  const obtener = (id: string): BorradorVenta | undefined => {
    cargar()
    return borradores.value.find(b => b.id === id)
  }

  const eliminar = (id: string) => {
    cargar()
    borradores.value = borradores.value.filter(b => b.id !== id)
    persistir()
  }

  const cantidad = computed(() => borradores.value.length)

  // Cargar al inicializar
  cargar()

  return {
    borradores: readonly(borradores),
    cantidad,
    guardar,
    obtener,
    eliminar,
    cargar,
  }
}
