export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase', '@nuxt/ui', '@nuxthub/core'],

  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: [],
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

  compatibilityDate: '2025-02-19',
})
