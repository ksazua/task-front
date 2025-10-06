// Composable alternativo para manejar autenticación de manera más robusta
export const useAuthRobust = () => {
  const user = ref(null)
  const isAuthenticated = computed(() => !!user.value)
  const isLoading = ref(false)

  // Función para verificar sesión con retry
  const checkSession = async (retries = 3): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`🔍 Intento ${i + 1} de verificar sesión`)
        
        const response = await $fetch('/api/auth/session', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })

        if (response?.success && response?.isAuthenticated) {
          user.value = response.user
          console.log('✅ Sesión válida encontrada')
          return true
        }
      } catch (error: any) {
        console.warn(`❌ Intento ${i + 1} falló:`, error.message)
        
        if (i === retries - 1) {
          console.error('❌ Todos los intentos fallaron')
          user.value = null
          return false
        }
        
        // Esperar un poco antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return false
  }

  // Función para login con manejo robusto
  const login = async (credentials: { email: string; password: string }) => {
    isLoading.value = true
    
    try {
      console.log('🔐 Intentando login...')
      
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials,
        credentials: 'include'
      })

      if (response?.success) {
        user.value = response.user
        console.log('✅ Login exitoso')
        return { success: true, user: response.user }
      } else {
        throw new Error(response?.message || 'Login failed')
      }
    } catch (error: any) {
      console.error('❌ Login error:', error)
      user.value = null
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Función para logout
  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.warn('Error en logout:', error)
    } finally {
      user.value = null
      await navigateTo('/login')
    }
  }

  return {
    user: readonly(user),
    isAuthenticated,
    isLoading: readonly(isLoading),
    checkSession,
    login,
    logout
  }
}