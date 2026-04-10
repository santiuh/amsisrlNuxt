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
          class="mx-auto h-24 w-auto object-contain"
        />
        <h1 class="mt-2 text-5xl leading-none font-extrabold tracking-tight text-[#17355b] drop-shadow-[0_0_20px_rgba(6,182,212,0.35)] dark:text-white/90 dark:drop-shadow-[0_0_25px_rgba(6,182,212,0.45)]">AMSI S.R.L.</h1>
        <p class="mt-5 text-2xl leading-tight font-semibold text-[#0f172a] dark:text-white/70">Iniciar Sesión</p>
      </div>

      <form class="mt-8 space-y-4" @submit.prevent="login">
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-white/45">
            <UIcon name="i-heroicons-user" class="h-5 w-5" />
          </span>
          <input
            v-model="form.email"
            type="email"
            placeholder="Correo electrónico"
            class="h-12 w-full rounded-lg border border-gray-300 bg-white pl-11 pr-4 text-base text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-white/20 dark:bg-white/5 dark:text-white/85 dark:placeholder:text-white/35 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20"
          />
        </div>

        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-white/45">
            <UIcon name="i-heroicons-lock-closed" class="h-5 w-5" />
          </span>
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Contraseña"
            class="h-12 w-full rounded-lg border border-gray-300 bg-white pl-11 pr-11 text-base text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-white/20 dark:bg-white/5 dark:text-white/85 dark:placeholder:text-white/35 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-white/45 dark:hover:text-white/70"
            @click="showPassword = !showPassword"
          >
            <UIcon :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="h-5 w-5" />
          </button>
        </div>

        <UAlert
          v-if="errorMsg"
          icon="i-heroicons-exclamation-circle"
          color="red"
          variant="soft"
          :title="errorMsg"
        />

        <div class="flex items-center justify-between text-sm">
          <label class="inline-flex items-center gap-2 text-gray-600 select-none dark:text-white/60">
            <input
              v-model="rememberMe"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 dark:border-white/30 dark:bg-transparent dark:checked:border-cyan-400 dark:checked:bg-cyan-500"
            />
            Recordarme
          </label>
          <NuxtLink to="/forgot-password" class="font-medium text-sky-600 hover:underline dark:text-cyan-400">
            Olvidé mi contraseña
          </NuxtLink>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="h-12 w-full rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-lg font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        >
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>

      <a href="https://soldemayosoft.com.ar" target="_blank" class="mt-8 block text-center">
        <img src="/img/logo-soldemayosoft.png" alt="SolDeMayoSoft" class="h-14 mx-auto" />
      </a>
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
const rememberMe = ref(false)

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
