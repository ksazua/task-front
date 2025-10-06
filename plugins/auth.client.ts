export default defineNuxtPlugin(async () => {
  const { fetchSession, user } = useAuth()

  // Obtener sesión del servidor al cargar la app
  if (process.client) {
    try {
      await fetchSession()
      console.log('Plugin auth: sesión obtenida del servidor', {
        hasUser: !!user.value,
        user: user.value
      })
    } catch (error) {
      console.log('Plugin auth: no hay sesión activa')
    }
  }
})
