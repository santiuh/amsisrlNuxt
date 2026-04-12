<template>
  <div class="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#f4f4f4] px-4 dark:bg-[#071225]">
    <div class="pointer-events-none absolute inset-0 hidden dark:block">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(26,64,124,0.38),transparent_58%)]" />
      <div class="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.03),transparent_30%,rgba(255,255,255,0.02)_65%,transparent)]" />
      <div class="absolute inset-0 opacity-30 [background-size:3px_3px] [background-image:radial-gradient(circle,rgba(255,255,255,0.22)_0.5px,transparent_0.5px)]" />
    </div>

    <div class="relative w-full max-w-[420px] rounded-2xl border border-gray-100 bg-white p-7 shadow-xl md:p-8 dark:border-white/15 dark:bg-white/10 dark:backdrop-blur-md dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div class="text-center">
        <img
          src="/img/logo.png"
          alt="AMSI SRL"
          class="mx-auto h-28 w-auto object-contain"
        />
        <h1 class="mt-2 text-4xl leading-none font-extrabold tracking-tight text-[#17355b] drop-shadow-[0_0_20px_rgba(6,182,212,0.35)] dark:text-white/90 dark:drop-shadow-[0_0_25px_rgba(6,182,212,0.45)]">Recuperar contraseña</h1>
        <p class="mt-3 text-base text-gray-500 dark:text-white/60">Te enviaremos un email para resetear tu contraseña</p>
      </div>

      <form class="mt-8 space-y-4" @submit.prevent="resetPassword">
        <ErrorAlert :error-msg="authError" @clearError="clearError" />
        <SuccessAlert :success-msg="authSuccess" @clearSuccess="clearSuccess" />

        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-white/45">
            <UIcon name="i-heroicons-envelope" class="h-5 w-5" />
          </span>
          <input
            v-model="email"
            type="email"
            placeholder="tu@email.com"
            class="h-12 w-full rounded-lg border border-gray-300 bg-white pl-11 pr-4 text-base text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-white/20 dark:bg-white/5 dark:text-white/85 dark:placeholder:text-white/35 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="h-12 w-full rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-lg font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        >
          {{ loading ? 'Enviando...' : 'Enviar enlace' }}
        </button>
      </form>

      <div class="mt-5 text-center">
        <NuxtLink to="/login" class="text-sm font-medium text-sky-600 hover:underline dark:text-cyan-400">
          Volver al login
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Recuperar contraseña — AMSI SRL' })

const email = ref('')
const client = useSupabaseClient()
const loading = ref(false)
const authSuccess = ref('')
const authError = ref('')

const resetPassword = async () => {
  loading.value = true
  const { error } = await client.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${window.location.origin}/new-password`,
  })
  if (error) {
    loading.value = false
    authError.value = error.message
    setTimeout(() => { authError.value = '' }, 5000)
  } else {
    loading.value = false
    authSuccess.value = 'Te enviamos un email con instrucciones.'
    setTimeout(() => { authSuccess.value = '' }, 5000)
  }
}

const clearError = () => { authError.value = '' }
const clearSuccess = () => { authSuccess.value = '' }
</script>
