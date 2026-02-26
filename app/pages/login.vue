<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md px-4">
      <UCard class="shadow-lg">
        <template #header>
          <div class="text-center py-2">
            <h1 class="text-2xl font-bold text-gray-900">AMSI SRL</h1>
            <p class="text-sm text-gray-500 mt-1">Sistema de Gestión de Ventas</p>
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Email">
            <UInput
              v-model="form.email"
              type="email"
              placeholder="tu@email.com"
              icon="i-heroicons-envelope"
              class="w-full"
            />
          </UFormGroup>

          <UFormGroup label="Contraseña">
            <UInput
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              icon="i-heroicons-lock-closed"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  variant="link"
                  color="gray"
                  :padded="false"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
          </UFormGroup>

          <UAlert
            v-if="errorMsg"
            icon="i-heroicons-exclamation-circle"
            color="red"
            variant="soft"
            :title="errorMsg"
          />

          <UButton
            block
            :loading="loading"
            label="Ingresar"
            @click="login"
          />
        </div>

        <template #footer>
          <div class="text-center">
            <NuxtLink to="/forgot-password" class="text-sm text-primary-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </NuxtLink>
          </div>
        </template>
      </UCard>

      <p class="text-center text-xs text-gray-400 mt-4">
        Desarrollado por
        <a href="https://soldemayosoft.com.ar" target="_blank" class="hover:underline text-gray-500">
          SolDeMayoSoft
        </a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const client = useSupabaseClient()
const form = reactive({ email: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')
const showPassword = ref(false)

const login = async () => {
  if (!form.email || !form.password) {
    errorMsg.value = 'Completá email y contraseña.'
    return
  }
  loading.value = true
  errorMsg.value = ''
  const { error } = await client.auth.signInWithPassword({
    email: form.email,
    password: form.password,
  })
  if (error) {
    errorMsg.value = 'Email o contraseña incorrectos.'
    loading.value = false
    return
  }
  await navigateTo('/dashboard')
}

useHead({ title: 'Ingresar — AMSI SRL' })
</script>
