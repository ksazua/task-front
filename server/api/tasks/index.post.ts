import { getUserSession } from '~/server/utils/session'
import { fetchFromRailway } from '~/server/utils/railway'
import type { ApiTasksResponse, CreateTaskPayload } from '~/types/api'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event) as CreateTaskPayload
  
  try {
    // Obtener la sesión del usuario
    const session = await getUserSession(event)
    
    if (!session?.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado - Token requerido'
      })
    }

    console.log('🔑 ACCESS TOKEN ENVIADO (CREATE):', session.accessToken)
    console.log('👤 USUARIO:', session.user?.email || session.user?.name || 'Usuario desconocido')
    console.log('📝 DATOS TAREA:', body)

    // Llamar a la API externa para crear tarea
    const apiUrl = `${config.public.apiBase}/tasks`
    console.log('🔗 Creating task at:', apiUrl)
    
    const response = await fetchFromRailway(apiUrl, session.accessToken, 'POST', body) as ApiTasksResponse

    console.log('✅ Task created successfully:', response)
    return response
  } catch (error: any) {
    console.error('❌ Error creating task:', error)
    
    const statusCode = error.statusCode || error.response?.status || 500
    const errorMessage = error.message || error.data?.message || 'Error al crear tarea'
    
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