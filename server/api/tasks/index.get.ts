import { getUserSession } from '~/server/utils/session'
import type { ApiTasksResponse } from '~/types/api'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  try {
    // Obtener la sesión del usuario
    const session = await getUserSession(event)
    
    if (!session?.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado - Token requerido'
      })
    }

    // 🔍 IMPRIMIR ACCESS TOKEN EN CONSOLA (como solicitaste)
    console.log('🔑 ACCESS TOKEN ENVIADO:', session.accessToken)
    console.log('👤 USUARIO:', session.user?.email || session.user?.name || 'Usuario desconocido')

    // Llamar a la API externa
    const apiUrl = `${config.public.apiBase}/tasks`
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
      'Accept': 'application/json',
      'User-Agent': 'Nuxt-Task-Frontend'
    }
    
    console.log('🔗 Calling external API:', apiUrl)
    console.log('📋 Headers being sent:', headers)
    console.log('🎯 Method: GET')
    
    const response = await $fetch<ApiTasksResponse>(apiUrl, {
      method: 'GET',
      headers
    })

    console.log('✅ API Response received:', {
      success: response.success,
      message: response.message,
      taskCount: response.data?.length || 0
    })

    return response
  } catch (error: any) {
    console.error('❌ Error en /api/tasks:', error)
    console.error('🔍 Error details:', {
      statusCode: error.statusCode,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.data,
      message: error.message,
      cause: error.cause
    })
    
    // Si hay respuesta del servidor, log más detalles
    if (error.response) {
      console.error('📋 Response headers:', error.response.headers)
      console.error('📄 Response body:', error.response._data || error.response.data)
    }
    
    const statusCode = error.statusCode || error.response?.status || 500
    const errorMessage = error.message || error.data?.message || 'Error al obtener tareas'
    
    throw createError({
      statusCode,
      statusMessage: errorMessage,
      data: {
        success: false,
        message: errorMessage,
        details: error.data || error.response?._data
      }
    })
  }
})