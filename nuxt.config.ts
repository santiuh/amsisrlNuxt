export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase', '@nuxt/ui'],

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
  },

  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/forgot-password', '/new-password', '/cambiar-contrasena'],
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  runtimeConfig: {
    // Gemini — Asistente IA del admin (server/api/asistente/chat.post.ts).
    // Sin key el endpoint responde 503. En Vercel: cargar GEMINI_API_KEY.
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },

  nitro: {
    // El asistente hace varias rondas modelo→SQL→modelo: necesita más que los
    // ~10s default de Vercel para funciones serverless.
    vercel: {
      functions: { maxDuration: 60 },
    },
  },

  app: {
    layoutTransition: { name: 'layout', mode: 'out-in' },
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  ssr: false,

  compatibilityDate: '2025-02-19',
})
