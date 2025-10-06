import { setUserSession } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  try {
    // Llamar al backend API
    const response = await $fetch<any>(`${config.public.apiBase}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email: body.email,
        password: body.password
      }
    })

    // Si el login fue exitoso, crear sesión segura
    if (response.success && response.data?.access_token) {
      // Calcular fecha de expiración (7 días)
      const expiresAt = Date.now() + (60 * 60 * 24 * 7 * 1000)
      
      console.log('Usuario del backend:', response.data.user)
      
      // Guardar sesión en cookie httpOnly (async)
      await setUserSession(event, {
        user: response.data.user,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt
      })

      console.log('Sesión guardada exitosamente')

      // Retornar respuesta sin tokens (ya están en cookie segura)
      return {
        success: true,
        message: response.message || 'Inicio de sesión exitoso',
        user: response.data.user
      }
    }

    // Retornar error del backend
    return {
      success: false,
      message: response.message || 'Error de autenticación'
    }
  } catch (error: any) {
    console.error('API Login error:', error)
    
    // Extraer información del error del backend
    const statusCode = error.statusCode || error.response?.status || 500
    const errorData = error.data || {}
    
    // Si el backend retorna un objeto con success: false
    if (errorData.success === false) {
      throw createError({
        statusCode: statusCode,
        statusMessage: errorData.message || 'Error de autenticación',
        data: {
          success: false,
          message: errorData.message || 'Error de autenticación'
        }
      })
    }
    
    // Error genérico
    throw createError({
      statusCode: statusCode,
      statusMessage: error.message || 'Error de autenticación',
      data: {
        success: false,
        message: error.message || 'Error al conectar con el servidor'
      }
    })
  }
})
