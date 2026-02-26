export default defineNuxtRouteMiddleware(async (to) => {
  const profile = useCurrentProfile()

  // Si no hay profile, intentar obtenerlo
  if (!profile.value) {
    await useFetchProfile()
  }

  // Proteger rutas /admin/* solo para admin
  if (to.path.startsWith('/admin') && profile.value?.rol !== 'admin') {
    return navigateTo('/dashboard')
  }
})
