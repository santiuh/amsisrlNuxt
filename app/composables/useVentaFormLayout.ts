export type VentaFormLayout = 'comoda' | 'compacta'

const STORAGE_KEY = 'venta-form-layout'
let hydrated = false

/**
 * Modo de layout del formulario de venta (escritorio):
 * - 'compacta': secciones en varias columnas usando todo el ancho (default).
 * - 'comoda': una sola columna (la versión clásica).
 *
 * Estado compartido (useState) + persistencia en localStorage por dispositivo.
 * La app es ssr:false, así que la hidratación corre en cliente.
 */
export const useVentaFormLayout = () => {
  const mode = useState<VentaFormLayout>('venta-form-layout', () => 'compacta')

  if (import.meta.client && !hydrated) {
    hydrated = true
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'comoda' || saved === 'compacta') {
      mode.value = saved
    }
    watch(mode, (value) => {
      localStorage.setItem(STORAGE_KEY, value)
    })
  }

  return mode
}
