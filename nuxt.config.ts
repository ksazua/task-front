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
    public: { appName: 'TaskFront' }
  },
});
