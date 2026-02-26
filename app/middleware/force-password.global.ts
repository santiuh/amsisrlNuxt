export default defineNuxtRouteMiddleware((to) => {
  const rutasLibres = ['/login', '/forgot-password', '/new-password', '/cambiar-contrasena']
  if (rutasLibres.some(r => to.path.startsWith(r))) return

  const profile = useCurrentProfile()
  if (!profile.value) return

  if (profile.value.must_change_password) {
    return navigateTo('/cambiar-contrasena')
  }
})
