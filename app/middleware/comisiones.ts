export default defineNuxtRouteMiddleware(async () => {
  const profile = useCurrentProfile()

  if (!profile.value) {
    await useFetchProfile()
  }

  // El admin tiene su propia pantalla (/admin/comisiones: ciclos, todos los
  // vendedores, pagos). "Mis Comisiones" es solo para el resto de los roles.
  if (profile.value?.rol === 'admin') {
    return navigateTo('/admin/comisiones')
  }
})
