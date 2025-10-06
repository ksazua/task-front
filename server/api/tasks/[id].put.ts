import { getUserSession } from '~/server/utils/session'
import { fetchFromRailway } from '~/server/utils/railway'
import type { ApiTasksResponse, CreateTaskPayload } from '~/types/api'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const taskId = getRouterParam(event, 'id')
  const body = await readBody(event) as Partial<CreateTaskPayload>
  
  try {
    // Obtener la sesión del usuario
    const session = await getUserSession(event)
    
    if (!session?.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado - Token requerido'
      })
    }

    console.log('🔑 ACCESS TOKEN ENVIADO (UPDATE):', session.accessToken)
    console.log('👤 USUARIO:', session.user?.email || session.user?.name || 'Usuario desconocido')
    console.log('🔄 ACTUALIZANDO TAREA ID:', taskId)
    console.log('📝 DATOS ACTUALIZACION:', body)

    // Llamar a la API externa para actualizar tarea
    const apiUrl = `${config.public.apiBase}/tasks/${taskId}`
    console.log('🔗 Updating task at:', apiUrl)
    
    const response = await fetchFromRailway(apiUrl, session.accessToken, 'PUT', body) as ApiTasksResponse

    console.log('✅ Task updated successfully:', response)
    return response
  } catch (error: any) {
    console.error('❌ Error updating task:', error)
    
    const statusCode = error.statusCode || error.response?.status || 500
    const errorMessage = error.message || error.data?.message || 'Error al actualizar tarea'
    
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