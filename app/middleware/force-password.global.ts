export default defineNuxtRouteMiddleware(async (to) => {
  const rutasLibres = ['/login', '/forgot-password', '/new-password']
  if (rutasLibres.some(r => to.path.startsWith(r))) return

  const profile = useCurrentProfile()

  if (!profile.value) {
    await useFetchProfile()
  }

  if (!profile.value) return // No autenticado, @nuxtjs/supabase lo maneja

  if (profile.value.must_change_password) {
    return navigateTo('/cambiar-contrasena')
  }
})
