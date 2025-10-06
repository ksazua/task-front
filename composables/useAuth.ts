interface LoginCredentials {
  email: string
  password: string
}

interface User {
  id: number
  name: string
  email: string
  created_at?: string
}

interface SessionResponse {
  success: boolean
  isAuthenticated: boolean
  user?: User
  message?: string
}

interface LoginResult {
  success: boolean
  message: string
  statusCode?: number
}

export const useAuth = () => {
  const router = useRouter()
  
  // Estado del usuario (solo para mostrar en UI, NO tokens)
  const user = useState<User | null>('auth_user', () => null)
  const isAuthenticated = computed(() => !!user.value)

  // Obtener sesión del servidor (validación segura)
  const fetchSession = async (): Promise<SessionResponse> => {
    try {
      const response = await $fetch<SessionResponse>('/api/auth/session', {
        method: 'GET',
        credentials: 'include' // Incluir cookies httpOnly
      })

      if (response.success && response.user) {
        user.value = response.user
        return {
          success: true,
          isAuthenticated: true,
          user: response.user
        }
      }

      user.value = null
      return {
        success: false,
        isAuthenticated: false
      }
    } catch (error: any) {
      user.value = null
      return {
        success: false,
        isAuthenticated: false,
        message: error.data?.message || 'Sesión no encontrada'
      }
    }
  }  // Login (el servidor maneja la cookie httpOnly)
  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    try {
      const response = await $fetch<any>('/api/auth/login', {
        method: 'POST',
        body: credentials,
        credentials: 'include' // Incluir cookies httpOnly
      })

      if (response.success && response.user) {
        // Guardar usuario en estado (el token está en httpOnly cookie)
        user.value = response.user
        
        return { 
          success: true, 
          message: response.message || 'Inicio de sesión exitoso',
          statusCode: 200
        }
      }

      return { 
        success: false, 
        message: response.message || 'Error al iniciar sesión',
        statusCode: 401
      }
    } catch (error: any) {
      const statusCode = error.statusCode || error.response?.status || 500
      const message = error.data?.message || error.message || 'Error al conectar con el servidor'
      
      return { 
        success: false, 
        message,
        statusCode
      }
    }
  }

  // Logout (limpia la cookie httpOnly del servidor)
  const logout = async () => {
    // Limpiar estado local primero
    user.value = null
    
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      // Error silencioso en logout
    }
    
    // Forzar navegación después de limpiar estado
    await navigateTo('/login', { replace: true })
  }

  // Cerrar sesión por expiración de token (sin llamar al backend)
  const clearSession = async () => {
    // Limpiar estado local
    user.value = null
    
    // Limpiar almacenamiento local
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear()
    }
    
    // Redireccionar a login usando navigateTo
    await navigateTo('/login', { replace: true })
  }

  // Verificar autenticación (obtiene sesión del servidor)
  const checkAuth = async (): Promise<boolean> => {
    const session = await fetchSession()
    return session.isAuthenticated
  }

  return {
    user: readonly(user),
    isAuthenticated,
    login,
    logout,
    clearSession,
    checkAuth,
    fetchSession
  }
}
