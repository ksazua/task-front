import { setUserSession } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  try {
    // Llamar al backend API para registro
    const response = await $fetch<any>(`${config.public.apiBase}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email: body.email,
        name: body.name,
        password: body.password
      }
    })

    // Si el registro fue exitoso, crear sesión segura automáticamente
    if (response.success && response.data?.access_token) {
      // Calcular fecha de expiración (7 días)
      const expiresAt = Date.now() + (60 * 60 * 24 * 7 * 1000)
      
      // Guardar sesión en cookie httpOnly (async) - auto login después del registro
      await setUserSession(event, {
        user: response.data.user,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt
      })

      return {
        success: true,
        message: response.message || 'Registro exitoso',
        data: response.data.user
      }
    }

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Registro exitoso',
        data: response.data
      }
    }

    // Retornar error del backend
    return {
      success: false,
      message: response.message || 'Error en el registro'
    }
  } catch (error: any) {
    // Extraer información del error del backend
    const statusCode = error.statusCode || error.response?.status || 500
    const errorData = error.data || {}
    
    // Si el backend retorna un objeto con success: false
    if (errorData.success === false) {
      throw createError({
        statusCode: statusCode,
        statusMessage: errorData.message || 'Error de registro',
        data: {
          success: false,
          message: errorData.message || 'Error de registro'
        }
      })
    }
    
    // Error genérico
    throw createError({
      statusCode: statusCode,
      statusMessage: error.message || 'Error de registro',
      data: {
        success: false,
        message: error.message || 'Error al conectar con el servidor'
      }
    })
  }
})