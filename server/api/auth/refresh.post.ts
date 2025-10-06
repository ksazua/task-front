import { getUserSession, setUserSession } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  try {
    // Obtener sesión actual
    const session = await getUserSession(event)
    
    if (!session || !session.refreshToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No hay sesión activa',
        data: {
          success: false,
          message: 'Refresh token no encontrado'
        }
      })
    }

    // Llamar al backend para renovar el access_token
    const response = await $fetch<any>(`${config.public.apiBase}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        refresh_token: session.refreshToken
      }
    })

    if (response.success && response.data?.access_token) {
      // Actualizar la sesión con el nuevo access_token
      const updatedSession = {
        ...session,
        accessToken: response.data.access_token,
        // Extender la expiración por 7 días más
        expiresAt: Date.now() + (60 * 60 * 24 * 7 * 1000)
      }

      await setUserSession(event, updatedSession)

      return {
        success: true,
        message: 'Token renovado exitosamente'
      }
    }

    throw createError({
      statusCode: 401,
      statusMessage: 'Error renovando token',
      data: {
        success: false,
        message: response.message || 'No se pudo renovar el token'
      }
    })
  } catch (error: any) {
    const statusCode = error.statusCode || 401
    const message = error.data?.message || error.message || 'Error renovando token'
    
    throw createError({
      statusCode,
      statusMessage: message,
      data: {
        success: false,
        message
      }
    })
  }
})
