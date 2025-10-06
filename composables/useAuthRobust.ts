// Composable alternativo para manejar autenticación de manera más robusta
export const useAuthRobust = () => {
  const user = ref(null)
  const isAuthenticated = computed(() => !!user.value)
  const isLoading = ref(false)

  // Función para verificar sesión con retry
  const checkSession = async (retries = 3): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await $fetch('/api/auth/session', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })

        if (response?.success && response?.isAuthenticated) {
          user.value = response.user
          return true
        }
      } catch (error: any) {
        if (i === retries - 1) {
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
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials,
        credentials: 'include'
      })

      if (response?.success) {
        user.value = response.user
        return { success: true, user: response.user }
      } else {
        throw new Error(response?.message || 'Login failed')
      }
    } catch (error: any) {
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
      // Error silencioso en logout
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