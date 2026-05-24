export default defineNuxtRouteMiddleware(async (to) => {
  const profile = useCurrentProfile()

  if (!profile.value) {
    await useFetchProfile()
  }

  const me = profile.value
  if (!me) return

  const targetId = to.params.id as string | undefined
  if (!targetId) return

  // Vendedor solo puede ver su propio perfil
  if (me.rol === 'vendedor' && targetId !== me.id) {
    return navigateTo(`/perfil/${me.id}`)
  }
})
