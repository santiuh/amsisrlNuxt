export const normalizePhone = (value: unknown) => {
  const raw = typeof value === 'string' ? value : ''
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('549') ? digits : `549${digits}`
}

export const buildVentaWhatsappMessage = (venta: { cliente?: string | null, paquete_nombre?: string | null, empresa?: string | null }) => {
  const nombre = venta?.cliente || '¿cómo estás?'
  const empresaNombre = venta?.empresa === 'ultra' ? 'Ultra' : 'Express'
  const paquete = venta?.paquete_nombre
    ? ` También te confirmo que el servicio solicitado es ${venta.paquete_nombre}.`
    : ''

  return `Hola ${nombre}, ¿cómo estás? Te escribo desde ${empresaNombre} para coordinar tu turno de instalación.${paquete} Cuando puedas, indicame qué día y franja horaria te queda mejor. ¡Muchas gracias!`
}

export const buildVentaWhatsappUrl = (venta: { telefono?: string | null, cliente?: string | null, paquete_nombre?: string | null, empresa?: string | null }) => {
  const phone = normalizePhone(venta?.telefono)
  if (!phone) return ''

  const text = encodeURIComponent(buildVentaWhatsappMessage(venta))
  return `https://wa.me/${phone}?text=${text}`
}
