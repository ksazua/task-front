import { getUserSession } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    
    if (!session) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autenticado',
        data: {
          success: false,
          isAuthenticated: false,
          message: 'Sesión no encontrada'
        }
      })
    }

    // Retornar solo información del usuario (NO tokens) + expiresAt para auto-refresh
    return {
      success: true,
      isAuthenticated: true,
      user: session.user,
      expiresAt: session.expiresAt
    }
  } catch (error: any) {
    console.error('Session check error:', error)
    
    throw createError({
      statusCode: 401,
      statusMessage: 'Sesión inválida',
      data: {
        success: false,
        isAuthenticated: false,
        message: 'Sesión expirada o inválida'
      }
    })
  }
})
