export interface Profile {
  id: string
  nombre: string
  email: string
  rol: 'vendedor' | 'oficinista' | 'admin'
  created_at: string
}

export const useCurrentProfile = () => {
  return useState<Profile | null>('current-profile', () => null)
}

export const useFetchProfile = async () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()
  const profile = useCurrentProfile()

  if (!user.value) {
    profile.value = null
    return
  }

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.value.id)
    .single()

  if (!error && data) {
    profile.value = data as Profile
  }
}
