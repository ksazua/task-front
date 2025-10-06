export default defineNuxtPlugin(async () => {
  if (!process.client) {
    return
  }

  const route = useRoute()
  const publicRoutes = ['/login', '/registro', '/']

  if (publicRoutes.includes(route.path)) {
    return
  }

  const { fetchSession } = useAuth()

  try {
    await fetchSession()
  } catch (error) {
    // Error silencioso al obtener sesión
  }
})
