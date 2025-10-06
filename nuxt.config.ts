import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-10-04',
  devtools: { enabled: true },
  ssr: true,

  css: [
    '~/assets/css/theme.css', // ← tu “globals.css”
    '~/assets/css/tailwind.css',  // ← contiene @import "tailwindcss";
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  modules: [
    '@pinia/nuxt',
    'shadcn-nuxt',
  ],

  shadcn: {
    prefix: '',
    componentDir: './components/ui',
  },

  runtimeConfig: {
    // Variables privadas (solo server)
    sessionSecret: process.env.SESSION_SECRET || 'default-secret-key-change-in-production',
    
    // Variables públicas
    public: { 
      appName: 'TaskFront',
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000/api/v1'
    }
  },

  // Suprimir warnings de componentes duplicados (shadcn-nuxt usa index.ts)
  ignore: [
    '**/components/ui/**/index.ts'
  ],
});
