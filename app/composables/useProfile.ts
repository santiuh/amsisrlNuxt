import type { AvatarConfig } from '~/utils/avatar'

export interface Profile {
  id: string
  nombre: string
  email: string
  rol: 'vendedor' | 'oficinista' | 'admin' | 'lider'
  grupo_id: string | null
  created_at: string
  must_change_password: boolean
  avatar_config: AvatarConfig | null
}

export const useCurrentProfile = () => {
  return useState<Profile | null>('current-profile', () => null)
}

export const useFetchProfile = async () => {
  const user = useSupabaseUser()
  const profile = useCurrentProfile()

  if (!user.value) {
    profile.value = null
    return
  }

  try {
    const data = await $fetch('/api/profile')
    profile.value = data as Profile
  } catch {
    profile.value = null
  }
}
