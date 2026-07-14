// Restringe una página a rol admin. Se aplica con
// definePageMeta({ middleware: ['admin'] }). Los no-admin van al dashboard.
export default defineNuxtRouteMiddleware(async () => {
  const profile = useCurrentProfile()
  if (!profile.value) {
    await useFetchProfile()
  }
  if (profile.value?.rol !== 'admin') {
    return navigateTo('/dashboard')
  }
})
