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
