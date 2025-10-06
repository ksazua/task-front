import { getUserSession } from '~/server/utils/session'
import { fetchFromRailway } from '~/server/utils/railway'
import type { ApiTasksResponse } from '~/types/api'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const taskId = getRouterParam(event, 'id')
  
  try {
    // Obtener la sesión del usuario
    const session = await getUserSession(event)
    
    if (!session?.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado - Token requerido'
      })
    }

    console.log('🔑 ACCESS TOKEN ENVIADO (DELETE):', session.accessToken)
    console.log('👤 USUARIO:', session.user?.email || session.user?.name || 'Usuario desconocido')
    console.log('🗑️ ELIMINANDO TAREA ID:', taskId)

    // Llamar a la API externa para eliminar tarea
    const apiUrl = `${config.public.apiBase}/tasks/${taskId}`
    console.log('🔗 Deleting task at:', apiUrl)
    
    const response = await fetchFromRailway(apiUrl, session.accessToken, 'DELETE') as ApiTasksResponse

    console.log('✅ Task deleted successfully:', response)
    return response
  } catch (error: any) {
    console.error('❌ Error deleting task:', error)
    
    const statusCode = error.statusCode || error.response?.status || 500
    const errorMessage = error.message || error.data?.message || 'Error al eliminar tarea'
    
    throw createError({
      statusCode,
      statusMessage: errorMessage,
      data: {
        success: false,
        message: errorMessage
      }
    })
  }
})