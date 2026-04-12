<template>
  <NuxtLayout :name="esPrimerLogin ? 'auth' : 'default'">
    <!-- Forzado: pantalla completa -->
    <div v-if="esPrimerLogin" class="min-h-screen flex items-center justify-center bg-[#f4f6f8] dark:bg-[#080e1a]">
      <div class="w-full max-w-md px-4">
        <UCard class="shadow-lg">
          <template #header>
            <div class="text-center py-2">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">AMSI SRL</h1>
              <p class="text-sm text-gray-500 mt-1">Cambiar contraseña</p>
            </div>
          </template>

          <div class="space-y-4">
            <UAlert
              icon="i-heroicons-exclamation-triangle"
              color="amber"
              variant="soft"
              title="Debés cambiar tu contraseña para continuar"
              description="Tu cuenta fue creada con una contraseña genérica. Elegí una nueva contraseña segura."
            />

            <UFormGroup label="Nueva contraseña">
              <UInput
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Mínimo 6 caracteres"
                icon="i-heroicons-lock-closed"
                class="w-full"
              >
                <template #trailing>
                  <UButton
                    :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                    variant="link"
                    color="gray"
                    :padded="false"
                    class="pointer-events-auto"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </UInput>
            </UFormGroup>

            <UFormGroup label="Repetir contraseña">
              <UInput
                v-model="form.confirm"
                :type="showConfirm ? 'text' : 'password'"
                placeholder="Repetí la contraseña"
                icon="i-heroicons-lock-closed"
                class="w-full"
              >
                <template #trailing>
                  <UButton
                    :icon="showConfirm ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                    variant="link"
                    color="gray"
                    :padded="false"
                    class="pointer-events-auto"
                    @click="showConfirm = !showConfirm"
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
              label="Guardar contraseña"
              @click="guardar"
            />
          </div>
        </UCard>
      </div>
    </div>

    <!-- Voluntario: dentro del layout default con sidebar -->
    <div v-else class="max-w-md mx-auto py-8 px-4">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-key" class="w-5 h-5 text-primary-500" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Cambiar contraseña</h2>
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Nueva contraseña">
            <UInput
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Mínimo 6 caracteres"
              icon="i-heroicons-lock-closed"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  variant="link"
                  color="gray"
                  :padded="false"
                  class="pointer-events-auto"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
          </UFormGroup>

          <UFormGroup label="Repetir contraseña">
            <UInput
              v-model="form.confirm"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="Repetí la contraseña"
              icon="i-heroicons-lock-closed"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  :icon="showConfirm ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  variant="link"
                  color="gray"
                  :padded="false"
                  class="pointer-events-auto"
                  @click="showConfirm = !showConfirm"
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
            label="Guardar contraseña"
            @click="guardar"
          />
        </div>
      </UCard>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const profile = useCurrentProfile()
const toast = useToast()

const form = reactive({ password: '', confirm: '' })
const showPassword = ref(false)
const showConfirm = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const esPrimerLogin = computed(() => profile.value?.must_change_password === true)

const guardar = async () => {
  errorMsg.value = ''

  if (form.password.length < 6) {
    errorMsg.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  if (form.password !== form.confirm) {
    errorMsg.value = 'Las contraseñas no coinciden.'
    return
  }

  loading.value = true

  try {
    await $fetch('/api/cambiar-contrasena', {
      method: 'POST',
      body: { password: form.password },
    })

    if (profile.value) {
      profile.value.must_change_password = false
    }

    toast.add({ title: 'Contraseña actualizada', color: 'green' })
    loading.value = false
    await navigateTo('/dashboard')
  } catch (err: any) {
    errorMsg.value = err.data?.statusMessage || 'No se pudo cambiar la contraseña. Intentá de nuevo.'
    loading.value = false
  }
}

useHead({ title: 'Cambiar contraseña — AMSI SRL' })
</script>
